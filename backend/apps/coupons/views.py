from drf_spectacular.utils import extend_schema

from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from apps.coupons.models import Coupon
from apps.coupons.serializers import (
    CouponCreateSerializer,
    CouponUpdateSerializer,
    CouponListSerializer,
    CouponDetailSerializer,
)


@extend_schema(tags=["Coupons"])
class CouponListCreateAPIView(GenericAPIView):
    queryset = Coupon.objects.all()
    serializer_class = CouponCreateSerializer

    def get_serializer_class(self):
        if self.request.method == "GET":
            return CouponListSerializer
        return CouponCreateSerializer

    @extend_schema(
        summary="List Coupons",
        description="Retrieve all available coupons.",
        responses=CouponListSerializer(many=True),
    )
    def get(self, request):
        coupons = self.get_queryset()

        serializer = self.get_serializer(
            coupons,
            many=True,
        )

        return Response(serializer.data)

    @extend_schema(
        summary="Create Coupon",
        description="Create a new coupon.",
        request=CouponCreateSerializer,
        responses={
            201: CouponDetailSerializer,
        },
    )
    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            CouponDetailSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Coupons"])
class CouponRetrieveUpdateDeleteAPIView(GenericAPIView):
    queryset = Coupon.objects.all()
    serializer_class = CouponDetailSerializer

    def get_object(self):
        return get_object_or_404(
            Coupon,
            pk=self.kwargs["pk"],
        )

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return CouponUpdateSerializer

        return CouponDetailSerializer

    @extend_schema(
        summary="Retrieve Coupon",
        description="Retrieve coupon details.",
        responses=CouponDetailSerializer,
    )
    def get(self, request, *args, **kwargs):
        coupon = self.get_object()

        serializer = self.get_serializer(coupon)

        return Response(serializer.data)

    @extend_schema(
        summary="Update Coupon",
        description="Update an existing coupon.",
        request=CouponUpdateSerializer,
        responses=CouponDetailSerializer,
    )
    def patch(self, request, *args, **kwargs):
        coupon = self.get_object()

        serializer = self.get_serializer(
            coupon,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            CouponDetailSerializer(serializer.instance).data
        )

    @extend_schema(
        summary="Delete Coupon",
        description="Delete a coupon.",
        responses={204: None},
    )
    def delete(self, request, *args, **kwargs):
        coupon = self.get_object()

        coupon.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )