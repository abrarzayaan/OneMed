from rest_framework import serializers
from apps.profiles.models import RiderProfile
from apps.orders.choices import OrderStatus


class OrderItemVendorAssignItemSerializer(serializers.Serializer):
    order_item_id = serializers.IntegerField()
    vendor_id = serializers.IntegerField()


class AdminOrderVendorAssignSerializer(serializers.Serializer):
    items = OrderItemVendorAssignItemSerializer(many=True)


class AdminOrderRiderAssignSerializer(serializers.Serializer):
    rider_id = serializers.PrimaryKeyRelatedField(
        queryset=RiderProfile.objects.all(),
        source="rider"
    )


class AdminOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
