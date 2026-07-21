import api from './api'
import { clearSession } from './sessionStorage'

export const authService = {
  login: (data) => api.post('/api/v1/auth/login', data),
  register: (data) => api.post('/api/v1/auth/register', data),
  introspect: (token) => api.post('/api/v1/auth/introspect', { token }),
  forgotPassword: (email) => api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/v1/auth/reset-password', data),
  logout: clearSession,
}
