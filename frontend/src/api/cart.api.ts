import api from './axios';
import type { Cart } from '@/types/cart.types';

export const cartApi = {
  getCart: () =>
    api.get<Cart>('/cart/'),

  addItem: (variant_id: number, quantity: number) =>
    api.post<Cart>('/cart/items/', { product_variant_id: variant_id, quantity }),

  updateItem: (variant_id: number, quantity: number) =>
    api.patch<Cart>(`/cart/items/${variant_id}/`, { quantity }),

  removeItem: (variant_id: number) =>
    api.delete<Cart>(`/cart/items/${variant_id}/`),

  clearCart: () =>
    api.delete<{ message: string }>('/cart/clear/'),
};
