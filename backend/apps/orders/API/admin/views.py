from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema

from apps.orders.models import Order
from apps.orders.serializers.order import OrderDetailSerializer
from apps.orders.API.admin.serializers import (
    AdminOrderVendorAssignSerializer,
    AdminOrderRiderAssignSerializer,
    AdminOrderStatusUpdateSerializer,
)
from apps.orders.services.admin_order_service import AdminOrderService
from apps.orders.permissions import IsAdminUser


class AdminOrderPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for admin actions: list, retrieve, assign vendor, assign rider, confirm order, and update order status.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = OrderDetailSerializer
    pagination_class = AdminOrderPagination

    def get_queryset(self):
        queryset = Order.objects.select_related(
            "customer__user", "assigned_rider__user", "payment"
        ).prefetch_related(
            "items__product_variant__product",
            "items__vendor__user",
            "status_history__changed_by"
        ).order_by("-created_at")
        
        # Filtering query params
        order_status = self.request.query_params.get("order_status")
        if order_status:
            queryset = queryset.filter(order_status=order_status)
            
        payment_status = self.request.query_params.get("payment_status")
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
            
        order_number = self.request.query_params.get("order_number")
        if order_number:
            queryset = queryset.filter(order_number__icontains=order_number)

        # Date Filtering
        date = self.request.query_params.get("date")
        if date:
            queryset = queryset.filter(created_at__date=date)

        start_date = self.request.query_params.get("start_date")
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)

        end_date = self.request.query_params.get("end_date")
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        return queryset

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Return overall count statistics for all orders.
        """
        total = Order.objects.count()
        placed = Order.objects.filter(order_status="PLACED").count()
        confirmed = Order.objects.filter(order_status="CONFIRMED").count()
        out_for_delivery = Order.objects.filter(order_status="OUT_FOR_DELIVERY").count()
        return Response({
            "total": total,
            "placed": placed,
            "confirmed": confirmed,
            "out_for_delivery": out_for_delivery
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="assign-vendor")
    def assign_vendor(self, request, pk=None):
        """
        Assign vendors to individual order items.
        """
        order = self.get_object()
        serializer = AdminOrderVendorAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_order = AdminOrderService.assign_vendor(
            order=order,
            items=serializer.validated_data["items"],
            changed_by=request.user
        )
        return Response(
            self.get_serializer(updated_order).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"], url_path="assign-rider")
    def assign_rider(self, request, pk=None):
        """
        Assign rider to the order.
        """
        order = self.get_object()
        serializer = AdminOrderRiderAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_order = AdminOrderService.assign_rider(
            order=order,
            rider=serializer.validated_data["rider"],
            changed_by=request.user
        )
        return Response(
            self.get_serializer(updated_order).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"])
    def confirm(self, request, pk=None):
        """
        Confirm the order, validate inventory, and deduct stock.
        """
        order = self.get_object()
        updated_order = AdminOrderService.confirm_order(
            order=order,
            changed_by=request.user
        )
        return Response(
            self.get_serializer(updated_order).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        """
        Change status of the order (e.g. Processing, Packed, Out for Delivery, Delivered, Cancelled).
        """
        order = self.get_object()
        serializer = AdminOrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_order = AdminOrderService.change_order_status(
            order=order,
            new_status=serializer.validated_data["status"],
            changed_by=request.user,
            remarks=serializer.validated_data.get("remarks")
        )
        return Response(
            self.get_serializer(updated_order).data,
            status=status.HTTP_200_OK
        )

# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
from apps.profiles.models import VendorProfile, RiderProfile

class AdminVendorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendors = VendorProfile.objects.filter(status='active', verification_status='verified')
        if not vendors.exists():
            vendors = VendorProfile.objects.filter(status='active')
        if not vendors.exists():
            vendors = VendorProfile.objects.all()

        data = []
        for v in vendors:
            addr_str = "Main Pharmacy Branch"
            if v.address:
                addr_str = getattr(v.address, 'full_address', '') or f"{v.address.area}, {v.address.city}"
            phone_num = v.phone or (getattr(v.user, 'phone_number', '') if v.user else '')
            data.append({
                "id": v.id,
                "name": v.name or (v.user.username if v.user else f"Vendor #{v.id}"),
                "phone": phone_num or "+8801711000000",
                "address": addr_str,
                "username": v.user.username if v.user else f"vendor_{v.id}",
                "status": v.status,
                "available_stock": 50,
            })
        return Response(data, status=status.HTTP_200_OK)


class AdminRiderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        riders = RiderProfile.objects.filter(availability_status='online', verification_status='verified')
        if not riders.exists():
            riders = RiderProfile.objects.filter(availability_status='online')
        if not riders.exists():
            riders = RiderProfile.objects.all()

        data = []
        for r in riders:
            u_name = f"{r.user.first_name} {r.user.last_name}".strip() if (r.user and (r.user.first_name or r.user.last_name)) else (r.user.username if r.user else f"Rider #{r.id}")
            phone_num = getattr(r.user, 'phone_number', '') if r.user else ''
            vehicle = (r.vehicle_type or 'Motorbike').capitalize()
            data.append({
                "id": r.id,
                "name": f"{u_name} ({vehicle})",
                "phone": phone_num or "+8801700000000",
                "vehicle_type": vehicle,
                "is_online": r.availability_status == 'online',
                "active_workload": 0,
                "rating": 4.8,
            })
        return Response(data, status=status.HTTP_200_OK)
