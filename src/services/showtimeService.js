import api from './api'

const STORAGE_KEY = 'manager_showtimes_db'

const INITIAL_SHOWTIMES = [
  { id: 101, movie: 'Dune: Hành Tinh Cát - Phần 2', room: 'Phòng chiếu 3 (IMAX)', date: '2026-06-18', time: '18:30', price: 120000 },
  { id: 102, movie: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc', room: 'Phòng chiếu 2 (3D)', date: '2026-06-18', time: '17:00', price: 90000 },
  { id: 103, movie: 'Lật Mặt 7: Một Điều Ước', room: 'Phòng chiếu 1 (Standard)', date: '2026-06-18', time: '20:15', price: 110000 }
]

export const showtimeService = {
  // GET /api/v1/admin/showtimes (hoặc /api/v1/showtimes công khai)
  getAll: async () => {
    try {
      const res = await api.get('/api/v1/admin/showtimes')
      return res.data?.result || res.data
    } catch (err) {
      console.warn('Backend API offline hoặc chưa có API lịch chiếu. Dùng dữ liệu đệm localStorage.')
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        return JSON.parse(local)
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHOWTIMES))
        return INITIAL_SHOWTIMES
      }
    }
  },

  // GET /api/v1/admin/showtimes/{id}
  getById: async (id) => {
    try {
      const res = await api.get(`/api/v1/admin/showtimes/${id}`)
      return res.data?.result || res.data
    } catch (err) {
      console.warn('Backend API offline or getById not supported. Using localStorage fallback.')
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        const list = JSON.parse(local)
        return list.find(s => s.id === id || String(s.id) === String(id))
      }
      return null
    }
  },

  // POST /api/v1/admin/showtimes
  create: async (showtimeData) => {
    try {
      const res = await api.post('/api/v1/admin/showtimes', showtimeData)
      // Cập nhật lại localStorage nếu thành công (để đồng bộ)
      const local = localStorage.getItem(STORAGE_KEY)
      const list = local ? JSON.parse(local) : INITIAL_SHOWTIMES
      const newList = [res.data?.result || res.data, ...list]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList))
      return res.data?.result || res.data
    } catch (err) {
      console.warn('Backend API offline hoặc chưa hỗ trợ POST. Cập nhật offline vào localStorage.')
      const local = localStorage.getItem(STORAGE_KEY)
      const list = local ? JSON.parse(local) : INITIAL_SHOWTIMES
      const newShow = {
        id: Date.now(),
        ...showtimeData
      }
      const newList = [newShow, ...list]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList))
      return newShow
    }
  },

  // DELETE /api/v1/admin/showtimes/{id}
  delete: async (id) => {
    try {
      await api.delete(`/api/v1/admin/showtimes/${id}`)
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        const list = JSON.parse(local)
        const filtered = list.filter(item => item.id !== id && String(item.id) !== String(id))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      }
      return true
    } catch (err) {
      console.warn('Backend API offline hoặc chưa hỗ trợ DELETE. Cập nhật offline vào localStorage.')
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        const list = JSON.parse(local)
        const filtered = list.filter(item => item.id !== id && String(item.id) !== String(id))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      }
      return true
    }
  }
}
