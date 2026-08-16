from django.db import models
from .category_brand import StatusChoices
from .product_core import Product
from .variants_images import ProductVariant

class DataTypeChoices(models.TextChoices):
    TEXT = 'text', 'Text'
    NUMBER = 'number', 'Number'
    BOOLEAN = 'boolean', 'Boolean'
    DATE = 'date', 'Date'
    JSON = 'json', 'JSON'
    SELECT = 'select', 'Select'


# ====================================================================
# 10. Product Attributes Model (The Specification Schema)
# ====================================================================
class ProductAttribute(models.Model):
    """
    Defines the global dynamic fields. 
    e.g., Name="Dosage", Slug="dosage", DataType="text"
    """
    name = models.CharField(max_length=100, help_text='e.g., Dosage, Storage Temp, Generic Name')
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    data_type = models.CharField(
        max_length=20, 
        choices=DataTypeChoices.choices, 
        default=DataTypeChoices.TEXT
    )
    status = models.CharField(
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ph_product_attributes'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.data_type})"


# ====================================================================
# 11. Product Attribute Values Model (The actual storage)
# ====================================================================
class ProductAttributeValue(models.Model):
    """
    Stores the specific value of an attribute for a product or its variant.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attribute_values')
    # কন্ডিশনাল নাল: অ্যাট্রিবিউট পুরো প্রোডাক্টের হলে ভ্যারিয়েন্ট নাল থাকবে, ভ্যারিয়েন্ট স্পেসিফিক হলে লিঙ্ক হবে
    variant = models.ForeignKey(
        ProductVariant, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='attribute_values'
    )
    attribute = models.ForeignKey(ProductAttribute, on_delete=models.PROTECT, related_name='values')
    
    # স্টোরেজ ফ্লেক্সিবিলিটি: টেক্সট এবং নম্বর/জেসন আলাদা রাখার ব্যবস্থা
    value_text = models.TextField(help_text="Stores string, selection, date or number in text format")
    value_json = models.JSONField(default=dict, blank=True, help_text="Used if data_type is JSON or complex object")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ph_product_attribute_values'
        # ডাটা ডুপ্লিকেশন রোধ করতে ইউনিক কনস্ট্রেইন্ট (একই প্রোডাক্টের একই অ্যাট্রিবিউট দুইবার থাকবে না)
        unique_together = ('product', 'variant', 'attribute')

    def __str__(self):
        val = self.value_text if self.value_text else "JSON Data"
        if self.variant:
            return f"{self.variant.sku} -> {self.attribute.name}: {val}"
        return f"{self.product.name} -> {self.attribute.name}: {val}"