export type AdminRoleType = 'superuser' | 'catalog_manager' | 'order_dispatcher' | 'rx_verifier' | 'support_staff';

export interface AdminUserPermissions {
  canManageCatalog: boolean;
  canManageOrders: boolean;
  canVerifyRx: boolean;
  canManageVendors: boolean;
  canManageCMS: boolean;
  canManageRBAC: boolean;
  canAccessExplorer: boolean;
}

export interface AdminUserScope {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperuser: boolean;
  isStaff: boolean;
  role: AdminRoleType;
  roleTitle: string;
  avatarUrl?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'rx' | 'stock' | 'system';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badge?: number | string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
  permissionKey?: keyof AdminUserPermissions;
}

export interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

// ── SECTION 02: ORDER & MULTI-VENDOR ASSIGNMENT TYPES ─────────────────────────────
export type OrderStatusType =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatusType = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface AdminVendor {
  id: number;
  name: string;
  phone: string;
  address: string;
  rating: number;
  available_stock: number;
}

export interface AdminRider {
  id: number;
  name: string;
  phone: string;
  vehicle_type: 'Motorbike' | 'Bicycle' | 'Delivery Van';
  is_online: boolean;
  active_workload: number;
  rating: number;
}

export interface AdminOrderItem {
  id: number;
  product_variant_id: number;
  variant_name: string;
  product_name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  assigned_vendor_id: number | null;
  assigned_vendor_name: string | null;
  available_vendors: AdminVendor[];
}

export interface AdminOrder {
  id: number;
  order_number: string;
  order_status: OrderStatusType;
  payment_status: PaymentStatusType;
  payment_method: string;
  subtotal_amount: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  items: AdminOrderItem[];
  assigned_rider: AdminRider | null;
  requires_prescription: boolean;
  prescription_approved?: boolean;
  created_at: string;
  updated_at: string;
  remarks?: string;
}

export interface VendorAssignmentPayload {
  items: {
    order_item_id: number;
    vendor_id: number;
  }[];
}

export interface RiderAssignmentPayload {
  rider_id: number;
}

export interface OrderStatusUpdatePayload {
  status: OrderStatusType;
  remarks?: string;
}

// ── SECTION 03: PRODUCT VARIANT DYNAMIC PRICING TYPES ─────────────────────────────
export interface VariantMetaFlags {
  pack_size?: string;
  dimensions?: { length?: number; width?: number; height?: number; unit?: string } | Record<string, any>;
  is_hot_deal?: boolean;
  is_best_selling?: boolean;
  is_top_rated?: boolean;
  is_featured?: boolean;
  is_quick_access?: boolean;
  is_flash_sale?: boolean;
  is_genuine?: boolean;
  [key: string]: any;
}

export interface AdminVariantItem {
  id: number;
  sku: string;
  barcode?: string;
  product_id: number;
  product_name: string;
  variant_name: string;
  category_name: string;
  brand_name?: string;
  price: number;
  sale_price: number | null;
  cost_price?: number | null;
  min_order_qty: number;
  max_order_qty?: number | null;
  status: 'active' | 'hidden';
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number; unit?: string } | any;
  short_description?: any;
  long_description?: any;
  meta: VariantMetaFlags;
  image_url?: string;
  created_at?: string;
}

export interface BulkDiscountRulePayload {
  variant_ids: number[];
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  is_hot_deal?: boolean;
  is_featured?: boolean;
}
