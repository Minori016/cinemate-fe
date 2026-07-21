import axios from 'axios'
import { clearSession, getAccessToken, isActiveToken } from './sessionStorage'

function normalizeBaseUrl(value) {
  const baseUrl = String(value || '').trim()
  if (!baseUrl) return '/'
  return baseUrl.replace(/\/+$/, '') || '/'
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

const PUBLIC_URLS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/introspect',
  '/api/v1/payments/momo/status',
]

const PUBLIC_GET_PREFIXES = [
  '/api/v1/cinema-rooms',
  '/api/v1/movies',
  '/api/v1/showtimes',
  '/api/v1/genres',
  '/api/v1/countries',
  '/api/v1/promotions',
]

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  const url = config.url || ''
  const isAuthPublic = PUBLIC_URLS.some((publicUrl) => url.includes(publicUrl))
  const isGetPublic = config.method?.toLowerCase() === 'get' && PUBLIC_GET_PREFIXES.some((prefix) => url.includes(prefix))

  if (token && !isAuthPublic && !isGetPublic) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const PROTECTED_PATH_PREFIXES = [
  '/admin',
  '/staff',
  '/manager',
  '/profile',
  '/booking',
  '/checkout',
  '/first-login',
]

function isProtectedPath(pathname) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authorization = error.config?.headers?.Authorization || error.config?.headers?.authorization
      const requestToken = typeof authorization === 'string' && authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : null

      if (requestToken && isActiveToken(requestToken)) {
        clearSession()
        const path = window.location.pathname
        if (isProtectedPath(path) && path !== '/login') {
          window.location.href = '/login'
        }
      }
    }

    if (import.meta.env.DEV) {
      console.error('API request failed:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      })
    }
    return Promise.reject(error)
  }
)

export default api
