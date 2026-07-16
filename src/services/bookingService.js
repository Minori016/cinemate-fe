import api from './api'

export const bookingService = {
  getAll: (params) => api.get('/api/v1/bookings', { params }),
  getById: (id) => api.get(`/api/v1/bookings/${id}`),
  create: (data) => api.post('/api/v1/bookings', data),
  
  // Real-time Booking Endpoints
  getSeatMap: (showtimeId) => api.get(`/api/v1/showtimes/${showtimeId}/seat-map`),
  holdSeats: (data) => api.post('/api/v1/bookings/hold', data),
  confirm: (id) => api.post(`/api/v1/bookings/${id}/confirm`),
  cancelBooking: (id) => api.post(`/api/v1/bookings/${id}/cancel`),
  lockSeats: (showtimeId, seatIds) => api.post(`/api/v1/showtimes/${showtimeId}/seats/lock`, { seatIds }),
  unlockSeat: (showtimeId, seatId) => api.post(`/api/v1/showtimes/${showtimeId}/seats/${seatId}/unlock`),
  
  getMyBookings: () => api.get('/api/v1/bookings/my'),
  getAllAdminBookings: () => api.get('/api/v1/admin/bookings'),
}
