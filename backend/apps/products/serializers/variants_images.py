# pyrefly: ignore [missing-import]
from rest_framework import serializers
from apps.products.models import ProductVariant, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'variant', 'image_url', 'is_primary', 'sort_order', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductVariantSerializer(serializers.ModelSerializer):
    # একটি ভ্যারিয়েন্টের আন্ডারে থাকা ইমেজগুলো একসাথে দেখার জন্য নেস্টেড রিলেশন (Read-Only)
    variant_images = ProductImageSerializer(source='images', many=True, read_only=True)
    product_id = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()
    category_id = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    brand_id = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()
    is_prescription_required = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'product_id', 'product_name', 'product_slug', 'variant_name', 'sku', 'barcode', 
            'short_description', 'long_description',
            'price', 'sale_price', 'cost_price', 'min_order_qty', 'max_order_qty', 
            'weight', 'dimensions', 'status', 'meta', 'thumbnail', 'category_id', 'category_name', 
            'brand_id', 'brand_name', 'is_prescription_required', 'variant_images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_product_id(self, obj):
        try:
            return obj.product.id if obj.product else None
        except Exception:
            return None

    def get_product_name(self, obj):
        try:
            return obj.product.name if obj.product else ""
        except Exception:
            return ""

    def get_product_slug(self, obj):
        try:
            return obj.product.slug if obj.product else ""
        except Exception:
            return ""

    def get_category_id(self, obj):
        try:
            return obj.product.category.id if (obj.product and obj.product.category) else None
        except Exception:
            return None

    def get_category_name(self, obj):
        try:
            return obj.product.category.name if (obj.product and obj.product.category) else ""
        except Exception:
            return ""

    def get_brand_id(self, obj):
        try:
            return obj.product.brand.id if (obj.product and obj.product.brand) else None
        except Exception:
            return None

    def get_brand_name(self, obj):
        try:
            return obj.product.brand.name if (obj.product and obj.product.brand) else ""
        except Exception:
            return ""

    def get_is_prescription_required(self, obj):
        try:
            return obj.product.is_prescription_required if obj.product else False
        except Exception:
            return False

    def get_thumbnail(self, obj):
        try:
            active_images = obj.images.filter(status='active')
            primary_image = active_images.filter(is_primary=True).first()
            if not primary_image:
                primary_image = active_images.first()
            
            if primary_image and primary_image.image_url:
                request = self.context.get('request')
                if request is not None:
                    return request.build_absolute_uri(primary_image.image_url.url)
                return primary_image.image_url.url
            
            if obj.product and obj.product.thumbnail:
                request = self.context.get('request')
                if request is not None:
                    return request.build_absolute_uri(obj.product.thumbnail.url)
                return obj.product.thumbnail.url
        except Exception:
            pass
            
        return None

    def validate(self, attrs):
        """
        Lead Developer Logic: ডাইনামিক প্রাইস ভ্যালিডেশন এবং JSON স্ট্রাকচার কন্ট্রোল
        """
        # ১. বিজনেস লজিক চেক: সেল প্রাইস কখনো রেগুলার প্রাইসের চেয়ে বেশি হতে পারে না
        price = attrs.get('price')
        sale_price = attrs.get('sale_price')
        
        if price and sale_price and sale_price > price:
            raise serializers.ValidationError({
                "sale_price": "Sale price cannot be greater than the regular price."
            })

        # ২. ডাইনামিক Dimensions JSON ভ্যালিডেশন
        dimensions = attrs.get('dimensions', {})
        if not isinstance(dimensions, dict):
            raise serializers.ValidationError({"dimensions": "Dimensions must be a valid JSON object."})
        
        dimensions.setdefault('length', 0.0)
        dimensions.setdefault('width', 0.0)
        dimensions.setdefault('height', 0.0)
        dimensions.setdefault('unit', 'cm')
        attrs['dimensions'] = dimensions

        # ৩. ডাইনামিক Meta JSON ভ্যালিডেশন
        meta = attrs.get('meta', {})
        if not isinstance(meta, dict):
            raise serializers.ValidationError({"meta": "Meta must be a valid JSON object."})
            
        meta.setdefault('pack_size', '')
        meta.setdefault('color', '')
        meta.setdefault('size', '')
        meta.setdefault('is_quick_access', False)
        meta.setdefault('is_hot_deal', False)
        meta.setdefault('is_best_selling', False)
        attrs['meta'] = meta

        return attrs