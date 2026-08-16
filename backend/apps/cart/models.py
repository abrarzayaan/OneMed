from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.products.models import ProductVariant
from apps.profiles.models import ConsumerProfile


class Cart(models.Model):
    # user = models.OneToOneField(
    #     settings.AUTH_USER_MODEL,
    #     on_delete=models.CASCADE,
    #     related_name="cart"
    # )
    consumer_profile = models.OneToOneField(
        ConsumerProfile,
        on_delete=models.CASCADE,
        related_name="cart",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart"

    def __str__(self):
        if self.consumer_profile and self.consumer_profile.user:
            return f"Cart - {self.consumer_profile.user.username}"
        return "Cart - Anonymous"

    @property
    def total_price(self):
        return sum(
            (item.total_price for item in self.items.all()),
            Decimal("0.00")
        )

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product_variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"

        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product_variant"],
                name="unique_cart_product_variant"
            )
        ]

    def __str__(self):
        return f"{self.product_variant} x {self.quantity}"

    @property
    def unit_price(self):
        if self.product_variant.sale_price is not None:
            return self.product_variant.sale_price

        return self.product_variant.price

    @property
    def total_price(self):
        return self.unit_price * self.quantity