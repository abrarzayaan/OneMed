# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.utils.text import slugify
# pyrefly: ignore [missing-import]
from apps.products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    # রিলেশনাল ডেটা রিড করার সময় নাম দেখানোর জন্য (Optional কিন্তু ফ্রন্টএন্ডের জন্য হেল্পফুল)
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    vendor_username = serializers.CharField(source='vendor.username', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'vendor_username', 'category', 'category_name', 
            'brand', 'brand_name', 'name', 'slug', 'short_description', 
            'long_description', 'sku', 'barcode', 'thumbnail', 'product_type', 
            'is_prescription_required', 'status', 'approval_status', 'meta', 
            'created_at', 'updated_at'
        ]
        # সিকিউরিটি এবং অটো-ফিলিংয়ের জন্য এই ফিল্ডগুলো রিড-অনলি থাকবে
        read_only_fields = ['id', 'vendor', 'slug', 'approval_status', 'created_at', 'updated_at']

    def validate(self, attrs):
        """
        Lead Developer Logic: অটো-স্লাগ এবং মেটা JSON ভ্যালিডেশন
        """
        # ১. নাম থেকে অটো-স্লাগ তৈরি
        if 'name' in attrs:
            attrs['slug'] = slugify(attrs['name'])

        # ২. প্রোডাক্ট মেটা ফিল্ডের ডাইনামিক স্ট্রাকচার ভ্যালিডেশন
        meta = attrs.get('meta', {})
        if not isinstance(meta, dict):
            raise serializers.ValidationError({"meta": "Meta must be a valid JSON object."})

        # ডিফল্ট প্রয়োজনীয় কি (Keys) ফিক্সড করে দেওয়া যেন ফ্রন্টএন্ডে নাল এরর না খায়
        meta.setdefault('tags', [])
        meta.setdefault('seo_title', '')
        meta.setdefault('seo_description', '')
        meta.setdefault('returnable', True)
        meta.setdefault('warranty_days', 0)
        attrs['meta'] = meta

        return attrs

    def create(self, validated_data):
        """
        Lead Developer Logic: রিকোয়েস্ট ইউজারকে অটোমেটিক ভেন্ডর হিসেবে অ্যাসাইন করা এবং এডমিন ক্যাটালগ প্রোডাক্ট অটো-অ্যাপ্রুভ করা
        """
        # ভিউ (View) থেকে পাস হওয়া রিকোয়েস্ট অবজেক্ট থেকে কারেন্ট লগইনড ইউজারকে নেওয়া হচ্ছে
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            from apps.profiles.models import VendorProfile
            if hasattr(request.user, 'vendor_profile'):
                validated_data['vendor'] = request.user.vendor_profile
            else:
                # If staff/admin and does not have vendor profile, create/get one
                vendor_profile, _ = VendorProfile.objects.get_or_create(
                    user=request.user,
                    defaults={
                        'name': f"{request.user.username} Vendor",
                        'slug': f"{request.user.username}-vendor",
                        'status': 'active'
                    }
                )
                validated_data['vendor'] = vendor_profile
            
        # Admin / Catalog creation auto-approve
        validated_data['approval_status'] = 'approved'
        if 'status' not in validated_data or not validated_data['status']:
            validated_data['status'] = 'active'

        return super().create(validated_data)