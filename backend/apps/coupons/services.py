from decimal import Decimal

from django.utils import timezone

from apps.coupons.choices import CouponStatus, DiscountType
from apps.coupons.models import Coupon, CouponUsage
    
class CouponService:

    @staticmethod
    def validate_coupon(code, subtotal):
        try:
            coupon = Coupon.objects.get(
                code=code.upper(),
                status=CouponStatus.ACTIVE,
            )
        except Coupon.DoesNotExist:
            return False, "Invalid coupon."

        now = timezone.now()

        if coupon.start_at > now:
            return False, "Coupon is not active yet."

        if coupon.end_at < now:
            return False, "Coupon has expired."

        if subtotal < coupon.min_order_amount:
            return False, (
                f"Minimum order amount is {coupon.min_order_amount}."
            )

        return True, coupon

    @staticmethod
    def calculate_discount(coupon, subtotal):
        subtotal = Decimal(subtotal)

        if coupon.discount_type == DiscountType.PERCENTAGE:
            discount = (
                subtotal * coupon.discount_value
            ) / Decimal("100")

            if coupon.max_discount_amount:
                discount = min(
                    discount,
                    coupon.max_discount_amount,
                )

        else:
            discount = coupon.discount_value

        discount = min(discount, subtotal)

        return discount


class CouponUsageService:

    @staticmethod
    def create_usage(order):
        """
        Store coupon redemption history.
        """

        if order.coupon is None:
            return None

        return CouponUsage.objects.create(
            coupon=order.coupon,
            consumer=order.customer,
            order=order,
            discount_amount=order.discount,
        )