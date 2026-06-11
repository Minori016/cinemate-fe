import api from './api'

export const authService = {
  // Login: BE nhận UserLoginRequest (email/password)
  login: (data) => api.post('/auth/login', data),
  
  // Register: BE nhận UserRegisterRequest
  register: (data) => api.post('/auth/register', data),
  
  // Introspect: Kiểm tra token còn sống không
  introspect: (token) => api.post('/auth/introspect', { token }),
  
  // Quên mật khẩu
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset mật khẩu: BE nhận { token, newPassword, confirmPassword }
  resetPassword: (data) => api.post('/auth/reset-password', data),
  
  logout: () => { 
    localStorage.removeItem('token')
    localStorage.removeItem('user') 
  },
}