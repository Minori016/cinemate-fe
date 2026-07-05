import api from './api'

const mapShowtimeFromBackend = (backendData, requestData = {}) => {
  try {
    const startTimeStr = backendData.startTime || ''
    let date = ''
    let time = ''
    if (startTimeStr) {
      const d = new Date(startTimeStr)
      if (!isNaN(d.getTime())) {
        date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
        time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      } else {
        date = startTimeStr.split('T')[0]
        time = startTimeStr.split('T')[1]?.substring(0, 5) || ''
      }
    } else if (requestData.date && requestData.time) {
      date = requestData.date
      time = requestData.time
    }

    return {
      id: backendData.id,
      movieId: backendData.movieId || backendData.movie?.id || requestData.movieId,
      movie: backendData.movieTitle || backendData.movie?.titleVn || 'Unknown Movie',
      roomId: backendData.roomId || backendData.room?.id || requestData.roomId,
      room: backendData.roomName || backendData.room?.name || 'Unknown Room',
      roomName: backendData.roomName || backendData.room?.name || 'Unknown Room',
      cinemaId: backendData.cinemaId || backendData.room?.cinemaId || requestData.cinemaId,
      cinemaName: backendData.cinemaName || backendData.room?.cinemaName || '',
      date: date,
      time: time,
      startTime: backendData.startTime || '',
      price: backendData.basePrice || requestData.basePrice || requestData.price || 90000,
      vipPrice: backendData.vipPrice || requestData.vipPrice || 90000,
      couplePrice: backendData.couplePrice || requestData.couplePrice || 90000,
      format: backendData.format || requestData.format || '2D',
      language: backendData.language || requestData.language || 'Phu de',
      status: backendData.status || 'SCHEDULED',
    }
  } catch (err) {
    return backendData
  }
}

export const showtimeService = {
  // GET /api/v1/admin/showtimes
  // Accepts optional filter params for client-side filtering:
  // { date, cinemaId, roomId }
  getAll: async (filterParams = {}) => {
    const res = await api.get('/api/v1/admin/showtimes')
    let list = res.data?.result || res.data || []
    if (!Array.isArray(list)) list = []

    // Client-side filter
    if (filterParams.date || filterParams.cinemaId || filterParams.roomId) {
      list = list.filter(st => {
        // Filter by date
        if (filterParams.date && st.startTime) {
          const stDate = st.startTime.split('T')[0]
          if (stDate !== filterParams.date) return false
        }
        // Filter by roomId
        if (filterParams.roomId) {
          const rid = String(st.roomId || st.room?.id || '')
          if (rid !== String(filterParams.roomId)) return false
        }
        // Filter by cinemaId
        if (filterParams.cinemaId && !filterParams.roomId) {
          const cid = String(st.cinemaId || st.room?.cinemaId || st.cinema?.id || '')
          if (cid !== String(filterParams.cinemaId)) return false
        }
        return true
      })
    }

    return list.map(item => mapShowtimeFromBackend(item))
  },

  // GET /api/v1/admin/showtimes/{id}
  getById: async (id) => {
    const res = await api.get(`/api/v1/admin/showtimes/${id}`)
    return mapShowtimeFromBackend(res.data?.result || res.data)
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
        return {
          valid: false,
          hardErrors: err.response.data.message ? [err.response.data.message] : ['Du lieu khong hop le']
        }
      }
      throw err
    }
  },

  // POST /api/v1/admin/showtimes/auto-generate/preview
  autoGenerate: async (requestData) => {
    const res = await api.post('/api/v1/admin/showtimes/auto-generate/preview', requestData)
    return res.data?.result || res.data
  },

  // POST /api/v1/admin/showtimes/auto-generate/save
  autoConfirm: async (confirmData) => {
    const res = await api.post('/api/v1/admin/showtimes/auto-generate/save', confirmData)
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

  // GET /api/v1/showtimes/by-movie?movieId=...&date=...
  getByMovie: async (movieId, date) => {
    const res = await api.get('/api/v1/showtimes/by-movie', { params: { movieId, date } })
    const list = res.data?.result || res.data || []
    return Array.isArray(list) ? list.map(item => mapShowtimeFromBackend(item)) : []
  },

  // DELETE /api/v1/admin/showtimes/{id}
  delete: async (id) => {
    await api.delete(`/api/v1/admin/showtimes/${id}`)
    return true
  },

  // GET /api/v1/admin/showtimes/export
  exportExcel: async (startDate, endDate) => {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const res = await api.get('/api/v1/admin/showtimes/export', { params, responseType: 'blob' })
    return res.data
  },

  // POST /api/v1/admin/showtimes/import/preview
  importExcel: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/api/v1/admin/showtimes/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  }
}
