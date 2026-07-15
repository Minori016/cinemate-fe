import api from './api'

export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  
  // Real-time Booking Endpoints
  getSeatMap: (showtimeId) => api.get(`/showtimes/${showtimeId}/seats`),
  holdSeats: (data) => api.post('/bookings/hold', data),
  confirmMock: (id) => api.post(`/bookings/${id}/confirm`),
  cancelBooking: (id) => api.post(`/bookings/${id}/cancel`),
  
  getMyBookings: () => api.get('/bookings/my'),
}
