# pyrefly: ignore [missing-import]
from django.db import models
from .category_brand import StatusChoices
from .product_core import Product

class ImageStatusChoices(models.TextChoices):
    ACTIVE = 'active', 'Active'
    HIDDEN = 'hidden', 'Hidden'


# ====================================================================
# 8. Product Variants Model
# ====================================================================
class ProductVariant(models.Model):
    """
    PharmaSys Product Variant Model.
    Handles different configurations like pack sizes (e.g., 10 Pcs, 30 Pcs) or potencies (500mg, 650mg).
    """
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='variants'
    )
    variant_name = models.CharField(
        max_length=255, 
        help_text="e.g., 500mg, 10 Pcs Pack, 100ml Bottle"
    )
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    barcode = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    # Financial Fields
    price = models.DecimalField(max_digits=12, decimal_places=2)  # Regular Price
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # Discounted Price
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # Buying/Vendor Cost
    
    # Order Limitations
    min_order_qty = models.PositiveIntegerField(default=1)
    max_order_qty = models.PositiveIntegerField(null=True, blank=True)
    
    # Shipping/Logistics Fields
    weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        help_text="Weight in grams/kg"
    )
    # Dimensions JSON: { "length": 0, "width": 0, "height": 0, "unit": "cm" }
    dimensions = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.ACTIVE
    )
    
    # ------------------------------------------------------------------
    # JSON Descriptions & Information
    # ------------------------------------------------------------------
    # short_description JSON Example:
    # {
    #     "dosage": "1 tablet twice daily after meals",
    #     "storage": "Store below 30°C in a dry place away from light",
    #     "warnings": "Do not exceed recommended dose",
    #     "side_effects": "Mild dizziness or stomach upset in rare cases"
    # }
    short_description = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="JSON for Usage, Dosage, Storage & Safety Advice"
    )

    # long_description JSON Example:
    # {
    #     "about": "Napa Extra 500mg is a fast-acting pain reliever and fever reducer.",
    #     "highlights": [
    #         "Fast action formula",
    #         "Gentle on stomach",
    #         "Approved by DGDA"
    #     ],
    #     "indications": "Relief from fever, headaches, toothaches, and body pain."
    # }
    long_description = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="JSON for Overview, About, Highlights & Detailed Specs"
    )

    # meta JSON Example:
    # {
    #     "pack_size": "10 Pcs Blister Pack",
    #     "is_hot_deal": true,
    #     "is_best_selling": true,
    #     "is_top_rated": true,
    #     "is_featured": true
    # }
    meta = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="JSON for promotional flags (is_hot_deal, is_best_selling, is_top_rated, is_featured) and pack meta"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ph_product_variants'
        ordering = ['price']

    def __str__(self):
        return f"{self.product.name} - {self.variant_name}"


# ====================================================================
# 9. Product Images Model
# ====================================================================
class ProductImage(models.Model):
    """
    PharmaSys Product Image Gallery.
    Tied directly to a specific variant.
    """
    variant = models.ForeignKey(
        ProductVariant, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image_url = models.ImageField(upload_to='products/gallery/')
    is_primary = models.BooleanField(default=False)  # মেইন ইমেজ ট্র্যাকিং
    sort_order = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20, 
        choices=ImageStatusChoices.choices, 
        default=ImageStatusChoices.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ph_product_images'
        ordering = ['sort_order']

    def __str__(self):
        return f"Image for {self.variant.variant_name if self.variant else 'Variant'}"

    def save(self, *args, **kwargs):
        if self.image_url:
            # pyrefly: ignore [missing-import]
            from django.core.files.uploadedfile import UploadedFile
            if hasattr(self.image_url, 'file') and isinstance(self.image_url.file, UploadedFile):
                self._compress_image()
        super().save(*args, **kwargs)

    def _compress_image(self):
        import io
        import os
        from PIL import Image
        # pyrefly: ignore [missing-import]
        from django.core.files.base import ContentFile

        try:
            img = Image.open(self.image_url)
            
            fmt = img.format if img.format in ['JPEG', 'PNG', 'WEBP'] else 'JPEG'
            if fmt == 'JPEG' and img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            
            output = io.BytesIO()
            if fmt == 'JPEG':
                img.save(output, format='JPEG', quality=75, optimize=True)
                ext = '.jpg'
            elif fmt == 'WEBP':
                img.save(output, format='WEBP', quality=75)
                ext = '.webp'
            else:
                img.save(output, format=fmt, optimize=True)
                ext = f'.{fmt.lower()}'
            
            output.seek(0)
            
            base_name = os.path.splitext(os.path.basename(self.image_url.name))[0]
            new_filename = f"{base_name}{ext}"
            
            self.image_url.save(new_filename, ContentFile(output.getvalue()), save=False)
        except Exception:
            pass