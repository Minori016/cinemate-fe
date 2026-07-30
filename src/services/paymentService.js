import api from './api'

export const paymentService = {
  createMomoPayment: (bookingId) => api.post(`/api/v1/payments/momo/create/${bookingId}`),
  checkMomoPaymentStatus: (orderId) => api.get(`/api/v1/payments/momo/status?orderId=${orderId}`),
  createVnPayPayment: (bookingId) => api.post(`/api/v1/payments/momo/create/${bookingId}`),
  checkVnPayPaymentStatus: (queryParams) => api.get(`/api/v1/payments/vnpay/status${queryParams}`),
  getMyPayments: () => api.get('/api/v1/payments/momo/my'), // In backend, momo/my and vnpay/my probably return the same or should be unified, but we'll leave it as is or change to get('/api/v1/payments/my') if unified. Actually, wait. Let's just keep it simple.
}
