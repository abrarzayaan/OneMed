# pyrefly: ignore [missing-import]
from rest_framework import serializers
from apps.profiles.models import Address, ConsumerProfile, VendorProfile, RiderProfile


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        exclude = ['user', 'created_at', 'updated_at']


class ConsumerProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='user.phone_number', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)

    class Meta:
        model = ConsumerProfile
        fields = ['id', 'date_of_birth', 'gender', 'profile_image', 'phone', 'first_name', 'last_name', 'email']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user = instance.user
            for attr, val in user_data.items():
                setattr(user, attr, val)
            user.save()

        return super().update(instance, validated_data)


class VendorProfileSerializer(serializers.ModelSerializer):
    address = AddressSerializer(required=False, allow_null=True)
    is_profile_complete = serializers.SerializerMethodField()
    logo = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cover_image = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = VendorProfile
        exclude = ['user']
        read_only_fields = ['created_at', 'updated_at', 'status', 'verification_status', 'commission_rate']

    def get_is_profile_complete(self, obj):
        return bool(obj.name and obj.phone and obj.trade_license_no and obj.address)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.logo:
            ret['logo'] = str(instance.logo)
        if instance.cover_image:
            ret['cover_image'] = str(instance.cover_image)
        return ret

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)

        logo_val = validated_data.pop('logo', None)
        if logo_val is not None:
            instance.logo = logo_val

        cover_val = validated_data.pop('cover_image', None)
        if cover_val is not None:
            instance.cover_image = cover_val

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Synchronize User model fields (phone_number, email, name)
        user = instance.user
        if user:
            updated_user = False
            if instance.phone and user.phone_number != instance.phone:
                user.phone_number = instance.phone
                updated_user = True
            if instance.email and user.email != instance.email:
                user.email = instance.email
                updated_user = True
            if instance.name:
                parts = instance.name.strip().split(' ', 1)
                user.first_name = parts[0]
                if len(parts) > 1:
                    user.last_name = parts[1]
                updated_user = True
            if updated_user:
                user.save()

        if address_data:
            if instance.address:
                for attr, value in address_data.items():
                    setattr(instance.address, attr, value)
                instance.address.save()
            else:
                full_addr = address_data.get('full_address') or f"{address_data.get('area', '')}, {address_data.get('city', 'Dhaka')}"
                new_address = Address.objects.create(
                    user=instance.user,
                    label='pharmacy',
                    city=address_data.get('city', 'Dhaka'),
                    area=address_data.get('area', ''),
                    full_address=full_addr
                )
                instance.address = new_address
                instance.save()

        return instance


class RiderProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    phone = serializers.CharField(source='user.phone_number', required=False, allow_blank=True)
    is_profile_complete = serializers.SerializerMethodField()

    class Meta:
        model = RiderProfile
        fields = [
            'id', 'vehicle_type', 'vehicle_number', 'nid_no', 'license_no',
            'availability_status', 'verification_status', 'current_latitude', 'current_longitude',
            'is_profile_complete', 'first_name', 'last_name', 'email', 'phone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'verification_status']

    def get_is_profile_complete(self, obj):
        user = getattr(obj, 'user', None)
        has_phone = bool(user and user.phone_number and str(user.phone_number).strip())
        has_nid = bool(obj.nid_no and str(obj.nid_no).strip())
        has_vehicle = bool(obj.vehicle_type)
        if obj.vehicle_type in ['bike', 'car']:
            has_lic_and_no = bool(obj.license_no and str(obj.license_no).strip() and obj.vehicle_number and str(obj.vehicle_number).strip())
            return bool(has_phone and has_nid and has_vehicle and has_lic_and_no)
        return bool(has_phone and has_nid and has_vehicle)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user = instance.user
            for attr, val in user_data.items():
                setattr(user, attr, val)
            user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance