import api from './api'

export const concessionService = {
  getAll: (params) => api.get('/api/v1/concessions', { params }),
  getById: (id) => api.get(`/api/v1/concessions/${id}`),
  create: (data) => api.post('/api/v1/admin/concessions', data),
  update: (id, data) => api.put(`/api/v1/admin/concessions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/concessions/${id}`),
  toggleActive: (id) => api.patch(`/api/v1/admin/concessions/${id}/toggle`),
  getActive: () => api.get('/api/v1/concessions/active')
}

/** Khớp với item_type trong DB (food / drink / combo) */
export const CONCESSION_ITEM_TYPES = {
  food: 'Đồ ăn',
  drink: 'Đồ uống',
  combo: 'Combo bắp nước'
}

export const ITEM_TYPE_EMOJIS = {
  food: '🍿',
  drink: '🥤',
  combo: '🎒'
}
