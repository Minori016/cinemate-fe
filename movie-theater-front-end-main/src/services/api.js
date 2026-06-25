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
  
  // Debug log
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} | isPublic: ${isPublic} | hasToken: ${!!token}`)
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Log error for debugging
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${error.response?.status} | Message: ${error.response?.data?.message}`)
    
    // Token hết hạn hoặc không hợp lệ: dọn session local, tránh reload vòng lặp ở trang public.
    // Chỉ xóa token khi ở trang login/register (không phải admin page)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      // Không xóa token ở trang admin
      if (currentPath.includes('/admin')) {
        console.warn('401 error on admin page - token may be invalid or expired')
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    return Promise.reject(error)
  }
)

export default api
