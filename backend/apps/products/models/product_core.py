from django.db import models
from django.conf import settings  # কাস্টম Auth User (Vendor) মডেল লিঙ্ক করার জন্য
from django.utils import timezone
from .category_brand import Category, Brand
from apps.profiles.models import VendorProfile  # ভেন্ডর প্রোফাইলের সাথে রিলেশন করার জন্য

class ProductTypeChoices(models.TextChoices):
    SIMPLE = 'simple', 'Simple'
    VARIABLE = 'variable', 'Variable'
    DIGITAL = 'digital', 'Digital'
    BUNDLE = 'bundle', 'Bundle'
    CONFIGURABLE = 'configurable', 'Configurable'


class ProductStatusChoices(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
    OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'
    ARCHIVED = 'archived', 'Archived'


class ApprovalStatusChoices(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'


# ====================================================================
# Soft Delete Manager (নিরাপত্তার জন্য ডিলিট হওয়া প্রোডাক্ট হাইড রাখবে)
# ====================================================================
class ActiveProductManager(models.Manager):
    def get_queryset(self):
        # এটি কুয়েরি করার সময় ডিলিট হওয়া প্রোডাক্টগুলোকে ফিল্টার করে বাদ দেবে
        return super().get_queryset().filter(deleted_at__isnull=True)


# ====================================================================
# 7. Core Products Model
# ====================================================================
class Product(models.Model):
    # PharmaSys-P1 Auth Integration: ভেন্ডর ডিলিট হলে প্রোডাক্টও চলে যাবে (Cascade)
    vendor = models.ForeignKey(
        # settings.AUTH_USER_MODEL, -- wrong eta karon ekhne users table er sob users ke dekacchilo so eta hobe na.
        VendorProfile,
        on_delete=models.CASCADE, 
        related_name='vendor_products'
    )
    # ক্যাটাগরি ডিলিট করতে দিলে প্রোডাক্ট এতিম হয়ে যাবে, তাই PROTECT রুল ব্যবহার করেছি
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT, 
        related_name='category_products'
    )
    brand = models.ForeignKey(
        Brand, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='brand_products'
    )
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    short_description = models.TextField(blank=True)
    long_description = models.TextField(blank=True)
    
    # Simple প্রোডাক্টের জন্য সরাসরি এখানে SKU/Barcode বসবে
    sku = models.CharField(max_length=100, unique=True, null=True, blank=True, db_index=True)
    barcode = models.CharField(max_length=100, unique=True, null=True, blank=True)
    thumbnail = models.ImageField(upload_to='products/thumbnails/', null=True, blank=True)
    
    product_type = models.CharField(
        max_length=20, 
        choices=ProductTypeChoices.choices, 
        default=ProductTypeChoices.SIMPLE
    )
    is_prescription_required = models.BooleanField(default=False)  # ফার্মাসি স্পেসিফিক রুল
    
    status = models.CharField(
        max_length=20, 
        choices=ProductStatusChoices.choices, 
        default=ProductStatusChoices.DRAFT
    )
    approval_status = models.CharField(
        max_length=20, 
        choices=ApprovalStatusChoices.choices, 
        default=ApprovalStatusChoices.PENDING
    )
    
    # JSON Meta: { "tags": [], "seo_title": "", "seo_description": "", "returnable": true, "warranty_days": 0 }
    meta = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)  # সফট ডিলিট টাইমস্ট্যাম্প

    # Managers
    objects = models.Manager()  # ডিফল্ট ম্যানেজার (সব ডেটা সহ)
    active_objects = ActiveProductManager()  # শুধু লাইভ প্রোডাক্টের জন্য কাস্টম ম্যানেজার

    class Meta:
        db_table = 'ph_products'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def soft_delete(self):
        """ডাটাবেস থেকে পার্মানেন্টলি ডিলিট না করে হাইড করার মেথড"""
        self.deleted_at = timezone.now()
        self.save()