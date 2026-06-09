import api from './api'

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user') },
}
