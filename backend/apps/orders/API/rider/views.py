# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework import viewsets, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from drf_spectacular.utils import extend_schema

from apps.orders.models import Order
from apps.orders.choices import OrderStatus
from apps.orders.serializers.order import OrderDetailSerializer
from apps.orders.API.rider.serializers import RiderOrderStatusUpdateSerializer
from apps.orders.services.admin_order_service import AdminOrderService
from apps.orders.permissions import IsRiderUser
from apps.profiles.serializers import RiderProfileSerializer


class RiderOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for riders to view their assigned orders, update delivery status,
    and monitor dashboard performance.
    """
    permission_classes = [IsAuthenticated, IsRiderUser]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        rider_profile = getattr(self.request.user, 'rider_profile', None)
        if not rider_profile:
            return Order.objects.none()
        return Order.objects.filter(
            assigned_rider=rider_profile
        ).select_related(
            "customer__user", "assigned_rider__user", "payment"
        ).prefetch_related(
            "items__product_variant__product",
            "items__vendor__user",
            "items__vendor__address",
            "status_history__changed_by"
        )

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        """
        Dashboard performance metrics and current active order for the logged in rider.
        """
        rider_profile = getattr(request.user, 'rider_profile', None)
        if not rider_profile:
            return Response({"error": "Rider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        today_delivered = Order.objects.filter(
            assigned_rider=rider_profile,
            order_status=OrderStatus.DELIVERED,
            delivered_at__date=today
        )
        today_completed_deliveries = today_delivered.count()
        today_earnings_bdt = sum([float(o.grand_total) for o in today_delivered])

        total_completed_deliveries = Order.objects.filter(
            assigned_rider=rider_profile,
            order_status=OrderStatus.DELIVERED
        ).count()

        assigned_orders_count = Order.objects.filter(
            assigned_rider=rider_profile
        ).exclude(
            order_status__in=[OrderStatus.DELIVERED, OrderStatus.CANCELLED]
        ).count()

        active_order = Order.objects.filter(
            assigned_rider=rider_profile,
            order_status__in=[OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY]
        ).select_related(
            "customer__user", "assigned_rider__user", "payment"
        ).prefetch_related(
            "items__product_variant__product",
            "items__vendor__user",
            "items__vendor__address",
            "status_history__changed_by"
        ).first()

        active_order_data = OrderDetailSerializer(active_order).data if active_order else None
        profile_serializer = RiderProfileSerializer(rider_profile)

        return Response({
            "today_completed_deliveries": today_completed_deliveries,
            "today_earnings_bdt": today_earnings_bdt,
            "total_completed_deliveries": total_completed_deliveries,
            "assigned_orders_count": assigned_orders_count,
            "availability_status": rider_profile.availability_status,
            "is_profile_complete": profile_serializer.data.get("is_profile_complete", False),
            "active_order": active_order_data,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        """
        Update the status of an assigned order.
        Enforces Profile Completeness and Single Active Order Policy.
        """
        rider_profile = getattr(request.user, 'rider_profile', None)
        if not rider_profile:
            return Response({"error": "Rider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Mandatory Profile Completion Guard
        prof_data = RiderProfileSerializer(rider_profile).data
        if not prof_data.get('is_profile_complete', False):
            return Response(
                {
                    "error": "Profile incomplete! You must update your profile (NID, License, Vehicle details, Phone, Name) before performing actions on any order."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        order = self.get_object()
        serializer = RiderOrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        # 2. Single Active Order Guard
        active_statuses = [OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY]
        if new_status in active_statuses:
            existing_active = Order.objects.filter(
                assigned_rider=rider_profile,
                order_status__in=active_statuses
            ).exclude(id=order.id).first()

            if existing_active:
                return Response(
                    {
                        "error": f"You already have an active order (#{existing_active.order_number}) in progress. You must complete or deliver it before starting another order."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        updated_order = AdminOrderService.change_order_status(
            order=order,
            new_status=new_status,
            changed_by=request.user,
            remarks=serializer.validated_data.get("remarks")
        )
        return Response(
            self.get_serializer(updated_order).data,
            status=status.HTTP_200_OK
        )
