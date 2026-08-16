import api from './axios';

export type VehicleType = 'bike' | 'cycle' | 'car';
export type AvailabilityStatus = 'online' | 'offline' | 'busy';

export interface RiderProfile {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  vehicle_type: VehicleType;
  vehicle_number?: string;
  nid_no?: string;
  license_no?: string;
  availability_status: AvailabilityStatus;
  verification_status: string;
  current_latitude?: number | null;
  current_longitude?: number | null;
  is_profile_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RiderProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  vehicle_type?: VehicleType;
  vehicle_number?: string;
  nid_no?: string;
  license_no?: string;
  availability_status?: AvailabilityStatus;
}

export interface RiderOrderItem {
  id: number;
  product_variant: number;
  vendor?: {
    id: number;
    name: string;
    type: string;
    phone: string;
    email: string;
    address?: {
      full_address: string;
      area: string;
      city: string;
    };
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: {
    name?: string;
    sku?: string;
    image?: string;
  };
}

export interface RiderOrder {
  id: number;
  order_number: string;
  customer?: {
    user?: {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      email?: string;
    };
  };
  address_snapshot?: {
    receiver_name?: string;
    receiver_phone?: string;
    full_address?: string;
    area?: string;
    city?: string;
    landmark?: string;
  };
  subtotal: number;
  delivery_charge: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  order_status: 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  items?: RiderOrderItem[];
  placed_at: string;
  confirmed_at?: string;
  delivered_at?: string;
  status_history?: Array<{
    id: number;
    status: string;
    remarks?: string;
    created_at: string;
  }>;
}

export interface RiderDashboardSummary {
  today_completed_deliveries: number;
  today_earnings_bdt: number;
  total_completed_deliveries: number;
  assigned_orders_count: number;
  availability_status: AvailabilityStatus;
  is_profile_complete: boolean;
  active_order: RiderOrder | null;
}

export const riderApi = {
  // 1. Get Rider Profile
  getProfile: async (): Promise<RiderProfile> => {
    const res = await api.get('/profiles/rider/update/');
    return res.data;
  },

  // 2. Update Rider Profile
  updateProfile: async (payload: RiderProfileUpdatePayload): Promise<RiderProfile> => {
    const res = await api.patch('/profiles/rider/update/', payload);
    return res.data;
  },

  // 3. Toggle Availability Status
  updateAvailability: async (status: AvailabilityStatus): Promise<{ status: AvailabilityStatus }> => {
    const res = await api.patch('/profiles/rider/availability/', { availability_status: status });
    return res.data;
  },

  // 4. Get Rider Dashboard Summary
  getDashboard: async (): Promise<RiderDashboardSummary> => {
    const res = await api.get('/orders/rider/dashboard/');
    return res.data;
  },

  // 5. Get Assigned Orders List
  getAssignedOrders: async (): Promise<RiderOrder[]> => {
    const res = await api.get('/orders/rider/');
    return res.data.results || res.data;
  },

  // 6. Get Order Details
  getOrderDetails: async (id: number): Promise<RiderOrder> => {
    const res = await api.get(`/orders/rider/${id}/`);
    return res.data;
  },

  // 7. Update Order Delivery Status
  updateOrderStatus: async (id: number, status: string, remarks?: string): Promise<RiderOrder> => {
    const res = await api.patch(`/orders/rider/${id}/status/`, { status, remarks });
    return res.data;
  },
};
