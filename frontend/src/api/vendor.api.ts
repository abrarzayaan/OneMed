import api from './axios';

export interface VendorRegistrationPayload {
  username: string;
  email: string;
  password: string;
  pharmacy_name: string;
  slug?: string;
  type?: 'pharmacy' | 'grocery' | 'mart' | 'health_store' | 'cosmetics';
  phone?: string;
  trade_license_no?: string;
  city?: string;
  area?: string;
  full_address?: string;
}

export interface VendorProfileUpdatePayload {
  name?: string;
  phone?: string;
  email?: string;
  logo?: string;
  cover_image?: string;
  trade_license_no?: string;
  tax_number?: string;
  type?: string;
  address?: {
    full_address: string;
    area: string;
    city: string;
  };
}

export interface VendorProfile {
  id: number;
  name: string;
  slug: string;
  type: string;
  phone: string;
  email: string;
  logo?: string;
  cover_image?: string;
  status: 'active' | 'inactive' | 'paused' | 'blocked';
  verification_status: 'pending' | 'verified' | 'rejected';
  commission_rate: number;
  trade_license_no: string;
  tax_number?: string;
  address?: {
    full_address: string;
    area: string;
    city: string;
  };
  metadata?: Record<string, any>;
  is_profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VendorInventoryItem {
  id: number;
  vendor_id: number;
  variant_id: number;
  product_name: string;
  variant_sku: string;
  variant_name: string;
  product_image?: string;
  unit_price: number;
  stock_qty: number;
  reserved_qty: number;
  damaged_qty: number;
  available_stock: number;
  reorder_level: number;
  batch_number?: string;
  expiry_date?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updated_at: string;
}

export interface VendorDispatchedItem {
  order_item_id: number;
  order_id: number;
  order_number: string;
  product_name: string;
  variant_name: string;
  variant_sku: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_status: 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  assigned_at: string;
  customer_area: string;
}

export interface VendorDashboardSummary {
  items_dispatched_today: number;
  total_items_dispatched: number;
  todays_sales_bdt: number;
  total_sales_bdt: number;
  low_stock_alerts_count: number;
  total_inventory_items: number;
}

export interface ProductVariantOption {
  id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  price: number;
  sale_price?: number | null;
}

// ── API Functions ──────────────────────────────

export const vendorApi = {
  // 1. Vendor Public Registration
  register: async (payload: VendorRegistrationPayload) => {
    const res = await api.post('/vendor/register/', payload);
    return res.data;
  },

  // 2. Logged-in Vendor Profile
  getProfile: async (): Promise<VendorProfile> => {
    const res = await api.get('/vendor/profile/');
    return res.data;
  },

  // 3. Update Vendor Profile
  updateProfile: async (payload: VendorProfileUpdatePayload): Promise<VendorProfile> => {
    const res = await api.patch('/vendor/profile/', payload);
    return res.data;
  },

  // 4. Analytics Summary
  getAnalyticsSummary: async (): Promise<VendorDashboardSummary> => {
    const res = await api.get('/vendor/analytics/summary/');
    return res.data;
  },

  // 5. Dispatched / Allocated Items
  getDispatches: async (filter?: string): Promise<VendorDispatchedItem[]> => {
    const res = await api.get('/vendor/dispatches/', {
      params: filter ? { filter } : {},
    });
    return res.data;
  },

  // 6. Inventory Stock List
  getInventory: async (): Promise<VendorInventoryItem[]> => {
    const res = await api.get('/vendor/inventory/');
    return res.data;
  },

  // 7. Update Existing Inventory Stock
  updateStock: async (inventoryId: number, payload: Partial<VendorInventoryItem>): Promise<{ message: string; inventory: VendorInventoryItem }> => {
    const res = await api.patch(`/vendor/inventory/${inventoryId}/`, payload);
    return res.data;
  },

  // 8. Get Product Variants for Stock Addition
  getVariants: async (): Promise<ProductVariantOption[]> => {
    const res = await api.get('/vendor/variants/');
    return res.data;
  },

  // 9. Add or Update Inventory Stock by Variant
  addStock: async (payload: { variant_id: number; stock_qty: number; reorder_level?: number }): Promise<{ message: string; inventory: VendorInventoryItem }> => {
    const res = await api.post('/vendor/inventory/', payload);
    return res.data;
  },
};
