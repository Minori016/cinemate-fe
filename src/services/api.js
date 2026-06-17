import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 10000,
})

// Danh sách các URL không cần đính kèm token
const PUBLIC_URLS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/introspect'
];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  // Chỉ gắn token nếu không phải là các URL public
  const isPublic = PUBLIC_URLS.some(url => config.url.includes(url));

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Token hết hạn hoặc không hợp lệ: dọn session local, tránh reload vòng lặp ở trang public.
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default api
