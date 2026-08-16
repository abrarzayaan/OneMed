# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

from apps.profiles.models import Address, ConsumerProfile, VendorProfile, RiderProfile
from apps.orders.choices import PaymentMethod, PaymentStatus, OrderStatus
from apps.orders.models import Order, OrderItem, Payment, OrderStatusHistory

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "email",
        ]


class ConsumerProfileDetailSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ConsumerProfile
        fields = [
            "id",
            "user",
            "date_of_birth",
            "gender",
            "profile_image",
        ]


from apps.profiles.serializers import AddressSerializer


class VendorProfileDetailSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    address = AddressSerializer(read_only=True)

    class Meta:
        model = VendorProfile
        fields = [
            "id",
            "user",
            "name",
            "slug",
            "type",
            "phone",
            "email",
            "status",
            "verification_status",
            "address",
        ]


class RiderProfileDetailSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = RiderProfile
        fields = [
            "id",
            "user",
            "vehicle_type",
            "vehicle_number",
            "nid_no",
            "license_no",
            "availability_status",
            "verification_status",
            "current_latitude",
            "current_longitude",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "method",
            "status",
            "transaction_id",
            "amount",
            "paid_at",
            "created_at",
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = [
            "id",
            "status",
            "changed_by",
            "remarks",
            "created_at",
        ]


class OrderItemDetailSerializer(serializers.ModelSerializer):
    vendor = VendorProfileDetailSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_variant",
            "vendor",
            "quantity",
            "unit_price",
            "total_price",
            "product_snapshot",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    customer = ConsumerProfileDetailSerializer(read_only=True)
    assigned_rider = RiderProfileDetailSerializer(read_only=True)
    items = OrderItemDetailSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer",
            "address",
            "address_snapshot",
            "coupon",
            "coupon_snapshot",
            "subtotal",
            "discount",
            "tax",
            "delivery_charge",
            "grand_total",
            "payment_method",
            "payment_status",
            "order_status",
            "assigned_rider",
            "items",
            "payment",
            "status_history",
            "placed_at",
            "confirmed_at",
            "delivered_at",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]


class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        source="address",
    )

    payment_method = serializers.ChoiceField(
        choices=PaymentMethod.choices,
    )

    coupon_code = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    def validate(self, attrs):
        user = self.context["request"].user
        address = attrs["address"]

        if address.user != user:
            raise serializers.ValidationError(
                {
                    "address_id": "Invalid address."
                }
            )

        return attrs


class DirectOrderCreateSerializer(OrderCreateSerializer):
    """Create an order for one variant without using the shopping cart."""

    product_variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)
