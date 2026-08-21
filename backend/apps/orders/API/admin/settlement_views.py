from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count

# pyrefly: ignore [missing-import]
from apps.profiles.models import VendorProfile
# pyrefly: ignore [missing-import]
from apps.orders.models import OrderItem, VendorPayoutRequest
# pyrefly: ignore [missing-import]
from apps.orders.choices import OrderStatus


class AdminVendorSettlementsListView(APIView):
    """
    Returns live dynamic vendor financial settlement data from PostgreSQL.
    Calculates actual gross sales from delivered order items, platform commission,
    total disbursed payouts, and current net balance payable.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        vendors = VendorProfile.objects.all()
        data = []
        for v in vendors:
            # 1. Real gross sales from delivered orders
            sales_agg = OrderItem.objects.filter(
                vendor=v,
                order__order_status=OrderStatus.DELIVERED
            ).aggregate(
                gross=Sum('total_price'),
                order_cnt=Count('order_id', distinct=True)
            )

            gross = float(sales_agg['gross'] or 0.0)
            fulfilled_count = sales_agg['order_cnt'] or 0

            # 2. Commission rate and fee
            commission_pct = float(v.commission_rate if v.commission_rate is not None else 10.00)
            platform_fee = round((gross * commission_pct) / 100.0, 2)

            # 3. Real disbursed payouts from approved payout requests
            payouts_agg = VendorPayoutRequest.objects.filter(
                vendor=v,
                status='APPROVED'
            ).aggregate(disbursed=Sum('requested_amount_bdt'))

            disbursed = float(payouts_agg['disbursed'] or 0.0)
            net_balance = max(0.0, round(gross - platform_fee - disbursed, 2))

            data.append({
                "vendor_id": v.id,
                "vendor_name": v.name or f"Vendor #{v.id}",
                "type": v.type or "pharmacy",
                "phone": v.phone or getattr(v.user, 'phone_number', '') or "N/A",
                "bank_name": "City Bank Bangladesh",
                "bank_account_no": v.tax_number or f"ACC-{v.id:06d}",
                "bkash_merchant": v.phone or "N/A",
                "gross_sales_bdt": gross,
                "commission_rate_pct": commission_pct,
                "platform_commission_bdt": platform_fee,
                "total_disbursed_bdt": disbursed,
                "net_balance_payable_bdt": net_balance,
                "fulfilled_order_count": fulfilled_count,
            })
        return Response(data, status=status.HTTP_200_OK)


class AdminPayoutRequestsListCreateView(APIView):
    """
    Lists and creates vendor payout requests dynamically.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        payouts = VendorPayoutRequest.objects.select_related('vendor').all().order_by('-requested_at')
        data = [
            {
                "id": p.id,
                "vendor_id": p.vendor.id,
                "vendor_name": p.vendor.name or f"Vendor #{p.vendor.id}",
                "requested_amount_bdt": float(p.requested_amount_bdt or 0.0),
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
        return Response(data, status=status.HTTP_200_OK)

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
            account_details=data.get("account_details", "City Bank"),
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

        trx_id = request.data.get("transaction_trx_id", f"TRX-BDT-{int(timezone.now().timestamp())}")
        payout.status = "APPROVED"
        payout.transaction_trx_id = trx_id
        payout.processed_at = timezone.now()
        payout.save()

        return Response({
            "id": payout.id,
            "status": payout.status,
            "transaction_trx_id": payout.transaction_trx_id,
        }, status=status.HTTP_200_OK)


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
        }, status=status.HTTP_200_OK)
