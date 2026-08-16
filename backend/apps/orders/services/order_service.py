from uuid import uuid4

# pyrefly: ignore [missing-import]
from django.db import transaction

from apps.cart.models import Cart
from apps.checkout.services import CheckoutService
from apps.orders.constants import (
    ADDRESS_SNAPSHOT_FIELDS,
    COUPON_SNAPSHOT_FIELDS,
    ORDER_NUMBER_PREFIX,
)
from apps.orders.models import Order, OrderItem
from apps.orders.services.payment_service import PaymentService


class OrderService:

    @classmethod
    @transaction.atomic
    def create_order(cls, consumer, validated_data):
        payment_method = validated_data["payment_method"]

        checkout = CheckoutService.calculate_checkout(
            user=consumer.user,
            address_id=validated_data["address"].id,
            coupon_code=validated_data.get("coupon_code"),
        )

        cart = checkout["cart"]

        order = cls._create_order(
            consumer=consumer,
            address=checkout["address"],
            coupon=checkout["coupon"],
            subtotal=checkout["subtotal"],
            discount=checkout["discount"],
            tax=checkout["tax"],
            delivery_charge=checkout["delivery_charge"],
            grand_total=checkout["grand_total"],
            payment_method=payment_method,
        )

        cls._create_order_items(
            order=order,
            cart_items=cart.items.select_related(
                "product_variant",
                "product_variant__product",
            ),
        )

        PaymentService.create_payment(order)

        cart.items.all().delete()

        return order

    @classmethod
    @transaction.atomic
    def create_direct_order(cls, consumer, validated_data):
        """Create a Buy Now order while leaving the consumer's cart unchanged."""
        checkout = CheckoutService.calculate_direct_checkout(
            user=consumer.user,
            variant_id=validated_data["product_variant_id"],
            quantity=validated_data["quantity"],
            address_id=validated_data["address"].id,
            coupon_code=validated_data.get("coupon_code"),
        )
        order = cls._create_order(
            consumer=consumer,
            address=checkout["address"],
            coupon=checkout["coupon"],
            subtotal=checkout["subtotal"],
            discount=checkout["discount"],
            tax=checkout["tax"],
            delivery_charge=checkout["delivery_charge"],
            grand_total=checkout["grand_total"],
            payment_method=validated_data["payment_method"],
        )
        cls._create_direct_order_items(order, checkout["items"])
        PaymentService.create_payment(order)
        return order

    @classmethod
    def _create_order(
        cls,
        *,
        consumer,
        address,
        coupon,
        subtotal,
        discount,
        tax,
        delivery_charge,
        grand_total,
        payment_method,
    ):
        return Order.objects.create(
            order_number=cls.generate_order_number(),
            customer=consumer,
            address=address,
            address_snapshot=cls.save_address_snapshot(address),
            coupon=coupon,
            coupon_snapshot=cls.save_coupon_snapshot(coupon),
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            delivery_charge=delivery_charge,
            grand_total=grand_total,
            payment_method=payment_method,
        )

    @classmethod
    def _create_order_items(cls, order, cart_items):
        order_items = []

        for item in cart_items:
            variant = item.product_variant

            order_items.append(
                OrderItem(
                    order=order,
                    product_variant=variant,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.quantity * item.unit_price,
                    product_snapshot={
                        "product_id": variant.product.id,
                        "variant_id": variant.id,
                        "name": variant.product.name,
                        "sku": variant.sku,
                        "price": str(variant.price),
                    },
                )
            )

        OrderItem.objects.bulk_create(order_items)

    @classmethod
    def _create_direct_order_items(cls, order, checkout_items):
        order_items = []
        for item in checkout_items:
            variant = item["variant"]
            quantity = item["quantity"]
            unit_price = item["unit_price"]
            order_items.append(OrderItem(
                order=order,
                product_variant=variant,
                quantity=quantity,
                unit_price=unit_price,
                total_price=quantity * unit_price,
                product_snapshot={
                    "product_id": variant.product.id,
                    "variant_id": variant.id,
                    "name": variant.product.name,
                    "sku": variant.sku,
                    "price": str(variant.price),
                },
            ))
        OrderItem.objects.bulk_create(order_items)

    @classmethod
    def generate_order_number(cls):
        return f"{ORDER_NUMBER_PREFIX}-{uuid4().hex[:8].upper()}"

    @classmethod
    def save_address_snapshot(cls, address):
        return {
            field: getattr(address, field)
            for field in ADDRESS_SNAPSHOT_FIELDS
        }

    @classmethod
    def save_coupon_snapshot(cls, coupon):
        if coupon is None:
            return None

        snapshot = {}
        for field in COUPON_SNAPSHOT_FIELDS:
            value = getattr(coupon, field)
            # Decimal and other non-serializable types must be converted to string
            from decimal import Decimal
            if isinstance(value, Decimal):
                value = str(value)
            snapshot[field] = value
        return snapshot

    @classmethod
    def get_cart(cls, consumer):
        return (
            Cart.objects
            .select_related(
                "consumer_profile",
            )
            .prefetch_related(
                "items__product_variant",
                "items__product_variant__product",
            )
            .get(
                consumer_profile=consumer,
            )
        )

    @classmethod
    def validate_cart(cls, cart):
        if not cart.items.exists():
            raise ValueError("Cart is empty.")

    @classmethod
    @transaction.atomic
    def cancel_order(cls, order, user):
        """
        Cancel a placed order.
        """
        from apps.orders.choices import OrderStatus
        from apps.orders.services.admin_order_service import AdminOrderService
        # pyrefly: ignore [missing-import]
        from django.utils import timezone
        # pyrefly: ignore [missing-import]  
        from rest_framework.exceptions import ValidationError
        
        if order.order_status != OrderStatus.PLACED:
            raise ValidationError("Only placed orders can be cancelled.")
            
        order.order_status = OrderStatus.CANCELLED
        order.cancelled_at = timezone.now()
        order.save(
            update_fields=[
                "order_status",
                "cancelled_at",
                "updated_at",
            ]
        )
        
        AdminOrderService._create_status_history(
            order=order,
            status=OrderStatus.CANCELLED,
            changed_by=user,
            remarks="Cancelled by customer.",
        )
        return order
