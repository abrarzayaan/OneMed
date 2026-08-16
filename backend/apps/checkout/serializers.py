from rest_framework import serializers


class CheckoutRequestSerializer(serializers.Serializer):
    """
    Request Serializer

    Input:
    {
        "address_id": 1,
        "coupon_code": "SAVE100"   # Optional
    }
    """

    address_id = serializers.IntegerField(
        required=True,
        min_value=1
    )

    coupon_code = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        allow_null=True,
    )


class DirectCheckoutRequestSerializer(CheckoutRequestSerializer):
    """Checkout-preview input for a single product variant."""

    quantity = serializers.IntegerField(
        required=True,
        min_value=1,
    )


class CheckoutItemSerializer(serializers.Serializer):
    """
    Individual Cart Item
    """

    product_variant_id = serializers.IntegerField()

    product_name = serializers.CharField()

    variant_name = serializers.CharField()

    quantity = serializers.IntegerField()

    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    total_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )


class CheckoutPricingSerializer(serializers.Serializer):
    """
    Pricing Summary
    """

    subtotal = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    discount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    tax = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    delivery_charge = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    grand_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )


class CheckoutCouponSerializer(serializers.Serializer):
    """
    Applied Coupon Information
    """

    code = serializers.CharField()

    discount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )


class CheckoutResponseSerializer(serializers.Serializer):
    """
    Final Checkout Response
    """

    items = CheckoutItemSerializer(many=True)

    pricing = CheckoutPricingSerializer()

    coupon = CheckoutCouponSerializer(
        allow_null=True
    )

    address_id = serializers.IntegerField()
