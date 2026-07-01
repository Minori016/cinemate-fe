import api from './api'

const BASE_URL = '/api/v1/admin/employees'

export const employeeService = {
  // Get all employees (users with STAFF/MANAGER role)
  getAll: (params = {}) => api.get(BASE_URL, { params }),
  getById: (id) => api.get(`${BASE_URL}/${id}`),
  create: (data) => api.post(BASE_URL, data),
  update: (id, data) => api.put(`${BASE_URL}/${id}`, data),
  // Cập nhật nhanh trạng thái qua PATCH /{id}/status — đồng bộ với gitlab main.
  // status: ACTIVE | LOCKED | INACTIVE
  updateStatus: (id, status) => api.patch(`${BASE_URL}/${id}/status`, null, { params: { status } }),
  delete: (id) => api.delete(`${BASE_URL}/${id}`),
}
