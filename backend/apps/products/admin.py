# pyrefly: ignore [missing-import]
from django.contrib import admin
from apps.products.models import (
    Category, Brand, Product, ProductVariant, 
    ProductImage, ProductAttribute, ProductAttributeValue, Inventory
)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'parent', 'sort_order', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}  # অ্যাডমিনে টাইপ করার সময় অটো স্লাগ হবে

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}

# প্রোডাক্ট পেজের ভেতরেই যেন ভ্যারিয়েন্ট এবং ইমেজ যোগ করা যায়, সেজন্য Inline ব্যবহার করা হয়েছে
class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'vendor', 'category', 'product_type', 'status', 'approval_status']
    list_filter = ['product_type', 'status', 'approval_status', 'is_prescription_required']
    search_fields = ['name', 'sku', 'barcode']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductVariantInline]

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'variant_name', 'sku', 'price', 'status']
    list_filter = ['status']
    search_fields = ['variant_name', 'sku', 'barcode']
    inlines = [ProductImageInline]

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'variant', 'is_primary', 'sort_order', 'status']

@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug', 'data_type', 'status']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'variant', 'attribute', 'value_text']

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor', 'variant', 'stock_qty', 'reserved_qty', 'damaged_qty', 'status']
    list_filter = ['status']