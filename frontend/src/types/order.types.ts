export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface UserMinimal {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
}

export interface ConsumerProfileDetail {
  id: number;
  user: UserMinimal;
  date_of_birth?: string | null;
  gender?: string | null;
  profile_image?: string | null;
}

export interface VendorProfileDetail {
  id: number;
  user: UserMinimal;
  name: string;
  slug: string;
  type: string;
  phone?: string;
  email?: string;
  status: string;
  verification_status: string;
}

export interface RiderProfileDetail {
  id: number;
  user: UserMinimal;
  vehicle_type?: string;
  vehicle_number?: string;
  nid_no?: string;
  license_no?: string;
  availability_status?: string;
  verification_status?: string;
  current_latitude?: number | string | null;
  current_longitude?: number | string | null;
}

export interface OrderItemProductSnapshot {
  product_id?: number;
  variant_id?: number;
  name: string;
  sku?: string;
  price?: string;
  [key: string]: any;
}

export interface OrderItem {
  id: number;
  product_variant: number;
  vendor?: VendorProfileDetail | null;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_snapshot: OrderItemProductSnapshot;
}

export interface PaymentInfo {
  id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string | null;
  amount: string;
  paid_at?: string | null;
  created_at: string;
}

export interface OrderStatusHistoryItem {
  id: number;
  status: OrderStatus;
  changed_by?: UserMinimal | null;
  remarks?: string | null;
  created_at: string;
}

export interface AddressSnapshot {
  label?: string;
  receiver_name?: string;
  receiver_phone?: string;
  full_address: string;
  landmark?: string;
  area: string;
  city: string;
  postal_code?: string;
  latitude?: number | string;
  longitude?: number | string;
  [key: string]: any;
}

export interface CouponSnapshot {
  code: string;
  discount_type?: string;
  discount_value?: string;
  [key: string]: any;
}

export interface Order {
  id: number;
  order_number: string;
  customer: ConsumerProfileDetail;
  address?: number | null;
  address_snapshot?: AddressSnapshot | null;
  coupon?: number | null;
  coupon_snapshot?: CouponSnapshot | null;
  subtotal: string;
  discount: string;
  tax: string;
  delivery_charge: string;
  grand_total: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  assigned_rider?: RiderProfileDetail | null;
  items: OrderItem[];
  payment?: PaymentInfo | null;
  status_history: OrderStatusHistoryItem[];
  placed_at?: string | null;
  confirmed_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderTrackingRider {
  name: string;
  phone?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  current_latitude?: number | string | null;
  current_longitude?: number | string | null;
}

export interface OrderTrackingHistoryLog {
  status: OrderStatus;
  remarks?: string | null;
  created_at: string;
  changed_by?: string;
}

export interface OrderTrackingData {
  order_number: string;
  current_status: OrderStatus;
  placed_at?: string | null;
  confirmed_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  rider?: OrderTrackingRider | null;
  history: OrderTrackingHistoryLog[];
}
