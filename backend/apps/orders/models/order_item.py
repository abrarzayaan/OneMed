# pyrefly: ignore [missing-import]
from django.db import models

from apps.orders.models.order import Order
from apps.products.models.variants_images import ProductVariant
from apps.profiles.models import VendorProfile as Vendor


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product_variant = models.ForeignKey(
    ProductVariant,
    on_delete=models.PROTECT,
    related_name="order_items",
    )

    vendor = models.ForeignKey(
    Vendor,
    on_delete=models.PROTECT,
    null=True,
    blank=True,
    related_name="order_items",
    )

    quantity = models.PositiveIntegerField()

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    product_snapshot = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "order_item"
        ordering = ["id"]
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["product_variant"]),
            models.Index(fields=["vendor"]),
        ]

    def __str__(self):
        return f"{self.order.order_number} - {self.product_variant.variant_name}"