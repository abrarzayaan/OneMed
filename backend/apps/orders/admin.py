from django.contrib import admin

from apps.orders.models import (
    Order,
    OrderItem,
    Payment,
    OrderStatusHistory,
)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer",
        "grand_total",
        "payment_status",
        "order_status",
        "placed_at",
    )

    list_filter = (
        "order_status",
        "payment_status",
        "payment_method",
    )

    search_fields = (
        "order_number",
        "customer__email",
        "customer__phone",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "placed_at",
        "confirmed_at",
        "delivered_at",
        "cancelled_at",
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "product_variant",
        "vendor",
        "quantity",
        "unit_price",
        "total_price",
    )

    search_fields = (
        "order__order_number",
        "product_variant__sku",
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "method",
        "status",
        "amount",
        "paid_at",
    )

    list_filter = (
        "method",
        "status",
    )

    search_fields = (
        "order__order_number",
        "transaction_id",
    )


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "status",
        "changed_by",
        "created_at",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "order__order_number",
    )