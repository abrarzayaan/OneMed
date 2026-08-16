import api from './axios';

export const profileApi = {
  getConsumerProfile: () => api.get('/profiles/consumer/update/'),
  updateConsumerProfile: (data: FormData) =>
    api.patch('/profiles/consumer/update/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAddresses:    ()               => api.get('/profiles/addresses/'),
  createAddress:   (data: object)   => api.post('/profiles/addresses/', data),
  updateAddress:   (id: number, data: object) => api.patch(`/profiles/addresses/${id}/`, data),
  deleteAddress:   (id: number)     => api.delete(`/profiles/addresses/${id}/`),
};
