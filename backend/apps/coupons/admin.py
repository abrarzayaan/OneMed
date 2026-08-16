from django.contrib import admin
from apps.coupons.models import Coupon, CouponUsage

# Register your models here.
@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'discount_type', 'discount_value', 'max_discount_amount', 'min_order_amount', 
                    'created_at', 'updated_at')
    list_filter = ('code', 'created_at', 'updated_at')
    search_fields = ('code',)
    ordering = ('-created_at',)


admin.site.register(CouponUsage)