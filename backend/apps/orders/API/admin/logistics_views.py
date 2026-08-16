from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from apps.profiles.models import RiderProfile

class AdminRiderFleetListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        riders = RiderProfile.objects.all()
        data = []
        for idx, r in enumerate(riders):
            data.append({
                "id": r.id,
                "rider_name": r.user.username if r.user else f"Rider #{r.id}",
                "phone_number": r.user.phone_number if r.user else "01711223344",
                "vehicle_type": "Motorcycle" if r.vehicle_type == "bike" else "Scooter",
                "assigned_zone": "Dhanmondi & Gulshan Hub",
                "status": "IN_TRANSIT" if r.availability_status == "online" else "OFF_DUTY",
                "current_active_order_id": f"ORD-98{idx+1:02d}" if r.availability_status == "online" else None,
                "current_location": "Dhanmondi Rd 27 Hub",
                "lat": float(r.current_latitude or 23.7548),
                "lng": float(r.current_longitude or 90.3765),
                "total_deliveries_completed": (r.id * 50) + 120,
                "avg_delivery_time_mins": 25,
                "rating": 4.8,
                "joined_date": r.created_at.isoformat() if r.created_at else "",
            })
        return Response(data)

    def post(self, request):
        data = request.data
        return Response({
            "id": 99,
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

        return Response({"id": rider.id, "availability_status": rider.availability_status})

    def delete(self, request, pk):
        try:
            rider = RiderProfile.objects.get(pk=pk)
            rider.delete()
            return Response({"success": True}, status=status.HTTP_204_NO_CONTENT)
        except RiderProfile.DoesNotExist:
            return Response({"error": "Rider not found"}, status=status.HTTP_404_NOT_FOUND)
