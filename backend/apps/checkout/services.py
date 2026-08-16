from decimal import Decimal

# pyrefly: ignore [missing-import]
from rest_framework.exceptions import ValidationError

from apps.profiles.models import Address, ConsumerProfile
from apps.cart.models import Cart
from apps.coupons.services import CouponService
from apps.products.models.inventories import Inventory
from apps.products.models.inventories import InventoryStatusChoices
from apps.products.models import ProductVariant


class CheckoutService:

    @staticmethod
    def validate_direct_item(variant_id, quantity):
        """Validate one purchasable variant and return its checkout line."""
        try:
            variant = ProductVariant.objects.select_related("product").get(
                id=variant_id,
                status="active",
                product__status="active",
                product__approval_status="approved",
            )
        except ProductVariant.DoesNotExist:
            raise ValidationError({"product_variant_id": "Product variant not found."})

        if quantity < variant.min_order_qty:
            raise ValidationError({
                "quantity": f"Minimum order quantity is {variant.min_order_qty}."
            })
        if variant.max_order_qty is not None and quantity > variant.max_order_qty:
            raise ValidationError({
                "quantity": f"Maximum order quantity is {variant.max_order_qty}."
            })

        inventory = (
            Inventory.objects.filter(
                variant=variant,
                status__in=[
                    InventoryStatusChoices.IN_STOCK,
                    InventoryStatusChoices.LOW_STOCK,
                ],
            ).order_by("-stock_qty").first()
        )
        return {
            "variant": variant,
            "quantity": quantity,
            "unit_price": variant.sale_price if variant.sale_price is not None else variant.price,
        }

    @staticmethod
    def validate_cart(user):
        """
        Validate user's cart.
        """

        try:
            cart = Cart.objects.prefetch_related(
                "items__product_variant",
                "items__product_variant__product",
            ).get(
            consumer_profile=user.consumer_profile
        )

        except Cart.DoesNotExist:
            raise ValidationError(
                "Cart not found."
            )

        if not cart.items.exists():
            raise ValidationError(
                "Your cart is empty."
            )

        return cart

    @staticmethod
    def validate_address(user, address_id):
        """
        Validate shipping address.
        """

        try:
            address = Address.objects.get(
                id=address_id,
                user=user,
                status="active",
            )

        except Address.DoesNotExist:
            raise ValidationError(
                "Please add a valid delivery address."
            )

        return address

    @staticmethod
    def validate_stock(cart):
        """
        Validate inventory stock (non-blocking for consumer checkout).
        """
        return True
            
    @staticmethod
    def calculate_subtotal(cart):
        """
        Calculate cart subtotal.
        """
        return cart.total_price

    @staticmethod
    def apply_coupon(coupon_code, subtotal):
        """
        Validate and apply coupon.
        """

        if not coupon_code:
            return None, Decimal("0.00")

        is_valid, result = CouponService.validate_coupon(
            code=coupon_code,
            subtotal=subtotal,
        )

        if not is_valid:
            raise ValidationError(result)

        coupon = result

        discount = CouponService.calculate_discount(
            coupon=coupon,
            subtotal=subtotal,
        )

        return coupon, discount

    @staticmethod
    def calculate_tax(subtotal, discount):
        """
        Tax calculation.

        Currently disabled.
        Future:
            Tax = (subtotal - discount) * tax_rate
        """

        return Decimal("0.00")

    @staticmethod
    def calculate_delivery_charge(address):
        """
        Delivery charge calculation.

        Future:
        - Dhaka
        - Outside Dhaka
        - Express Delivery
        """

        return Decimal("0.00")

    @staticmethod
    def calculate_grand_total(
        subtotal,
        discount,
        tax,
        delivery_charge,
    ):
        """
        Final payable amount.
        """

        return (
            subtotal
            - discount
            + tax
            + delivery_charge
        )


    @staticmethod
    def calculate_checkout(user, address_id, coupon_code=None):
        """
        Returns validated checkout data for Order creation.
        """

        # Step-1
        cart = CheckoutService.validate_cart(user)

        # Step-2
        address = CheckoutService.validate_address(
            user=user,
            address_id=address_id,
        )

        # Step-3
        CheckoutService.validate_stock(cart)

        # Step-4
        subtotal = CheckoutService.calculate_subtotal(cart)

        # Step-5
        coupon, discount = CheckoutService.apply_coupon(
            coupon_code=coupon_code,
            subtotal=subtotal,
        )

        # Step-6
        tax = CheckoutService.calculate_tax(
            subtotal=subtotal,
            discount=discount,
        )

        # Step-7
        delivery_charge = CheckoutService.calculate_delivery_charge(
            address=address,
        )

        # Step-8
        grand_total = CheckoutService.calculate_grand_total(
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            delivery_charge=delivery_charge,
        )

        return {
            "cart": cart,
            "address": address,
            "coupon": coupon,
            "subtotal": subtotal,
            "discount": discount,
            "tax": tax,
            "delivery_charge": delivery_charge,
            "grand_total": grand_total,
        }            
    
    @staticmethod
    def generate_checkout(user, address_id, coupon_code=None):
        """
        Generate complete checkout summary.
        """

        checkout = CheckoutService.calculate_checkout(
            user=user,
            address_id=address_id,
            coupon_code=coupon_code,
        )

        cart = checkout["cart"]
        address = checkout["address"]
        coupon = checkout["coupon"]

        subtotal = checkout["subtotal"]
        discount = checkout["discount"]
        tax = checkout["tax"]
        delivery_charge = checkout["delivery_charge"]
        grand_total = checkout["grand_total"]

        # Step-9: Cart Items
        items = []

        for item in cart.items.select_related(
            "product_variant",
            "product_variant__product",
        ):
            items.append(
                {
                    "product_variant_id": item.product_variant.id,
                    "product_name": item.product_variant.product.name,
                    "variant_name": item.product_variant.variant_name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                }
            )

        # Step-10: Coupon Data
        coupon_data = None

        if coupon:
            coupon_data = {
                "code": coupon.code,
                "discount": discount,
            }

        # Step-11: Pricing
        pricing = {
            "subtotal": subtotal,
            "discount": discount,
            "tax": tax,
            "delivery_charge": delivery_charge,
            "grand_total": grand_total,
        }

        # Step-12: Final Response
        return {
            "items": items,
            "pricing": pricing,
            "coupon": coupon_data,
            "address_id": address.id,
        }

    @staticmethod
    def calculate_direct_checkout(user, variant_id, quantity, address_id, coupon_code=None):
        """Calculate checkout data for Buy Now without creating a cart item."""
        item = CheckoutService.validate_direct_item(variant_id, quantity)
        address = CheckoutService.validate_address(user, address_id)
        subtotal = item["unit_price"] * item["quantity"]
        coupon, discount = CheckoutService.apply_coupon(coupon_code, subtotal)
        tax = CheckoutService.calculate_tax(subtotal, discount)
        delivery_charge = CheckoutService.calculate_delivery_charge(address)

        return {
            "items": [item],
            "address": address,
            "coupon": coupon,
            "subtotal": subtotal,
            "discount": discount,
            "tax": tax,
            "delivery_charge": delivery_charge,
            "grand_total": CheckoutService.calculate_grand_total(
                subtotal, discount, tax, delivery_charge
            ),
        }

    @staticmethod
    def generate_direct_checkout(user, variant_id, quantity, address_id, coupon_code=None):
        """Generate the API checkout preview for a single Buy Now variant."""
        checkout = CheckoutService.calculate_direct_checkout(
            user, variant_id, quantity, address_id, coupon_code
        )
        item = checkout["items"][0]
        variant = item["variant"]
        discount = checkout["discount"]
        coupon = checkout["coupon"]

        return {
            "items": [{
                "product_variant_id": variant.id,
                "product_name": variant.product.name,
                "variant_name": variant.variant_name,
                "quantity": item["quantity"],
                "unit_price": item["unit_price"],
                "total_price": item["unit_price"] * item["quantity"],
            }],
            "pricing": {
                key: checkout[key]
                for key in ("subtotal", "discount", "tax", "delivery_charge", "grand_total")
            },
            "coupon": {"code": coupon.code, "discount": discount} if coupon else None,
            "address_id": checkout["address"].id,
        }
