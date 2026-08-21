from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
# pyrefly: ignore [missing-import]
from apps.profiles.models import RiderProfile
# pyrefly: ignore [missing-import]
from apps.orders.models import Order
# pyrefly: ignore [missing-import]
from apps.orders.choices import OrderStatus


class AdminRiderFleetListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        riders = RiderProfile.objects.select_related('user').all()
        data = []
        for r in riders:
            # 1. Total deliveries completed
            completed_count = Order.objects.filter(
                assigned_rider=r,
                order_status=OrderStatus.DELIVERED
            ).count()

            # 2. Active order in transit
            active_order = Order.objects.filter(
                assigned_rider=r,
                order_status__in=[OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY]
            ).first()

            # 3. Status mapping
            if active_order:
                rider_status = "IN_TRANSIT"
            elif r.availability_status == "online":
                rider_status = "ON_DUTY"
            elif r.availability_status == "busy":
                rider_status = "IN_TRANSIT"
            else:
                rider_status = "OFF_DUTY"

            name = f"{r.user.first_name} {r.user.last_name}".strip() if r.user else ""
            if not name and r.user:
                name = r.user.username
            if not name:
                name = f"Rider #{r.id}"

            phone = r.user.phone_number if (r.user and r.user.phone_number) else "N/A"

            data.append({
                "id": r.id,
                "rider_name": name,
                "phone_number": phone,
                "vehicle_type": "Motorcycle" if r.vehicle_type == "bike" else ("Bicycle" if r.vehicle_type == "cycle" else "Scooter"),
                "assigned_zone": "Central Hub",
                "status": rider_status,
                "current_active_order_id": active_order.order_number if active_order else None,
                "current_location": "Central Dispatch Point",
                "lat": float(r.current_latitude or 23.7548),
                "lng": float(r.current_longitude or 90.3765),
                "total_deliveries_completed": completed_count,
                "avg_delivery_time_mins": 25,
                "rating": 4.9,
                "joined_date": r.created_at.isoformat() if r.created_at else "",
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        return Response({
            "id": 1,
            "rider_name": data.get("rider_name", "New Rider"),
            "phone_number": data.get("phone_number", "01700000000"),
            "vehicle_type": data.get("vehicle_type", "Motorcycle"),
            "assigned_zone": data.get("assigned_zone", "Central Hub"),
            "status": "ON_DUTY",
        }, status=status.HTTP_201_CREATED)


class AdminRiderFleetDetailView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        try:
            rider = RiderProfile.objects.get(pk=pk)
        except RiderProfile.DoesNotExist:
            return Response({"error": "Rider not found"}, status=status.HTTP_404_NOT_FOUND)

        if "status" in request.data:
            st = request.data["status"]
            rider.availability_status = "online" if st in ["IN_TRANSIT", "ON_DUTY"] else "offline"
            rider.save()

        return Response({"id": rider.id, "availability_status": rider.availability_status}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            rider = RiderProfile.objects.get(pk=pk)
            rider.delete()
            return Response({"success": True}, status=status.HTTP_204_NO_CONTENT)
        except RiderProfile.DoesNotExist:
            return Response({"error": "Rider not found"}, status=status.HTTP_404_NOT_FOUND)
