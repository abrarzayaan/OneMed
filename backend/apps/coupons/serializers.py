from rest_framework import serializers
from apps.coupons.models import Coupon

class CouponCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

class CouponUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

class CouponListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "title",
            "discount_type",
            "discount_value",
            "status",
            "start_at",
            "end_at",
        )

class CouponDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"