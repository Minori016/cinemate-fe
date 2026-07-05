import axios from 'axios'

const api = axios.create({
  baseURL: '/',
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
  console.log('API Request:', config.method?.toUpperCase(), config.url, config.headers)
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Token hết hạn hoặc không hợp lệ: dọn session local, tránh reload vòng lặp ở trang public.
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    // Log chi tiết lỗi để debug
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    return Promise.reject(error)
  }
)

export default api
