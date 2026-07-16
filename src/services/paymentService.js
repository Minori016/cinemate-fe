import api from './api'

export const paymentService = {
  createMomoPayment: (bookingId) => api.post(`/api/v1/payments/momo/create/${bookingId}`),
  checkMomoPaymentStatus: (orderId) => api.get(`/api/v1/payments/momo/status?orderId=${orderId}`),
  getMyPayments: () => api.get('/api/v1/payments/momo/my'),
}
