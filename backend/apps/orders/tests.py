# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.urls import reverse
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.test import APITestCase

from apps.authentication.models import Role, UserRole
from apps.profiles.models import ConsumerProfile, VendorProfile, RiderProfile, Address
from apps.products.models import Category, Brand, Product, ProductVariant, Inventory
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem, Payment, OrderStatusHistory
from apps.orders.choices import OrderStatus, PaymentStatus, PaymentMethod
from apps.coupons.models import Coupon, CouponUsage

User = get_user_model()


class OrderModuleTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        # 1. Create Roles
        cls.consumer_role = Role.objects.create(name="consumer")
        cls.vendor_role = Role.objects.create(name="vendor")
        cls.rider_role = Role.objects.create(name="rider")
        cls.admin_role = Role.objects.create(name="admin")

        # 2. Create Admin User
        cls.admin_user = User.objects.create_user(
            phone_number="01711111111",
            email="admin@example.com",
            username="admin",
            password="AdminPass123!",
            is_staff=True
        )
        UserRole.objects.create(user=cls.admin_user, role=cls.admin_role)

        # 3. Create Consumer User & Profile
        cls.consumer_user = User.objects.create_user(
            phone_number="01722222222",
            email="consumer@example.com",
            username="consumer",
            password="ConsumerPass123!"
        )
        UserRole.objects.create(user=cls.consumer_user, role=cls.consumer_role)
        cls.consumer_profile = ConsumerProfile.objects.create(
            user=cls.consumer_user,
            gender="male"
        )

        # 4. Create Address for Consumer
        cls.address = Address.objects.create(
            user=cls.consumer_user,
            label="home",
            receiver_name="Consumer Receiver",
            receiver_phone="01722222222",
            full_address="House 12, Road 5, Dhanmondi",
            area="Dhanmondi",
            city="Dhaka",
            status="active"
        )

        # 5. Create Vendor User & Profile
        cls.vendor_user = User.objects.create_user(
            phone_number="01733333333",
            email="vendor@example.com",
            username="vendor",
            password="VendorPass123!"
        )
        UserRole.objects.create(user=cls.vendor_user, role=cls.vendor_role)
        cls.vendor_profile = VendorProfile.objects.create(
            user=cls.vendor_user,
            name="Lazz Pharma",
            slug="lazz-pharma",
            type="pharmacy",
            status="active",
            verification_status="verified"
        )

        # 6. Create Rider User & Profile
        cls.rider_user = User.objects.create_user(
            phone_number="01744444444",
            email="rider@example.com",
            username="rider",
            password="RiderPass123!"
        )
        UserRole.objects.create(user=cls.rider_user, role=cls.rider_role)
        cls.rider_profile = RiderProfile.objects.create(
            user=cls.rider_user,
            vehicle_type="bike",
            availability_status="online",
            verification_status="verified"
        )

        # 7. Create Product Category & Brand
        cls.category = Category.objects.create(name="Medicines", slug="medicines", status="active")
        cls.brand = Brand.objects.create(name="Square", slug="square", status="active")

        # 8. Create Product, Variant & Inventory
        cls.product = Product.objects.create(
            vendor=cls.vendor_profile,
            category=cls.category,
            brand=cls.brand,
            name="Napa Extra",
            slug="napa-extra",
            status="active",
            approval_status="approved"
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.product,
            variant_name="500mg",
            sku="MED-NAPA-500",
            price="120.00",
            status="active"
        )
        cls.inventory = Inventory.objects.create(
            vendor=cls.vendor_profile,
            variant=cls.variant,
            stock_qty=100,
            status="in_stock"
        )

        # 9. Create Coupon
        cls.coupon = Coupon.objects.create(
            code="SAVE10",
            title="Save 10 Taka",
            discount_type="FIXED",
            discount_value="10.00",
            min_order_amount="100.00",
            usage_limit=10,
            per_user_limit=1,
            start_at=timezone.now() - timezone.timedelta(days=1),
            end_at=timezone.now() + timezone.timedelta(days=1),
            status="ACTIVE"
        )

    def setUp(self):
        # Initialize Cart for Consumer
        self.cart = Cart.objects.create(consumer_profile=self.consumer_profile)
        self.cart_item = CartItem.objects.create(
            cart=self.cart,
            product_variant=self.variant,
            quantity=2
        )

    def test_customer_order_placement_and_retrieval(self):
        self.client.force_authenticate(self.consumer_user)
        
        # Test Order Placement (POST /api/orders/)
        url = reverse("customer-orders-list")
        payload = {
            "address_id": self.address.id,
            "payment_method": "COD",
            "coupon_code": "SAVE10"
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["order_status"], OrderStatus.PLACED)
        self.assertIn("grand_total", response.data)
        self.assertIn("order_number", response.data)
        
        order_id = response.data["id"]
        
        # Verify Cart is cleared
        self.assertEqual(CartItem.objects.filter(cart=self.cart).count(), 0)

        # Test List Orders (GET /api/orders/)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)

        # Test Retrieve Order (GET /api/orders/{id}/)
        detail_url = reverse("customer-orders-detail", args=[order_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_number"], Order.objects.get(id=order_id).order_number)

    def test_customer_can_buy_now_without_changing_cart(self):
        self.client.force_authenticate(self.consumer_user)
        url = reverse("customer-orders-buy-now")
        response = self.client.post(url, {
            "product_variant_id": self.variant.id,
            "quantity": 1,
            "address_id": self.address.id,
            "payment_method": "COD",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["items"][0]["product_variant"], self.variant.id)
        self.assertEqual(response.data["items"][0]["quantity"], 1)
        self.assertTrue(CartItem.objects.filter(pk=self.cart_item.pk).exists())

    def test_customer_can_preview_direct_variant_checkout(self):
        self.client.force_authenticate(self.consumer_user)
        url = reverse("direct-checkout", kwargs={"variant_id": self.variant.id})
        response = self.client.post(url, {
            "quantity": 1,
            "address_id": self.address.id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"][0]["product_variant_id"], self.variant.id)
        self.assertEqual(response.data["items"][0]["quantity"], 1)

    def test_customer_order_cancellation(self):
        self.client.force_authenticate(self.consumer_user)
        
        # Create an Order
        order = Order.objects.create(
            order_number="ORD-1111",
            customer=self.consumer_profile,
            address=self.address,
            address_snapshot={},
            subtotal=240,
            grand_total=240,
            payment_method="COD"
        )
        Payment.objects.create(order=order, method="COD", amount=240)
        
        # Cancel Order
        cancel_url = reverse("customer-orders-cancel", args=[order.id])
        response = self.client.patch(cancel_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_status"], OrderStatus.CANCELLED)
        
        # Trying to cancel again or a confirmed order should fail
        order.order_status = OrderStatus.CONFIRMED
        order.save()
        response = self.client.patch(cancel_url)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

    def test_customer_order_tracking(self):
        self.client.force_authenticate(self.consumer_user)
        
        order = Order.objects.create(
            order_number="ORD-2222",
            customer=self.consumer_profile,
            address=self.address,
            address_snapshot={},
            subtotal=240,
            grand_total=240,
            payment_method="COD"
        )
        OrderStatusHistory.objects.create(
            order=order,
            status=OrderStatus.PLACED,
            remarks="Order placed."
        )

        tracking_url = reverse("customer-orders-tracking", args=[order.id])
        response = self.client.get(tracking_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("history", response.data)
        self.assertEqual(len(response.data["history"]), 1)
        self.assertEqual(response.data["current_status"], OrderStatus.PLACED)

    def test_admin_order_flow(self):
        self.client.force_authenticate(self.admin_user)
        
        # 1. Create a placed order
        order = Order.objects.create(
            order_number="ORD-3333",
            customer=self.consumer_profile,
            address=self.address,
            address_snapshot={},
            subtotal=240,
            grand_total=230,
            coupon=self.coupon,
            payment_method="COD"
        )
        payment = Payment.objects.create(order=order, method="COD", amount=230)
        order_item = OrderItem.objects.create(
            order=order,
            product_variant=self.variant,
            quantity=2,
            unit_price=120.00,
            total_price=240.00,
            product_snapshot={}
        )

        # 2. List all orders (GET /api/admin/orders/)
        url = reverse("admin-orders-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)

        # 3. Assign Vendor (PATCH /api/admin/orders/{id}/assign-vendor/)
        assign_vendor_url = reverse("admin-orders-assign-vendor", args=[order.id])
        payload = {
            "items": [
                {
                    "order_item_id": order_item.id,
                    "vendor_id": self.vendor_profile.id
                }
            ]
        }
        response = self.client.patch(assign_vendor_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order_item.refresh_from_db()
        self.assertEqual(order_item.vendor, self.vendor_profile)

        # 4. Assign Rider (PATCH /api/admin/orders/{id}/assign-rider/)
        assign_rider_url = reverse("admin-orders-assign-rider", args=[order.id])
        payload = {
            "rider_id": self.rider_profile.id
        }
        response = self.client.patch(assign_rider_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.assigned_rider, self.rider_profile)

        # 5. Confirm Order (PATCH /api/admin/orders/{id}/confirm/)
        confirm_url = reverse("admin-orders-confirm", args=[order.id])
        initial_stock = self.inventory.stock_qty
        response = self.client.patch(confirm_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.order_status, OrderStatus.CONFIRMED)
        
        # Verify Stock Deduction
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_qty, initial_stock - 2)

        # Verify CouponUsage creation
        self.assertTrue(CouponUsage.objects.filter(order=order, coupon=self.coupon).exists())

        # 6. Change Status (PATCH /api/admin/orders/{id}/status/)
        status_url = reverse("admin-orders-status", args=[order.id])
        payload = {
            "status": OrderStatus.PROCESSING,
            "remarks": "Started packaging."
        }
        response = self.client.patch(status_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.order_status, OrderStatus.PROCESSING)

    def test_rider_order_flow(self):
        # 1. Create a packed order assigned to rider
        order = Order.objects.create(
            order_number="ORD-4444",
            customer=self.consumer_profile,
            address=self.address,
            address_snapshot={},
            subtotal=120,
            grand_total=120,
            payment_method="COD",
            assigned_rider=self.rider_profile,
            order_status=OrderStatus.PACKED
        )
        payment = Payment.objects.create(order=order, method="COD", amount=120)

        # Authenticate Rider
        self.client.force_authenticate(self.rider_user)

        # 2. List Rider Orders (GET /api/rider/orders/)
        url = reverse("rider-orders-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)

        # 3. Rider Updates Status to OUT_FOR_DELIVERY (PATCH /api/rider/orders/{id}/status/)
        status_url = reverse("rider-orders-status", args=[order.id])
        payload = {
            "status": OrderStatus.OUT_FOR_DELIVERY,
            "remarks": "On the way."
        }
        response = self.client.patch(status_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.order_status, OrderStatus.OUT_FOR_DELIVERY)

        # 4. Rider Updates Status to DELIVERED (marks COD payment PAID)
        payload = {
            "status": OrderStatus.DELIVERED,
            "remarks": "Delivered successfully."
        }
        response = self.client.patch(status_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.order_status, OrderStatus.DELIVERED)
        
        # Verify COD payment marked paid
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.PAID)
        self.assertEqual(order.payment_status, PaymentStatus.PAID)
