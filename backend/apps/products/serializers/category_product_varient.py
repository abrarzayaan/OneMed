# pyrefly: ignore [missing-import]
from rest_framework import serializers

from apps.products.models import Category, ProductVariant


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "image",
            "icon",
        )


class ProductVariantListSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)

    category_id = serializers.IntegerField(source="product.category.id", read_only=True)
    category_name = serializers.CharField(source="product.category.name", read_only=True)

    brand_id = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()

    thumbnail = serializers.SerializerMethodField()

    is_prescription_required = serializers.BooleanField(
        source="product.is_prescription_required",
        read_only=True,
    )

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "product_id",
            "product_name",
            "product_slug",
            "variant_name",
            "short_description",
            "sku",
            "price",
            "sale_price",
            "thumbnail",
            "category_id",
            "category_name",
            "brand_id",
            "brand_name",
            "is_prescription_required",
            "meta",
        )

    def get_thumbnail(self, obj):
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
            
        return None

    def get_brand_id(self, obj):
        if obj.product.brand:
            return obj.product.brand.id
        return None

    def get_brand_name(self, obj):
        if obj.product.brand:
            return obj.product.brand.name
        return None