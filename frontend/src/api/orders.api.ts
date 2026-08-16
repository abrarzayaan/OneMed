import api from './axios';
import type { Order, OrderTrackingData } from '@/types/order.types';
import type { PaginatedResponse } from '@/types/product.types';

export interface PlaceOrderPayload {
  address_id: number;
  payment_method: 'COD';
  coupon_code?: string;
  notes?: string;
}

export const ordersApi = {
  placeOrder: (data: PlaceOrderPayload) =>
    api.post<Order>('/orders/', data),

  getOrders: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<Order> | Order[]>('/orders/', { params }),

  getOrder: (id: number | string) =>
    api.get<Order>(`/orders/${id}/`),

  cancelOrder: (id: number | string) =>
    api.patch<Order>(`/orders/${id}/cancel/`),

  trackOrder: (id: number | string) =>
    api.get<OrderTrackingData>(`/orders/${id}/tracking/`),

  buyNow: (data: object) =>
    api.post<Order>('/orders/buy-now/', data),
};
