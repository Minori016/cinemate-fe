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
  checkIn: (id) => api.post(`/api/v1/bookings/${id}/checkin`),
  lockSeats: (showtimeId, seatIds) => api.post(`/api/v1/showtimes/${showtimeId}/seats/lock`, { seatIds }),
  unlockSeat: (showtimeId, seatId) => api.post(`/api/v1/showtimes/${showtimeId}/seats/${seatId}/unlock`),
  clearMyLocks: (showtimeId) => api.delete(`/api/v1/showtimes/${showtimeId}/seats/my-locks`),
  
  // Tra cứu thông tin hội viên / khách hàng
  // Sửa customer -> customers cho trùng với BookingController.java
lookupCustomer: (query) => api.get('/api/v1/bookings/customers/lookup', { params: { query } }),

  getMyBookings: () => api.get('/api/v1/bookings/my'),
  getAllAdminBookings: () => api.get('/api/v1/admin/bookings'),
}