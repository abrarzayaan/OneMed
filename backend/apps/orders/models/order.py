from django.conf import settings
from django.db import models

from apps.profiles.models import ConsumerProfile, RiderProfile
from apps.profiles.models import Address
from apps.orders.choices import (
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
)


class Order(models.Model):
    order_number = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
    )

    customer = models.ForeignKey(
        ConsumerProfile,
        on_delete=models.PROTECT,
        related_name="consumer_order",
    )

    address = models.ForeignKey(
        Address,
        on_delete=models.PROTECT,
        related_name="orders",
    )

    address_snapshot = models.JSONField()

    coupon = models.ForeignKey(
        "coupons.Coupon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    coupon_snapshot = models.JSONField(
        null=True,
        blank=True,
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    tax = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    delivery_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    grand_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    order_status = models.CharField(
        max_length=30,
        choices=OrderStatus.choices,
        default=OrderStatus.PLACED,
        db_index=True,
    )

    assigned_rider = models.ForeignKey(
        RiderProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_orders",
    )

    placed_at = models.DateTimeField(auto_now_add=True)

    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order_number"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["order_status"]),
            models.Index(fields=["payment_status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.order_number