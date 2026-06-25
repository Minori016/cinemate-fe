import api from './api'

const BASE_URL = '/api/v1/admin/users'

export const employeeService = {
  // Get all employees (users with STAFF role)
  getAll: (params = {}) => api.get(BASE_URL, { params }),
  getById: (id) => api.get(`${BASE_URL}/${id}`),
  create: (data) => api.post(BASE_URL, { ...data, roles: ['STAFF'] }),
  update: (id, data) => api.put(`${BASE_URL}/${id}`, data),
  delete: (id) => api.delete(`${BASE_URL}/${id}`),
}
