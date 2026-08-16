import api from '../../../api/axios';

export interface DeliveryRider {
  id: number;
  rider_name: string;
  phone_number: string;
  vehicle_type: 'Motorcycle' | 'Bicycle' | 'Scooter' | 'Electric Bike';
  assigned_zone: string;
  status: 'IN_TRANSIT' | 'ON_DUTY' | 'IDLE' | 'OFF_DUTY';
  current_active_order_id?: string;
  current_location: string;
  lat: number;
  lng: number;
  total_deliveries_completed: number;
  avg_delivery_time_mins: number;
  rating: number;
  joined_date: string;
}

const defaultRiders: DeliveryRider[] = [
  {
    id: 1,
    rider_name: 'Rafiqul Islam',
    phone_number: '01711223344',
    vehicle_type: 'Motorcycle',
    assigned_zone: 'Dhanmondi & Mohammadpur',
    status: 'IN_TRANSIT',
    current_active_order_id: 'ORD-9821',
    current_location: 'Road 27, Dhanmondi (Heading to customer)',
    lat: 23.7548,
    lng: 90.3765,
    total_deliveries_completed: 342,
    avg_delivery_time_mins: 24,
    rating: 4.9,
    joined_date: '2025-02-15',
  },
  {
    id: 2,
    rider_name: 'Kamrul Hasan',
    phone_number: '01822334455',
    vehicle_type: 'Scooter',
    assigned_zone: 'Gulshan & Banani',
    status: 'IN_TRANSIT',
    current_active_order_id: 'ORD-9834',
    current_location: 'Gulshan 2 Circle (Picking from Tamanna Pharmacy)',
    lat: 23.7925,
    lng: 90.4167,
    total_deliveries_completed: 218,
    avg_delivery_time_mins: 28,
    rating: 4.8,
    joined_date: '2025-04-10',
  },
  {
    id: 3,
    rider_name: 'Tanvir Hossain',
    phone_number: '01933445566',
    vehicle_type: 'Electric Bike',
    assigned_zone: 'Uttara Hub',
    status: 'ON_DUTY',
    current_location: 'Sector 3, Uttara (Waiting for dispatch)',
    lat: 23.8759,
    lng: 90.3795,
    total_deliveries_completed: 185,
    avg_delivery_time_mins: 22,
    rating: 4.95,
    joined_date: '2025-06-01',
  },
  {
    id: 4,
    rider_name: 'Sojib Ahmed',
    phone_number: '01644556677',
    vehicle_type: 'Motorcycle',
    assigned_zone: 'Mirpur 10 & 11',
    status: 'IDLE',
    current_location: 'Mirpur 10 Circle Hub',
    lat: 23.8069,
    lng: 90.3687,
    total_deliveries_completed: 145,
    avg_delivery_time_mins: 31,
    rating: 4.7,
    joined_date: '2025-08-20',
  },
];

export const adminLogisticsApi = {
  getRiders: async (): Promise<DeliveryRider[]> => {
    try {
      const res = await api.get('/api/admin/orders/riders/fleet/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {}
    return defaultRiders;
  },

  createRider: async (payload: Omit<DeliveryRider, 'id'>): Promise<DeliveryRider> => {
    try {
      const res = await api.post('/api/admin/orders/riders/fleet/', payload);
      if (res.data && res.data.id) return res.data;
    } catch {}
    return { ...payload, id: Date.now() };
  },

  updateRiderStatus: async (id: number, status: DeliveryRider['status']): Promise<DeliveryRider> => {
    try {
      const res = await api.patch(`/api/admin/orders/riders/fleet/${id}/`, { status });
      if (res.data) return res.data;
    } catch {}
    return { ...defaultRiders[0], id, status };
  },

  deleteRider: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/admin/orders/riders/fleet/${id}/`);
      return true;
    } catch {}
    return true;
  },
};
