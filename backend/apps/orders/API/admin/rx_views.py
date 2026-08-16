from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from apps.orders.models import Order

class AdminPrescriptionQueueView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        orders = Order.objects.exclude(prescription_image="").exclude(prescription_image__isnull=True)
        data = []
        for o in orders:
            data.append({
                "id": o.id,
                "order_number": f"ORD-{o.id:04d}",
                "patient_name": o.user.username if o.user else "Anonymous Patient",
                "patient_phone": o.user.phone_number if o.user else "N/A",
                "prescription_url": o.prescription_image if hasattr(o.prescription_image, 'url') else str(o.prescription_image),
                "rx_status": o.status,
                "notes": o.notes or "Verification pending",
                "uploaded_at": o.created_at.isoformat() if o.created_at else "",
            })
        return Response(data)


class AdminPrescriptionVerifyView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order prescription not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")  # APPROVE, REJECT
        notes = request.data.get("notes", "")

        if action == "APPROVE":
            order.status = "APPROVED_FOR_FULFILLMENT"
            order.notes = notes or "Rx verified by Admin Pharmacist"
        elif action == "REJECT":
            order.status = "CANCELLED"
            order.notes = notes or "Rx rejected due to illegible image"
        
        order.save()

        return Response({
            "id": order.id,
            "status": order.status,
            "notes": order.notes,
        })
