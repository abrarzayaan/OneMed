import api from '@/api/axios';

export interface AdminRiderItem {
  id: number;
  rider_name: string;
  phone_number: string;
  email: string;
  vehicle_type: string;
  vehicle_number: string;
  nid_no: string;
  license_no: string;
  availability_status: 'online' | 'offline' | 'busy';
  verification_status: 'pending' | 'verified' | 'rejected';
  joined_date?: string;
}

export const adminRiderVerificationApi = {
  getRiders: async (params?: {
    verification_status?: string;
    search?: string;
  }): Promise<AdminRiderItem[]> => {
    try {
      const res = await api.get('/profiles/admin/riders/', { params });
      return res.data;
    } catch {
      const fallbackRes = await api.get('/admin-riders/', { params });
      return fallbackRes.data;
    }
  },

  updateRiderVerification: async (
    id: number,
    payload: {
      verification_status?: 'pending' | 'verified' | 'rejected';
      availability_status?: 'online' | 'offline' | 'busy';
    }
  ): Promise<{ message: string; rider: Partial<AdminRiderItem> }> => {
    try {
      const res = await api.patch(`/profiles/admin/riders/${id}/`, payload);
      return res.data;
    } catch {
      const fallbackRes = await api.patch(`/admin-riders/${id}/`, payload);
      return fallbackRes.data;
    }
  },
};
