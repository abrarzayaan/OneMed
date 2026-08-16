from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.products.models import Brand, Category, Inventory, Product, ProductVariant
from apps.profiles.models import ConsumerProfile, VendorProfile


class AddToCartConsumerProfileTests(APITestCase):
    def test_add_to_cart_assigns_consumer_profile_to_cart(self):
        user = get_user_model().objects.create_user(
            phone_number='4444444444',
            email='consumer@example.com',
            username='consumer',
            password='StrongPass123!',
        )
        consumer_profile = ConsumerProfile.objects.create(
            user=user,
            gender='male',
        )
        vendor_profile = VendorProfile.objects.create(
            user=user,
            name='Vendor One',
            slug='vendor-one',
            status='active',
        )
        category = Category.objects.create(name='Vitamins', slug='vitamins', status='active')
        brand = Brand.objects.create(name='Brand One', slug='brand-one', status='active')
        product = Product.objects.create(
            vendor=vendor_profile,
            category=category,
            brand=brand,
            name='Vitamin C',
            slug='vitamin-c',
            sku='SKU-CART-1',
            barcode='BAR-CART-1',
            status='active',
            approval_status='approved',
        )
        variant = ProductVariant.objects.create(
            product=product,
            variant_name='100mg',
            sku='SKU-VAR-CART-1',
            barcode='BAR-VAR-CART-1',
            price='9.99',
            status='active',
        )
        Inventory.objects.create(
            vendor=vendor_profile,
            variant=variant,
            stock_qty=10,
            status='in_stock',
        )

        self.client.force_authenticate(user)
        response = self.client.post(
            reverse('add-to-cart'),
            {"product_variant_id": variant.id, "quantity": 1},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cart = Cart.objects.get(consumer_profile=consumer_profile)
        self.assertEqual(cart.consumer_profile_id, consumer_profile.id)

    def test_delete_cart_item_uses_product_variant_id(self):
        user = get_user_model().objects.create_user(
            phone_number='5555555555',
            email='consumer-delete@example.com',
            username='consumer-delete',
            password='StrongPass123!',
        )
        consumer_profile = ConsumerProfile.objects.create(user=user)
        vendor_user = get_user_model().objects.create_user(
            phone_number='6666666666',
            email='vendor-delete@example.com',
            username='vendor-delete',
            password='StrongPass123!',
        )
        vendor_profile = VendorProfile.objects.create(
            user=vendor_user,
            name='Vendor Delete',
            slug='vendor-delete',
            status='active',
        )
        category = Category.objects.create(name='Pain Relief', slug='pain-relief-delete', status='active')
        product = Product.objects.create(
            vendor=vendor_profile,
            category=category,
            name='Pain Relief Product',
            slug='pain-relief-product-delete',
            sku='SKU-CART-DELETE',
            barcode='BAR-CART-DELETE',
            status='active',
            approval_status='approved',
        )
        variant = ProductVariant.objects.create(
            product=product,
            variant_name='20 Pack',
            sku='SKU-VAR-DELETE',
            barcode='BAR-VAR-DELETE',
            price='15.00',
            status='active',
        )
        cart = Cart.objects.create(consumer_profile=consumer_profile)
        CartItem.objects.create(cart=cart, product_variant=variant, quantity=1)

        self.client.force_authenticate(user)
        response = self.client.delete(reverse('cart-item', kwargs={'variant_id': variant.id}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(CartItem.objects.filter(cart=cart, product_variant=variant).exists())

    def test_clear_cart_deletes_cart_and_its_items(self):
        user = get_user_model().objects.create_user(
            phone_number='7777777777',
            email='consumer-clear@example.com',
            username='consumer-clear',
            password='StrongPass123!',
        )
        consumer_profile = ConsumerProfile.objects.create(user=user)
        cart = Cart.objects.create(consumer_profile=consumer_profile)

        self.client.force_authenticate(user)
        response = self.client.delete(reverse('clear-cart'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Cart.objects.filter(pk=cart.pk).exists())
