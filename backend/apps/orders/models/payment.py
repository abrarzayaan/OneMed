from django.db import models

from apps.orders.choices import PaymentMethod, PaymentStatus
from apps.orders.models.order import Order


class Payment(models.Model):
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="payment",
    )

    method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    transaction_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    gateway_response = models.JSONField(
        blank=True,
        null=True,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    paid_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order.order_number} - {self.status}"