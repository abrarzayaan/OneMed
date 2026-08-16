from django.db import models


class OrderStatus(models.TextChoices):
    PLACED = "PLACED", "Placed"
    CONFIRMED = "CONFIRMED", "Confirmed"
    PROCESSING = "PROCESSING", "Processing"
    PACKED = "PACKED", "Packed"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out For Delivery"
    DELIVERED = "DELIVERED", "Delivered"
    CANCELLED = "CANCELLED", "Cancelled"


class PaymentMethod(models.TextChoices):
    COD = "COD", "Cash On Delivery"
    BKASH = "BKASH", "bKash"
    NAGAD = "NAGAD", "Nagad"
    SSLCOMMERZ = "SSLCOMMERZ", "SSLCommerz"
    STRIPE = "STRIPE", "Stripe"


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PAID = "PAID", "Paid"
    FAILED = "FAILED", "Failed"
    REFUNDED = "REFUNDED", "Refunded"