from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.checkout.serializers import (
    CheckoutRequestSerializer,
    CheckoutResponseSerializer,
    DirectCheckoutRequestSerializer,
)
from apps.checkout.services import CheckoutService


class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(
        request=CheckoutRequestSerializer,
        responses={
            200: CheckoutResponseSerializer,
        },
        tags=["Checkout"],
    )

    def post(self, request):
        request_serializer = CheckoutRequestSerializer(
            data=request.data
        )
        request_serializer.is_valid(raise_exception=True)

        checkout = CheckoutService.generate_checkout(
            user=request.user,
            address_id=request_serializer.validated_data["address_id"],
            coupon_code=request_serializer.validated_data.get(
                "coupon_code"
            ),
        )

        response_serializer = CheckoutResponseSerializer(
            checkout
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class DirectCheckoutAPIView(APIView):
    """Preview checkout pricing for one variant without modifying the cart."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=DirectCheckoutRequestSerializer,
        responses={200: CheckoutResponseSerializer},
        tags=["Checkout"],
    )
    def post(self, request, variant_id):
        request_serializer = DirectCheckoutRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        checkout = CheckoutService.generate_direct_checkout(
            user=request.user,
            variant_id=variant_id,
            quantity=request_serializer.validated_data["quantity"],
            address_id=request_serializer.validated_data["address_id"],
            coupon_code=request_serializer.validated_data.get("coupon_code"),
        )

        return Response(CheckoutResponseSerializer(checkout).data)
