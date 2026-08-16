from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.orders.models import Order
from apps.orders.serializers.order import (
    DirectOrderCreateSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
)
from apps.orders.services.order_service import OrderService
from apps.orders.permissions import IsConsumerUser


class CustomerOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for customer operations: list, retrieve, create, cancel, and track orders.
    """
    permission_classes = [IsAuthenticated, IsConsumerUser]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        # Customers can only view their own orders
        return Order.objects.filter(
            customer=self.request.user.consumer_profile
        ).select_related(
            "customer__user", "assigned_rider__user", "payment"
        ).prefetch_related(
            "items__product_variant__product",
            "items__vendor__user",
            "status_history__changed_by"
        )

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        
        consumer = request.user.consumer_profile
        order = OrderService.create_order(
            consumer=consumer,
            validated_data=serializer.validated_data
        )
        
        # Serialize the full detail response
        response_serializer = self.get_serializer(order)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["post"], url_path="buy-now")
    @extend_schema(request=DirectOrderCreateSerializer, responses={201: OrderDetailSerializer})
    def buy_now(self, request):
        serializer = DirectOrderCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        order = OrderService.create_direct_order(
            consumer=request.user.consumer_profile,
            validated_data=serializer.validated_data,
        )
        return Response(self.get_serializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"])
    def cancel(self, request, pk=None):
        """
        Cancel a placed order. Can only be done before confirmation.
        """
        order = self.get_object()
        updated_order = OrderService.cancel_order(
            order=order,
            user=request.user
        )
        return Response(
            self.get_serializer(updated_order).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get"])
    def tracking(self, request, pk=None):
        """
        Track order timeline and rider details.
        """
        order = self.get_object()
        
        rider_details = None
        if order.assigned_rider:
            rider_details = {
                "name": f"{order.assigned_rider.user.first_name} {order.assigned_rider.user.last_name}".strip() or order.assigned_rider.user.username,
                "phone": order.assigned_rider.user.phone_number,
                "vehicle_type": order.assigned_rider.vehicle_type,
                "vehicle_number": order.assigned_rider.vehicle_number,
                "current_latitude": order.assigned_rider.current_latitude,
                "current_longitude": order.assigned_rider.current_longitude,
            }
            
        history_logs = []
        for history in order.status_history.all().order_by("created_at"):
            history_logs.append({
                "status": history.status,
                "remarks": history.remarks,
                "created_at": history.created_at,
                "changed_by": history.changed_by.username if history.changed_by else "System"
            })
            
        tracking_data = {
            "order_number": order.order_number,
            "current_status": order.order_status,
            "placed_at": order.placed_at,
            "confirmed_at": order.confirmed_at,
            "delivered_at": order.delivered_at,
            "cancelled_at": order.cancelled_at,
            "rider": rider_details,
            "history": history_logs
        }
        return Response(tracking_data, status=status.HTTP_200_OK)
