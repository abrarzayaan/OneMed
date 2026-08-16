ORDER_NUMBER_PREFIX = "ORD"

ORDER_NUMBER_LENGTH = 8

ADDRESS_SNAPSHOT_FIELDS = (
    "receiver_name",
    "receiver_phone",
    "full_address",
    "area",
    "city",
    "label",
)

PRODUCT_SNAPSHOT_FIELDS = (
    "id",
    "name",
    "sku",
    "price",
    "strength",
    "image",
)

COUPON_SNAPSHOT_FIELDS = (
    "id",
    "code",
    "discount_type",
    "discount_value",
)

from apps.orders.choices import OrderStatus
ORDER_STATUS_TRANSITIONS = {
    OrderStatus.PLACED: [
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.CANCELLED,
    ],

    OrderStatus.CONFIRMED: [
        OrderStatus.PROCESSING,
        OrderStatus.CANCELLED,
    ],

    OrderStatus.PROCESSING: [
        OrderStatus.PACKED,
        OrderStatus.CANCELLED,
    ],

    OrderStatus.PACKED: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
    ],

    OrderStatus.OUT_FOR_DELIVERY: [
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
    ],

    OrderStatus.DELIVERED: [],

    OrderStatus.CANCELLED: [],
}