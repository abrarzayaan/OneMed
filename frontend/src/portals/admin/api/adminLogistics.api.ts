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

export const adminLogisticsApi = {
  getRiders: async (): Promise<DeliveryRider[]> => {
    try {
      const res = await api.get('/admin/orders/riders/fleet/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list.map((r: any) => ({
        id: r.id || 0,
        rider_name: r.rider_name || 'Delivery Rider',
        phone_number: r.phone_number || 'N/A',
        vehicle_type: r.vehicle_type || 'Motorcycle',
        assigned_zone: r.assigned_zone || 'Central Dispatch Hub',
        status: r.status || 'OFF_DUTY',
        current_active_order_id: r.current_active_order_id,
        current_location: r.current_location || 'Central Dispatch Point',
        lat: Number(r.lat) || 23.7548,
        lng: Number(r.lng) || 90.3765,
        total_deliveries_completed: Number(r.total_deliveries_completed) || 0,
        avg_delivery_time_mins: Number(r.avg_delivery_time_mins) || 25,
        rating: typeof r.rating === 'number' ? r.rating : 4.9,
        joined_date: r.joined_date || '',
      }));
    } catch (err) {
      console.error('Failed to fetch rider fleet data:', err);
      return [];
    }
  },

  createRider: async (payload: Omit<DeliveryRider, 'id'>): Promise<DeliveryRider | null> => {
    try {
      const res = await api.post('/admin/orders/riders/fleet/', payload);
      if (res.data && res.data.id) return res.data;
    } catch (err) {
      console.error('Failed to create rider in fleet:', err);
    }
    return null;
  },

  updateRiderStatus: async (
    riderId: number,
    status: DeliveryRider['status']
  ): Promise<boolean> => {
    try {
      await api.patch(`/admin/orders/riders/fleet/${riderId}/`, { status });
      return true;
    } catch (err) {
      console.error('Failed to update rider status:', err);
      return false;
    }
  },

  deleteRider: async (riderId: number): Promise<boolean> => {
    try {
      await api.delete(`/admin/orders/riders/fleet/${riderId}/`);
      return true;
    } catch (err) {
      console.error('Failed to delete rider:', err);
      return false;
    }
  },
};
