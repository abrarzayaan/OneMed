from django.db import models
from django.conf import settings  # কাস্টম Auth User (Vendor) ট্র্যাকিংয়ের জন্য
from .variants_images import ProductVariant
from apps.profiles.models import VendorProfile

class InventoryStatusChoices(models.TextChoices):
    IN_STOCK = 'in_stock', 'In Stock'
    LOW_STOCK = 'low_stock', 'Low Stock'
    OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'
    BLOCKED = 'blocked', 'Blocked / On Hold'


# ====================================================================
# 12. Inventories Model
# ====================================================================
class Inventory(models.Model):
    """
    PharmaSys Inventory Control Model.
    Tracks live stock, reservations (during checkout), and reorder alerts.
    """
    # নির্দিষ্ট কোনো ভেন্ডরের স্টক কিনা তা ট্র্যাক করার জন্য
    vendor = models.ForeignKey(
        VendorProfile,  # ভেন্ডর প্রোফাইলের সাথে রিলেশন করার জন্য 
        on_delete=models.CASCADE, 
        related_name='inventories'
    )
    # প্রতিটি ইনভেন্টরি এন্ট্রি সরাসরি একটি স্পেসিফিক ভ্যারিয়েন্টের সাথে লিঙ্কড থাকবে
    variant = models.ForeignKey(
        ProductVariant, 
        on_delete=models.CASCADE, 
        related_name='inventories'
    )
    
    stock_qty = models.PositiveIntegerField(default=0, help_text="Actual physical stock in warehouse")
    reserved_qty = models.PositiveIntegerField(default=0, help_text="Stock locked in customer carts or pending orders")
    damaged_qty = models.PositiveIntegerField(default=0, help_text="Expired or damaged items, not for sale")
    reorder_level = models.PositiveIntegerField(default=10, help_text="Alert threshold when stock runs low")
    
    status = models.CharField(
        max_length=20, 
        choices=InventoryStatusChoices.choices, 
        default=InventoryStatusChoices.OUT_OF_STOCK
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ph_inventories'
        # একই ভেন্ডরের একই ভ্যারিয়েন্টের জন্য ডাটাবেসে একটাই ইনভেন্টরি রো থাকবে
        unique_together = ('vendor', 'variant')
        verbose_name_plural = "Inventories"

    def __str__(self):
        return f"{self.variant.sku} - Stock: {self.stock_qty}"

    @property
    def available_stock(self):
        """
        ক্যালকুলেটেড প্রোপার্টি: রিয়েল-টাইমে কাস্টমার কতটুকু কিনতে পারবে তা হিসাব করে।
        Formula: Available = Physical Stock - (Reserved + Damaged)
        """
        available = self.stock_qty - (self.reserved_qty + self.damaged_qty)
        return max(0, available)  # নেগেটিভ ভ্যালু প্রোটেকশন