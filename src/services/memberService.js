import api from './api'

const BASE_URL = '/api/v1/admin/users'

export const memberService = {
  getAll: (params) => api.get(BASE_URL, { params }),
  getById: (id) => api.get(`${BASE_URL}/${id}`),
  create: (data) => api.post(BASE_URL, data),
  update: (id, data) => api.put(`${BASE_URL}/${id}`, data),
  updateStatus: (id, status) => api.put(`/api/v1/admin/users/${id}/status`, null, { params: { status } }),
  delete: (id) => api.delete(`${BASE_URL}/${id}`),
  register: (data) => api.post('/api/v1/auth/register', data),
}
