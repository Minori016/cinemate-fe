import api from './api'

export const authService = {
  // Login: BE nhận UserLoginRequest (email/password)
  login: (data) => api.post('/api/v1/auth/login', data),
  
  // Register: BE nhận UserRegisterRequest
  register: (data) => api.post('/api/v1/auth/register', data),
  
  // Introspect: Kiểm tra token còn sống không
  introspect: (token) => api.post('/api/v1/auth/introspect', { token }),
  
  // Quên mật khẩu
  forgotPassword: (email) => api.post('/api/v1/auth/forgot-password', { email }),
  
  // Reset mật khẩu: BE nhận { token, newPassword, confirmPassword }
  resetPassword: (data) => api.post('/api/v1/auth/reset-password', data),
  
  logout: () => { 
    localStorage.removeItem('token')
    localStorage.removeItem('user') 
  },
}