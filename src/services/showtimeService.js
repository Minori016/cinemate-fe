import api from './api'

const mapShowtimeFromBackend = (backendData, requestData = {}) => {
  try {
    const startTimeStr = backendData.startTime || '';
    let date = '';
    let time = '';
    if (startTimeStr) {
      date = startTimeStr.split('T')[0];
      time = startTimeStr.split('T')[1]?.substring(0, 5) || '';
    } else if (requestData.date && requestData.time) {
       date = requestData.date;
       time = requestData.time;
    }
    
    return {
      id: backendData.id,
      movieId: backendData.movieId || backendData.movie?.id || requestData.movieId,
      movie: backendData.movieTitle || backendData.movie?.titleVn || 'Unknown Movie',
      roomId: backendData.roomId || backendData.room?.id || requestData.roomId,
      room: backendData.roomName || backendData.room?.name || 'Unknown Room',
      date: date,
      time: time,
      price: backendData.basePrice || requestData.basePrice || requestData.price || 90000,
      format: backendData.format || requestData.format || '2D',
      language: backendData.language || requestData.language || 'Phụ đề'
    }
  } catch (err) {
    return backendData;
  }
}

export const showtimeService = {
  // GET /api/v1/admin/showtimes (hoặc /api/v1/showtimes công khai)
  getAll: async () => {
    const res = await api.get('/api/v1/admin/showtimes')
    const list = res.data?.result || res.data || []
    return Array.isArray(list) ? list.map(item => mapShowtimeFromBackend(item)) : []
  },

  // GET /api/v1/admin/showtimes/{id}
  getById: async (id) => {
    const res = await api.get(`/api/v1/admin/showtimes/${id}`)
    return res.data?.result || res.data
  },

  // POST /api/v1/admin/showtimes
  create: async (showtimeData) => {
    const res = await api.post('/api/v1/admin/showtimes', showtimeData)
    const backendShowtime = res.data?.result || res.data
    return mapShowtimeFromBackend(backendShowtime, showtimeData)
  },

  // POST /api/v1/admin/showtimes/validate
  validateManual: async (showtimeData) => {
    try {
      const res = await api.post('/api/v1/admin/showtimes/validate', showtimeData)
      return res.data
    } catch (err) {
      if (err.response && err.response.status === 400) {
        // Validation errors returned as 400
        return {
          valid: false,
          hardErrors: err.response.data.message ? [err.response.data.message] : ['Dữ liệu không hợp lệ']
        }
      }
      throw err
    }
  },

  // POST /api/v1/admin/showtimes/auto-generate
  autoGenerate: async (requestData) => {
    const res = await api.post('/api/v1/admin/showtimes/auto-generate', requestData)
    return res.data
  },

  // POST /api/v1/admin/showtimes/batch
  batchCreate: async (showtimes) => {
    const res = await api.post('/api/v1/admin/showtimes/batch', showtimes)
    const savedItems = res.data?.result || res.data
    
    if (Array.isArray(savedItems)) {
      return savedItems.map(item => mapShowtimeFromBackend(item))
    }
    return savedItems
  },

  // DELETE /api/v1/admin/showtimes/{id}
  delete: async (id) => {
    await api.delete(`/api/v1/admin/showtimes/${id}`)
    return true
  }
}
