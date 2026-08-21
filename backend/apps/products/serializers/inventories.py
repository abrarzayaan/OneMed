# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from apps.products.models import Inventory


class InventorySerializer(serializers.ModelSerializer):
    available_stock = serializers.IntegerField(read_only=True)
    
    variant_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    sku = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()
    vendor_name = serializers.SerializerMethodField()
    unit_cost_bdt = serializers.SerializerMethodField()
    batch_number = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = [
            'id', 'vendor', 'vendor_name', 'variant', 'product_name', 'variant_name', 
            'sku', 'brand_name', 'unit_cost_bdt', 'batch_number',
            'stock_qty', 'reserved_qty', 'damaged_qty', 'reorder_level', 
            'available_stock', 'status', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'updated_at']
        extra_kwargs = {
            'vendor': {'required': False, 'allow_null': True}
        }

    def get_variant_name(self, obj):
        try:
            return obj.variant.variant_name if obj.variant else ""
        except Exception:
            return ""

    def get_product_name(self, obj):
        try:
            return obj.variant.product.name if (obj.variant and obj.variant.product) else ""
        except Exception:
            return ""

    def get_sku(self, obj):
        try:
            return obj.variant.sku if obj.variant else f"SKU-{obj.id:04d}"
        except Exception:
            return f"SKU-{obj.id:04d}"

    def get_brand_name(self, obj):
        try:
            if obj.variant and obj.variant.product and obj.variant.product.brand:
                return obj.variant.product.brand.name
            return "General Brand"
        except Exception:
            return "General Brand"

    def get_vendor_name(self, obj):
        try:
            return obj.vendor.name if obj.vendor else "Central Warehouse"
        except Exception:
            return "Central Warehouse"

    def get_unit_cost_bdt(self, obj):
        try:
            if obj.variant:
                return float(obj.variant.cost_price or obj.variant.price or 0.0)
            return 0.0
        except Exception:
            return 0.0

    def get_batch_number(self, obj):
        return f"BATCH-{obj.id:04d}"

    def validate(self, attrs):
        stock_qty = attrs.get('stock_qty', self.instance.stock_qty if self.instance else 0)
        reserved_qty = attrs.get('reserved_qty', self.instance.reserved_qty if self.instance else 0)
        damaged_qty = attrs.get('damaged_qty', self.instance.damaged_qty if self.instance else 0)
        reorder_level = attrs.get('reorder_level', self.instance.reorder_level if self.instance else 10)

        if (reserved_qty + damaged_qty) > stock_qty:
            raise serializers.ValidationError({
                "stock_qty": "Total reserved and damaged stock cannot exceed the actual physical stock qty."
            })

        available = stock_qty - (reserved_qty + damaged_qty)
        
        if available <= 0:
            attrs['status'] = 'out_of_stock'
        elif available <= reorder_level:
            attrs['status'] = 'low_stock'
        else:
            attrs['status'] = 'in_stock'

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if not validated_data.get('vendor') and request and hasattr(request, 'user'):
            # pyrefly: ignore [missing-import]
            from apps.profiles.models import VendorProfile
            user = request.user
            if hasattr(user, 'vendor_profile'):
                validated_data['vendor'] = user.vendor_profile
            else:
                vprof = VendorProfile.objects.filter(user=user).first()
                if not vprof:
                    vprof = VendorProfile.objects.first()
                if not vprof:
                    vprof, _ = VendorProfile.objects.get_or_create(
                        user=user,
                        defaults={'name': f"{user.username} Store", 'slug': f"{user.username}-store", 'status': 'active'}
                    )
                validated_data['vendor'] = vprof
            
        return super().create(validated_data)