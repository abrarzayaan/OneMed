from django.db import models
from apps.profiles.models import VendorProfile

class VendorPayoutRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='payout_requests')
    requested_amount_bdt = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=100, default='Bank Transfer')
    account_details = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    transaction_trx_id = models.CharField(max_length=100, blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'vendor_payout_requests'
        ordering = ['-requested_at']

    def __str__(self):
        return f"Payout #{self.id} - {self.vendor.pharmacy_name} - {self.requested_amount_bdt} BDT ({self.status})"
