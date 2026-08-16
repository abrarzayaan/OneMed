# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from drf_spectacular.utils import extend_schema

from apps.profiles.models import ConsumerProfile, VendorProfile, RiderProfile
from apps.profiles.serializers import ConsumerProfileSerializer, VendorProfileSerializer, RiderProfileSerializer
from apps.profiles.permissions import IsConsumer, IsVendor, IsRider

# pyrefly: ignore [missing-import]
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from apps.profiles.models import Address
from apps.profiles.serializers import AddressSerializer


class UserAddressListCreateView(ListCreateAPIView):
    """
    লগইন করা ইউজারের সব অ্যাড্রেস দেখা (GET) এবং নতুন অ্যাড্রেস তৈরি করার (POST) এপিআই।
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        # কেবলমাত্র নিজের একটিভ অ্যাড্রেসগুলোই দেখতে পাবে
        return Address.objects.filter(user=self.request.user, status='active')

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save(user=self.request.user)


class UserAddressDetailView(RetrieveUpdateDestroyAPIView):
    """
    নির্দিষ্ট একটি অ্যাড্রেস দেখা, আপডেট করা বা ডিলিট (Hidden) করার এপিআই।
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        was_default = instance.is_default
        instance.status = 'hidden'
        instance.is_default = False
        instance.save(update_fields=['status', 'is_default', 'updated_at'])

        if was_default:
            next_addr = Address.objects.filter(user=request.user, status='active').first()
            if next_addr:
                next_addr.is_default = True
                next_addr.save(update_fields=['is_default', 'updated_at'])

        return Response(status=status.HTTP_204_NO_CONTENT)



class ConsumerProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsConsumer]

    @extend_schema(responses=ConsumerProfileSerializer)
    def get(self, request):
        profile, created = ConsumerProfile.objects.get_or_create(user=request.user)
        serializer = ConsumerProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=ConsumerProfileSerializer, responses=ConsumerProfileSerializer)
    def patch(self, request):
        profile, created = ConsumerProfile.objects.get_or_create(user=request.user)
        serializer = ConsumerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class VendorProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    @extend_schema(request=VendorProfileSerializer, responses=VendorProfileSerializer)
    def patch(self, request):
        try:
            profile = request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = VendorProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class RiderProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsRider]

    @extend_schema(responses=RiderProfileSerializer)
    def get(self, request):
        profile, created = RiderProfile.objects.get_or_create(user=request.user)
        serializer = RiderProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=RiderProfileSerializer, responses=RiderProfileSerializer)
    def patch(self, request):
        try:
            profile = request.user.rider_profile
        except RiderProfile.DoesNotExist:
            profile = RiderProfile.objects.create(user=request.user)

        serializer = RiderProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class RiderAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsRider]

    def patch(self, request):
        try:
            profile = request.user.rider_profile
        except RiderProfile.DoesNotExist:
            profile = RiderProfile.objects.create(user=request.user)

        status_val = request.data.get('availability_status')
        if status_val in ['online', 'offline', 'busy']:
            profile.availability_status = status_val
            profile.save(update_fields=['availability_status', 'updated_at'])
            return Response({'status': profile.availability_status}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid status choice.'}, status=status.HTTP_400_BAD_REQUEST)