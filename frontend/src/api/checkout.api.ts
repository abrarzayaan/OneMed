import api from './axios';

export const checkoutApi = {
  preview:       (address_id: number, coupon_code?: string) =>
    api.post('/checkout/', { address_id, coupon_code }),
  directPreview: (variant_id: number, quantity: number, address_id: number, coupon_code?: string) =>
    api.post(`/checkout/variants/${variant_id}/`, { quantity, address_id, coupon_code }),
};
