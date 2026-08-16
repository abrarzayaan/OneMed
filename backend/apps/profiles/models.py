from django.db import models
from django.conf import settings

# ==========================================
# 1. ADDRESSES MODEL
# ==========================================
class Address(models.Model):
    LABEL_CHOICES = [
        ('home', 'Home'),
        ('office', 'Office'),
        ('pharmacy', 'Pharmacy'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('hidden', 'Hidden'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=20, choices=LABEL_CHOICES, default='home')
    receiver_name = models.CharField(max_length=255, blank=True, null=True)
    receiver_phone = models.CharField(max_length=20, blank=True, null=True)
    full_address = models.TextField()
    landmark = models.CharField(max_length=255, blank=True, null=True)
    area = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    is_default = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'addresses'
        verbose_name_plural = 'Addresses'

    def __str__(self):
        return f"{self.user.username} - {self.label} ({self.city})"


# ==========================================
# 2. CONSUMER PROFILE MODEL
# ==========================================
class ConsumerProfile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='consumer_profile')
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profiles/consumers/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'consumer_profiles'

    def __str__(self):
        return f"Consumer: {self.user.username}"


# ==========================================
# 3. VENDOR PROFILE MODEL
# ==========================================
class VendorProfile(models.Model):
    TYPE_CHOICES = [
        ('pharmacy', 'Pharmacy'),
        ('grocery', 'Grocery'),
        ('mart', 'Mart'),
        ('health_store', 'Health Store'),
        ('cosmetics', 'Cosmetics'),
        ('electronics', 'Electronics'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('paused', 'Paused'),
        ('blocked', 'Blocked'),
    ]
    VERIFICATION_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vendor_profile')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='pharmacy')
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    logo = models.ImageField(upload_to='vendors/logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='vendors/covers/', blank=True, null=True)
    
    # ঠিকানা ম্যাপ করার জন্য Address মডেলের সাথে OneToOne বা ForeignKey (এখানে OneToOne ভেন্ডরের মেইন ব্রাঞ্চের জন্য)
    address = models.OneToOneField(Address, on_delete=models.SET_NULL, null=True, blank=True, related_name='vendor')
    
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # যেমন: 10.50%
    tax_number = models.CharField(max_length=100, blank=True, null=True)
    trade_license_no = models.CharField(max_length=100, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='pending')
    
    # ওপেনিং/ক্লোজিং টাইম, ডেলিভারি রেডিয়াসের মতো ফ্লেক্সিবল ডেটার জন্য JSONField
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendor_profiles'

    def __str__(self):
        return f"Vendor: {self.name} ({self.type})"


# ==========================================
# 4. RIDER PROFILE MODEL
# ==========================================
class RiderProfile(models.Model):
    VEHICLE_CHOICES = [
        ('bike', 'Bike'),
        ('cycle', 'Cycle'),
        ('car', 'Car'),
    ]
    AVAILABILITY_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('busy', 'Busy'),
    ]
    VERIFICATION_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rider_profile')
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, default='bike')
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    nid_no = models.CharField(max_length=50, unique=True, blank=True, null=True)
    license_no = models.CharField(max_length=100, unique=True, blank=True, null=True)
    
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='offline')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='pending')
    
    # লাইভ ট্র্যাকিং এর জন্য কোঅর্ডিনেটস
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    meta = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rider_profiles'

    def __str__(self):
        return f"Rider: {self.user.username} ({self.vehicle_type})"