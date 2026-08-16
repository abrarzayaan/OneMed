from rest_framework import serializers
from django.utils.text import slugify
from apps.products.models import Category, Brand


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'status', 'metadata', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def validate(self, attrs):
        """
        Lead Developer Logic: অটো-স্লাগ জেনারেশন এবং JSON মেটাডেটা ভ্যালিডেশন
        """
        # নাম থেকে অটোমেটিক ইউনিক স্ল্যাগ তৈরি করা
        if 'name' in attrs:
            attrs['slug'] = slugify(attrs['name'])
            
        # ফ্রন্টএন্ড থেকে আসা মেটাডেটা ফিল্ড ভ্যালিডেশন (ফাঁকা আসলে ডিফল্ট স্ট্রাকচার দেওয়া)
        metadata = attrs.get('metadata', {})
        if not isinstance(metadata, dict):
            raise serializers.ValidationError({"metadata": "Metadata must be a valid JSON object."})
            
        # ডিফল্ট কি (Keys) নিশ্চিত করা
        metadata.setdefault('country_origin', '')
        metadata.setdefault('website', '')
        attrs['metadata'] = metadata
        
        return attrs


class CategorySerializer(serializers.ModelSerializer):
    # চাইল্ড ক্যাটাগরিগুলো রিলেশনশিপ আকারে দেখার জন্য (Read Only)
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'parent', 'name', 'slug', 'image', 'icon', 
            'sort_order', 'status', 'metadata', 'children', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_children(self, obj):
        """ক্যাটাগরির আন্ডারে কোনো সাব-ক্যাটাগরি থাকলে তা নেস্টেড আকারে দেখাবে"""
        if obj.children.exists():
            # রিকারসিভ কল (নিজেদের সিরিয়ালাইজার নিজেই লুপ করছে চাইল্ডদের জন্য)
            return CategorySerializer(obj.children.all(), many=True).data
        return []

    def validate(self, attrs):
        """
        Lead Developer Logic: সেলফ-রেফারেন্স লুপ আটকানো এবং মেটাডেটা লক করা
        """
        # ১. অটো-স্লাগ জেনারেশন
        if 'name' in attrs:
            attrs['slug'] = slugify(attrs['name'])
            
        # ২. সিকিউরিটি চেক: কোনো ক্যাটাগরি যেন নিজেকেই নিজের প্যারেন্ট না বানিয়ে ফেলে (Infinite Loop Protection)
        parent = attrs.get('parent')
        if parent and self.instance and parent.id == self.instance.id:
            raise serializers.ValidationError({"parent": "A category cannot be its own parent."})

        # ৩. মেটাডেটা ভ্যালিডেশন
        metadata = attrs.get('metadata', {})
        if not isinstance(metadata, dict):
            raise serializers.ValidationError({"metadata": "Metadata must be a valid JSON object."})
            
        metadata.setdefault('show_on_homepage', False)
        metadata.setdefault('seo_title', '')
        metadata.setdefault('seo_description', '')
        attrs['metadata'] = metadata

        return attrs