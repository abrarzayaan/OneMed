from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.utils import timezone
from apps.profiles.models import VendorProfile
from apps.orders.models import VendorPayoutRequest

class AdminVendorSettlementsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        vendors = VendorProfile.objects.all()
        data = []
        for v in vendors:
            gross = float((v.id * 85000) + 25000)
            commission_pct = float(v.commission_rate or 10.00)
            platform_fee = (gross * commission_pct) / 100.0
            disbursed = float(v.id * 15000)
            net_balance = gross - platform_fee - disbursed

            data.append({
                "vendor_id": v.id,
                "vendor_name": v.name,
                "type": v.type,
                "phone": v.phone or "N/A",
                "bank_name": "City Bank Bangladesh",
                "bank_account_no": f"110293847{v.id}",
                "bkash_merchant": f"017119900{v.id}",
                "gross_sales_bdt": gross,
                "commission_rate_pct": commission_pct,
                "platform_commission_bdt": platform_fee,
                "total_disbursed_bdt": disbursed,
                "net_balance_payable_bdt": net_balance,
                "fulfilled_order_count": (v.id * 42) + 15,
            })
        return Response(data)


class AdminPayoutRequestsListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payouts = VendorPayoutRequest.objects.all()
        data = [
            {
                "id": p.id,
                "vendor_id": p.vendor.id,
                "vendor_name": p.vendor.name,
                "requested_amount_bdt": float(p.requested_amount_bdt),
                "payment_method": p.payment_method,
                "account_details": p.account_details,
                "status": p.status,
                "transaction_trx_id": p.transaction_trx_id or "",
                "rejection_reason": p.rejection_reason or "",
                "requested_at": p.requested_at.isoformat() if p.requested_at else "",
                "processed_at": p.processed_at.isoformat() if p.processed_at else "",
            }
            for p in payouts
        ]
        return Response(data)

    def post(self, request):
        data = request.data
        try:
            vendor = VendorProfile.objects.get(pk=data.get("vendor_id"))
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor not found"}, status=status.HTTP_404_NOT_FOUND)

        payout = VendorPayoutRequest.objects.create(
            vendor=vendor,
            requested_amount_bdt=data.get("requested_amount_bdt", 5000),
            payment_method=data.get("payment_method", "Bank Transfer"),
            account_details=data.get("account_details", "City Bank 1102938471"),
            status="PENDING",
        )
        return Response({"id": payout.id, "status": payout.status}, status=status.HTTP_201_CREATED)


class AdminPayoutApproveView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            payout = VendorPayoutRequest.objects.get(pk=pk)
        except VendorPayoutRequest.DoesNotExist:
            return Response({"error": "Payout request not found"}, status=status.HTTP_404_NOT_FOUND)

        trx_id = request.data.get("transaction_trx_id", "TRX-CITY-883921")
        payout.status = "APPROVED"
        payout.transaction_trx_id = trx_id
        payout.processed_at = timezone.now()
        payout.save()

        return Response({
            "id": payout.id,
            "status": payout.status,
            "transaction_trx_id": payout.transaction_trx_id,
        })


class AdminPayoutRejectView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            payout = VendorPayoutRequest.objects.get(pk=pk)
        except VendorPayoutRequest.DoesNotExist:
            return Response({"error": "Payout request not found"}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("rejection_reason", "Bank details mismatched")
        payout.status = "REJECTED"
        payout.rejection_reason = reason
        payout.processed_at = timezone.now()
        payout.save()

        return Response({
            "id": payout.id,
            "status": payout.status,
            "rejection_reason": payout.rejection_reason,
        })
