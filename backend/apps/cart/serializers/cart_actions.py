# pyrefly: ignore [missing-import]
from rest_framework import serializers
from apps.cart.services import CartService

from apps.cart.models import Cart, CartItem
from apps.products.models import ProductVariant, Inventory


class AddToCartSerializer(serializers.Serializer):
    product_variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        variant_id = attrs["product_variant_id"]
        quantity = attrs["quantity"]

        # Variant Exists
        try:
            variant = ProductVariant.objects.get(
                id=variant_id,
                status="active"
            )
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError({
                "product_variant_id": "Product variant not found."
            })

        inventory = CartService.get_inventory(variant)

        # Min Qty
        if quantity < variant.min_order_qty:
            raise serializers.ValidationError({
                "quantity": f"Minimum order quantity is {variant.min_order_qty}."
            })

        # Max Qty
        if (
            variant.max_order_qty is not None
            and quantity > variant.max_order_qty
        ):
            raise serializers.ValidationError({
                "quantity": f"Maximum order quantity is {variant.max_order_qty}."
            })

        attrs["variant"] = variant
        attrs["inventory"] = inventory

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        consumer_profile = getattr(user, "consumer_profile", None)

        cart, created = Cart.objects.get_or_create(
            consumer_profile=consumer_profile,
            defaults={"consumer_profile": consumer_profile},
        )

        if consumer_profile and cart.consumer_profile_id is None:
            cart.consumer_profile = consumer_profile
            cart.save(update_fields=["consumer_profile", "updated_at"])

        variant = self.validated_data["variant"]
        quantity = self.validated_data["quantity"]

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_variant=variant,
            defaults={
                "quantity": quantity
            }
        )

        if not created:
            new_quantity = cart_item.quantity + quantity

            if (
                variant.max_order_qty is not None
                and new_quantity > variant.max_order_qty
            ):
                raise serializers.ValidationError({
                    "quantity": f"Maximum order quantity is {variant.max_order_qty}."
                })

            cart_item.quantity = new_quantity
            cart_item.save(update_fields=["quantity", "updated_at"])

        return cart_item


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        cart_item = self.context["cart_item"]
        quantity = attrs["quantity"]
        variant = cart_item.product_variant

        if quantity < variant.min_order_qty:
            raise serializers.ValidationError({
                "quantity": f"Minimum order quantity is {variant.min_order_qty}."
            })

        if (
            variant.max_order_qty is not None
            and quantity > variant.max_order_qty
        ):
            raise serializers.ValidationError({
                "quantity": f"Maximum order quantity is {variant.max_order_qty}."
            })

        return attrs

    def save(self):
        cart_item = self.context["cart_item"]

        cart_item.quantity = self.validated_data["quantity"]
        cart_item.save(update_fields=["quantity", "updated_at"])

        return cart_item


class RemoveCartItemSerializer(serializers.Serializer):

    def save(self):
        cart_item = self.context["cart_item"]
        cart_item.delete()