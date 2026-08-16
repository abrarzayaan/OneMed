# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.urls import reverse
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.test import APITestCase

from apps.products.models import Brand, Category, Product, ProductVariant
from apps.profiles.models import VendorProfile


class ProductPermissionTests(APITestCase):
    def setUp(self):
        self.admin_user = get_user_model().objects.create_user(
            phone_number='1111111111',
            email='admin@example.com',
            username='admin',
            password='StrongPass123!',
            is_staff=True,
        )
        self.vendor_user = get_user_model().objects.create_user(
            phone_number='2222222222',
            email='vendor@example.com',
            username='vendor',
            password='StrongPass123!',
        )
        self.category = Category.objects.create(name='Tablets', slug='tablets', status='active')
        self.brand = Brand.objects.create(name='PharmaBrand', slug='pharmabrand', status='active')
        self.url = reverse('product-list')

    def test_staff_user_can_create_product(self):
        self.client.force_authenticate(self.admin_user)
        payload = {
            'name': 'Paracetamol 500mg',
            'category': self.category.id,
            'brand': self.brand.id,
            'sku': 'SKU-ADMIN-1',
            'barcode': 'BAR-ADMIN-1',
            'status': 'active',
            'meta': {'tags': ['painkiller']},
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Product.objects.filter(name='Paracetamol 500mg').exists())

    def test_non_staff_user_cannot_create_product(self):
        self.client.force_authenticate(self.vendor_user)
        payload = {
            'name': 'Vitamin C',
            'category': self.category.id,
            'brand': self.brand.id,
            'sku': 'SKU-VENDOR-1',
            'barcode': 'BAR-VENDOR-1',
            'status': 'active',
            'meta': {'tags': ['vitamin']},
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Product.objects.filter(name='Vitamin C').exists())


class SubCategoryVariantListTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            phone_number='3333333333',
            email='vendor2@example.com',
            username='vendor2',
            password='StrongPass123!',
        )
        self.vendor_profile = VendorProfile.objects.create(
            user=self.user,
            name='Vendor Two',
            slug='vendor-two',
            status='active',
        )
        self.main_category = Category.objects.create(name='Medicines', slug='medicines', status='active')
        self.sub_category = Category.objects.create(
            name='Pain Relief',
            slug='pain-relief',
            parent=self.main_category,
            status='active',
        )
        self.brand = Brand.objects.create(name='TestBrand', slug='testbrand', status='active')
        self.product = Product.objects.create(
            vendor=self.vendor_profile,
            category=self.sub_category,
            brand=self.brand,
            name='Paracetamol 250mg',
            slug='paracetamol-250mg',
            sku='SKU-SUB-1',
            barcode='BAR-SUB-1',
            status='active',
            approval_status='approved',
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            variant_name='10 Pack',
            sku='SKU-VAR-1',
            barcode='BAR-VAR-1',
            price='12.50',
            sale_price='10.00',
            status='active',
        )

    def test_returns_variants_for_active_subcategory_products(self):
        self.client.force_authenticate(self.user)
        url = reverse('subcategory-product-variants', kwargs={'subcategory_id': self.sub_category.id})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['id'], self.variant.id)

    def test_vendor_can_retrieve_own_variant(self):
        """A variant detail lookup must filter through VendorProfile.user."""
        self.client.force_authenticate(self.user)
        url = reverse('variant-detail', kwargs={'pk': self.variant.id})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.variant.id)


class ProductImageTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            phone_number='4444444444',
            email='vendor3@example.com',
            username='vendor3',
            password='StrongPass123!',
        )
        self.vendor_profile = VendorProfile.objects.create(
            user=self.user,
            name='Vendor Three',
            slug='vendor-three',
            status='active',
        )
        self.category = Category.objects.create(name='Syrups', slug='syrups', status='active')
        self.product = Product.objects.create(
            vendor=self.vendor_profile,
            category=self.category,
            name='Cough Syrup',
            slug='cough-syrup',
            status='active',
            approval_status='approved',
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            variant_name='100ml Bottle',
            sku='SKU-SYRUP-1',
            price='50.00',
            status='active',
        )

    def test_product_image_belongs_to_variant(self):
        import io
        from PIL import Image
        # pyrefly: ignore [missing-import]
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.products.models import ProductImage

        # Create large test image in memory
        file_obj = io.BytesIO()
        image = Image.new('RGB', size=(2000, 2000), color=(255, 0, 0))
        image.save(file_obj, 'JPEG', quality=95)
        file_obj.seek(0)

        uploaded_file = SimpleUploadedFile("test_large_image.jpg", file_obj.read(), content_type="image/jpeg")

        img_instance = ProductImage.objects.create(
            variant=self.variant,
            image_url=uploaded_file,
            is_primary=True,
        )

        self.assertEqual(img_instance.variant, self.variant)
        self.assertIn("100ml Bottle", str(img_instance))

        # Verify image compression occurred (dimensions <= 1200)
        saved_img = Image.open(img_instance.image_url)
        self.assertLessEqual(saved_img.width, 1200)
        self.assertLessEqual(saved_img.height, 1200)

        # Test subcategory variant list returns variant thumbnail
        url = reverse('subcategory-product-variants', kwargs={'subcategory_id': self.category.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['results'][0]['thumbnail'].endswith(img_instance.image_url.url))

