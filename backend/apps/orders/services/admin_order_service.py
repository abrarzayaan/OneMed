from django.db import transaction
from django.utils import timezone

from rest_framework.exceptions import ValidationError

from apps.orders.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
)

from apps.orders.constants import (
    ORDER_STATUS_TRANSITIONS,
)

from apps.orders.choices import (
    OrderStatus,
)

from apps.products.models.inventories import (
    Inventory,
    InventoryStatusChoices,
)

from apps.profiles.models import (
    VendorProfile as Vendor,
    RiderProfile,
)


# class AdminOrderService:

#     @classmethod
#     @transaction.atomic
#     def assign_vendor(cls, order):
#         pass

#     @classmethod
#     @transaction.atomic
#     def assign_rider(cls, order, rider):
#         pass

#     @classmethod
#     @transaction.atomic
#     def confirm_order(cls, order):
#         pass

#     @classmethod
#     @transaction.atomic
#     def change_status(cls, order, status):
#         pass

#     @classmethod
#     def validate_inventory(cls, order):
#         pass

#     @classmethod
#     def deduct_inventory(cls, order):
#         pass



class AdminOrderService:

    @classmethod
    @transaction.atomic
    def assign_vendor(
        cls,
        *,
        order: Order,
        items: list,
        changed_by,
    ):
        """
        Assign vendors to individual order items.

        Expected payload:

        [
            {
                "order_item_id": 1,
                "vendor_id": 3,
            },
            {
                "order_item_id": 2,
                "vendor_id": 5,
            }
        ]
        """

        order_items = {
            item.id: item
            for item in order.items.select_related(
                "product_variant",
                "vendor",
            )
        }

        for payload in items:

            order_item_id = payload.get("order_item_id")
            vendor_id = payload.get("vendor_id")

            if order_item_id not in order_items:
                raise ValidationError(
                    f"OrderItem ({order_item_id}) does not belong to this order."
                )

            try:
                vendor = Vendor.objects.get(
                    id=vendor_id,
                )

            except Vendor.DoesNotExist:
                raise ValidationError(
                    f"Vendor ({vendor_id}) does not exist."
                )

            cls._validate_vendor(vendor)

            order_item = order_items[order_item_id]
            order_item.vendor = vendor
            order_item.save(
                update_fields=[
                    "vendor",
                ]
            )

        cls._create_status_history(
            order=order,
            status=order.order_status,
            changed_by=changed_by,
            remarks="Vendor assigned.",
        )

        return order

    @classmethod
    @transaction.atomic
    def assign_rider(
        cls,
        *,
        order: Order,
        rider: RiderProfile,
        changed_by,
    ):
        """
        Assign rider to an order.
        """

        cls._validate_rider(rider)

        order.assigned_rider = rider

        order.save(
            update_fields=[
                "assigned_rider",
                "updated_at",
            ]
        )

        cls._create_status_history(
            order=order,
            status=order.order_status,
            changed_by=changed_by,
            remarks=f"Rider assigned ({rider.user.username}).",
        )

        return order

    # ==========================================================
    # Private Helpers
    # ==========================================================

    @staticmethod
    def _validate_vendor(vendor):
        """
        Validate vendor before assignment.
        Auto-activate & verify vendor if assigned by admin.
        """
        if vendor.status == "blocked":
            raise ValidationError(
                "Vendor account is blocked."
            )

        if vendor.status != "active" or vendor.verification_status != "verified":
            vendor.status = "active"
            vendor.verification_status = "verified"
            vendor.save(update_fields=["status", "verification_status"])

    @staticmethod
    def _validate_rider(rider):
        """
        Validate rider before assignment.
        Auto-verify & make online if assigned by admin.
        """
        if rider.verification_status == "rejected":
            raise ValidationError(
                "Rider account is rejected."
            )

        updated_fields = []
        if rider.verification_status != "verified":
            rider.verification_status = "verified"
            updated_fields.append("verification_status")

        if rider.availability_status != "online":
            rider.availability_status = "online"
            updated_fields.append("availability_status")

        if updated_fields:
            rider.save(update_fields=updated_fields)

    @staticmethod
    def _create_status_history(
        *,
        order,
        status,
        changed_by,
        remarks=None,
    ):
        """
        Store order status history.
        """

        return OrderStatusHistory.objects.create(
            order=order,
            status=status,
            changed_by=changed_by,
            remarks=remarks,
        )
    
    @classmethod
    def _validate_inventory(cls, order):
        """
        Validate inventory before confirming order.
        """

        for item in order.items.select_related(
            "vendor",
            "product_variant",
        ):

            if item.vendor is None:
                raise ValidationError(
                    f"Vendor is not assigned for Order Item ({item.id})."
                )

            try:
                inventory = Inventory.objects.select_for_update().get(
                    vendor=item.vendor,
                    variant=item.product_variant,
                )

            except Inventory.DoesNotExist:
                raise ValidationError(
                    f"Inventory not found for {item.product_variant.sku}."
                )

            if inventory.available_stock < item.quantity:
                raise ValidationError(
                    f"Insufficient stock for {item.product_variant.sku}."
                )

        return True

    @staticmethod
    def _update_inventory_status(inventory):
        """
        Update inventory status after stock deduction.
        """

        available = inventory.available_stock

        if available <= 0:
            inventory.status = InventoryStatusChoices.OUT_OF_STOCK

        elif available <= inventory.reorder_level:
            inventory.status = InventoryStatusChoices.LOW_STOCK

        else:
            inventory.status = InventoryStatusChoices.IN_STOCK

    @classmethod
    def _deduct_inventory(cls, order):
        """
        Deduct inventory for every order item.
        """

        for item in order.items.select_related(
            "vendor",
            "product_variant",
        ):

            inventory = Inventory.objects.select_for_update().get(
                vendor=item.vendor,
                variant=item.product_variant,
            )

            inventory.stock_qty -= item.quantity

            cls._update_inventory_status(
                inventory,
            )

            inventory.save(
                update_fields=[
                    "stock_qty",
                    "status",
                    "updated_at",
                ]
            )

    @classmethod
    @transaction.atomic
    def confirm_order(
        cls,
        *,
        order,
        changed_by,
    ):
        """
        Confirm placed order.
        """

        if order.order_status != OrderStatus.PLACED:
            raise ValidationError(
                "Only placed orders can be confirmed."
            )

        if order.assigned_rider is None:
            raise ValidationError(
                "Please assign a rider first."
            )

        if order.items.filter(
            vendor__isnull=True,
        ).exists():
            raise ValidationError(
                "Please assign vendors for all order items."
            )

        cls._validate_inventory(order)

        cls._deduct_inventory(order)

        if order.coupon:
            from apps.coupons.services import (
                CouponUsageService,
            )
            CouponUsageService.create_usage(order)

        order.order_status = OrderStatus.CONFIRMED
        order.confirmed_at = timezone.now()

        order.save(
            update_fields=[
                "order_status",
                "confirmed_at",
                "updated_at",
            ]
        )

        cls._create_status_history(
            order=order,
            status=OrderStatus.CONFIRMED,
            changed_by=changed_by,
            remarks="Order confirmed.",
        )

        return order
    
    @classmethod
    @transaction.atomic
    def change_order_status(
        cls,
        *,
        order,
        new_status,
        changed_by,
        remarks=None,
    ):
        """
        Change order status.
        """

        allowed_statuses = ORDER_STATUS_TRANSITIONS.get(
            order.order_status,
            [],
        )

        if new_status not in allowed_statuses:
            raise ValidationError(
                f"Cannot change status from "
                f"{order.order_status} to {new_status}."
            )

        order.order_status = new_status

        if new_status == OrderStatus.DELIVERED:
            order.delivered_at = timezone.now()

            # If payment is COD, mark payment completed
            if order.payment.method == "COD":
                order.payment.status = "PAID"
                order.payment.paid_at = timezone.now()

                order.payment.save(
                    update_fields=[
                        "status",
                        "paid_at",
                        "updated_at",
                    ]
                )

                order.payment_status = order.payment.status

        elif new_status == OrderStatus.CANCELLED:
            order.cancelled_at = timezone.now()

        order.save()

        cls._create_status_history(
            order=order,
            status=new_status,
            changed_by=changed_by,
            remarks=remarks,
        )

        return order