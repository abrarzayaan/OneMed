from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from .choices import DiscountType, CouponStatus
from django.conf import settings

from apps.profiles.models import ConsumerProfile


class Coupon(models.Model):
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
    )
    title = models.CharField(
        max_length=150,
    )
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    max_discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    usage_limit = models.PositiveIntegerField()
    per_user_limit = models.PositiveIntegerField(
        default=1,
    )
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=CouponStatus.choices,
        default=CouponStatus.ACTIVE,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.start_at >= self.end_at:
            raise ValidationError({
                "end_at": "End date must be greater than start date."
            })

        if self.discount_type == DiscountType.PERCENTAGE:
            if self.discount_value <= 0 or self.discount_value > 100:
                raise ValidationError({
                    "discount_value": "Percentage discount must be between 1 and 100."
                })

            if not self.max_discount_amount:
                raise ValidationError({
                    "max_discount_amount": "This field is required for percentage discount."
                })

        if self.discount_type == DiscountType.FIXED:
            if self.discount_value <= 0:
                raise ValidationError({
                    "discount_value": "Discount amount must be greater than 0."
                })
            
    def save(self, *args, **kwargs):
        self.full_clean()
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "coupons"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return self.code
    

class CouponUsage(models.Model):
    """
    Tracks every successful coupon redemption.
    """

    coupon = models.ForeignKey(
        "Coupon",
        on_delete=models.CASCADE,
        related_name="usages",
    )

    consumer = models.ForeignKey(
        ConsumerProfile,
        on_delete=models.CASCADE,
        related_name="coupon_usages",
    )

    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="coupon_usage",
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    used_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "coupon_usages"

        ordering = [
            "-used_at",
        ]

        indexes = [
            models.Index(fields=["coupon"]),
            models.Index(fields=["consumer"]),
            models.Index(fields=["order"]),
            models.Index(fields=["used_at"]),
        ]

    def __str__(self):
        return f"{self.consumer} - {self.coupon.code}"