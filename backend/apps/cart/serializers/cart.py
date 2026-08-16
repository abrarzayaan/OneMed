from rest_framework import serializers

from apps.cart.models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product_variant.product.id", read_only=True)
    product_name = serializers.CharField(source="product_variant.product.name", read_only=True)
    variant_id = serializers.IntegerField(source="product_variant.id", read_only=True)
    variant_name = serializers.CharField(source="product_variant.variant_name", read_only=True)
    sku = serializers.CharField(source="product_variant.sku", read_only=True)

    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    total_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "variant_id",
            "variant_name",
            "sku",
            "quantity",
            "unit_price",
            "total_price",
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Cart
        fields = [
            "id",
            # "user",
            "consumer_profile",
            "items",
            "total_items",
            "total_price",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields