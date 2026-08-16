import api from '@/api/axios';

export interface AdminVendorItem {
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
  owner_username: string;
  address?: {
    city: string;
    area: string;
    full_address: string;
  } | null;
  is_profile_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export const adminVendorVerificationApi = {
  getVendors: async (params?: {
    verification_status?: string;
    status?: string;
    search?: string;
  }): Promise<AdminVendorItem[]> => {
    try {
      const res = await api.get('/profiles/admin/vendors/', { params });
      return res.data;
    } catch (err) {
      const fallbackRes = await api.get('/admin-vendors/', { params });
      return fallbackRes.data;
    }
  },

  updateVendorStatus: async (
    id: number,
    payload: {
      status?: 'active' | 'inactive' | 'paused' | 'blocked';
      verification_status?: 'pending' | 'verified' | 'rejected';
      commission_rate?: number;
    }
  ): Promise<{ message: string; vendor: Partial<AdminVendorItem> }> => {
    try {
      const res = await api.patch(`/profiles/admin/vendors/${id}/`, payload);
      return res.data;
    } catch (err) {
      const fallbackRes = await api.patch(`/admin-vendors/${id}/`, payload);
      return fallbackRes.data;
    }
  },
};
