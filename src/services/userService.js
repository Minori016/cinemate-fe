import api from './api'

export const userService = {
  // GET /users/myinfo — Lấy thông tin user hiện tại
  getMyInfo: () => api.get('/api/v1/users/myinfo'),

  // PUT /users/myinfo — Cập nhật profile user hiện tại
  updateMyProfile: (data) => api.put('/api/v1/users/myinfo', data),

  // POST /users/myinfo/change-password — Đổi mật khẩu
  changePassword: (data) => api.post('/api/v1/users/myinfo/change-password', data),

  // POST /users/myinfo/avatar — Upload avatar
  uploadAvatar: (formData) => api.post('/api/v1/users/myinfo/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Admin endpoints
  getAll: () => api.get('/api/v1/users'),
  getById: (id) => api.get(`/api/v1/users/${id}`),
  update: (id, data) => api.put(`/api/v1/users/${id}`, data),
  delete: (id) => api.delete(`/api/v1/users/${id}`),
}
