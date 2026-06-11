import api from './api'

export const userService = {
  // GET /users/myinfo — Lấy thông tin user hiện tại
  getMyInfo: () => api.get('/users/myinfo'),

  // PUT /users/myinfo — Cập nhật profile user hiện tại
  updateMyProfile: (data) => api.put('/users/myinfo', data),

  // POST /users/myinfo/change-password — Đổi mật khẩu
  changePassword: (data) => api.post('/users/myinfo/change-password', data),

  // POST /users/myinfo/avatar — Upload avatar
  uploadAvatar: (formData) => api.post('/users/myinfo/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Admin endpoints
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}
