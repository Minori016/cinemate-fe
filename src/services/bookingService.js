import api from './api'

export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  confirm: (id) => api.put(`/bookings/${id}/confirm`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  getMyBookings: () => api.get('/bookings/my'),
}
