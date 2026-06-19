import api from './api'

export const promotionService = {
  getAll: (params) => api.get('/api/v1/promotions', { params }),
  getById: (id) => api.get(`/api/v1/promotions/${id}`),
  create: (data) => api.post('/api/v1/admin/promotions', data),
  update: (id, data) => api.put(`/api/v1/admin/promotions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/promotions/${id}`),
}
