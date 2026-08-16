from rest_framework import serializers
from django.utils.text import slugify
from apps.products.models import ProductAttribute, ProductAttributeValue


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'slug', 'data_type', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def validate(self, attrs):
        """
        Lead Developer Logic: নেমিং কনভেনশন ঠিক রেখে অটো-স্লাগ জেনারেট করা
        """
        if 'name' in attrs:
            attrs['slug'] = slugify(attrs['name'])
        return attrs


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    # ফ্রন্টএন্ডে রিড করার সুবিধার জন্য অ্যাট্রিবিউটের ডিটেইলস নিয়ে আসা
    attribute_name = serializers.CharField(source='attribute.name', read_only=True)
    attribute_data_type = serializers.CharField(source='attribute.data_type', read_only=True)

    class Meta:
        model = ProductAttributeValue
        fields = [
            'id', 'product', 'variant', 'attribute', 'attribute_name', 
            'attribute_data_type', 'value_text', 'value_json', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        """
        Lead Developer Logic: EAV ডাটা টাইপ অনুযায়ী রাইট ফিল্ডে ভ্যালু এসাইন করা নিশ্চিত করা
        """
        attribute = attrs.get('attribute')
        
        # ক্রিয়েট বা আপডেটের সময় মেইন অবজেক্ট বা ডাটাবেস থেকে অ্যাট্রিবিউট টাইপ চেক করা
        if attribute:
            data_type = attribute.data_type
            
            # ডাটা টাইপ যদি JSON হয়, তবে value_json ম্যান্ডেটরি এবং ডিকশনারি হতে হবে
            if data_type == 'json':
                value_json = attrs.get('value_json', {})
                if not value_json or not isinstance(value_json, dict):
                    raise serializers.ValidationError({
                        "value_json": "This attribute requires a valid JSON object as its value."
                    })
            else:
                # অন্য সব টাইপের (text, number, select) জন্য value_text ফিল্ডে ডেটা থাকতে হবে
                value_text = attrs.get('value_text', '').strip()
                if not value_text:
                    raise serializers.ValidationError({
                        "value_text": f"This attribute requires a valid text-based value for type '{data_type}'."
                    })
                    
        return attrs