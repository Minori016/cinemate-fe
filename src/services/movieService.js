import api from './api'

const getDerivedStatus = (data) => {
  if (data?.status && data.status !== 'null' && data.status !== 'undefined') {
    return data.status
  }
  const todayStr = new Date().toISOString().split('T')[0]
  const fromDate = data?.fromDate || ''
  const toDate = data?.toDate || ''

  if (fromDate && fromDate > todayStr) {
    return 'COMING_SOON'
  }
  if (toDate && toDate < todayStr) {
    return 'ENDED'
  }
  return 'NOW_SHOWING'
}

const mapMovieFromBackend = (data) => {
  if (!data) return null
  // Find poster from media
  const poster = data.media?.find(m => m.mediaType === 'POSTER')?.url || data.posterUrl || ''
  // Find trailer from media
  const trailer = data.trailerUrl || data.media?.find(m => m.mediaType === 'TRAILER')?.url || ''
  // Map genres
  const genreList = data.genres?.map(g => g.name) || []
  const genre = genreList.join(', ') || data.version || ''

  return {
    id: data.id,
    title: data.titleVn || data.titleEn || 'Chưa rõ tên',
    titleVn: data.titleVn || data.titleEn || 'Chưa rõ tên',
    titleEn: data.titleEn || '',
    description: data.description || '',
    director: data.director || 'Chưa rõ',
    duration: data.durationMinutes || 120,
    durationMinutes: data.durationMinutes || 120,
    rating: data.rating || 'K',
    format: data.version || '2D',
    version: data.version || '',
    language: data.language || 'Phụ đề tiếng Việt',
    poster,
    posterUrl: poster,
    trailerUrl: trailer,
    genre,
    genres: data.genres || [],
    releaseDate: data.fromDate || '',
    endDate: data.toDate || '',
    actors: data.actors || [],
    showtimes: data.showtimes || [],
    countries: data.countries || [],
    media: data.media || [],
    status: getDerivedStatus(data),
    hasActiveShowtimes: data.hasActiveShowtimes || false,
  }
}

export const movieService = {
  // POST /api/v1/admin/movies (multipart/form-data)
  createAdmin: async (movieData, posterFile = null) => {
    const formData = new FormData()
    formData.append('movie', new Blob([JSON.stringify(movieData)], { type: 'application/json' }))
    if (posterFile) {
      formData.append('posterFile', posterFile)
    }
    const res = await api.post('/api/v1/admin/movies', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  },

  // PUT /api/v1/admin/movies/{id} (multipart/form-data)
  updateAdmin: async (id, movieData, posterFile = null) => {
    const formData = new FormData()
    formData.append('movie', new Blob([JSON.stringify(movieData)], { type: 'application/json' }))
    if (posterFile) {
      formData.append('posterFile', posterFile)
    }
    const res = await api.put(`/api/v1/admin/movies/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  },

  // DELETE /api/v1/admin/movies/{id}
  deleteAdmin: async (id) => {
    const res = await api.delete(`/api/v1/admin/movies/${id}`)
    return res.data
  },


  // GET /api/v1/movies?page=0&size=10&search=&genreId=&status=
  getAll: async (params = {}) => {
    const { status, ...apiParams } = params
    const res = await api.get('/api/v1/movies', { params: apiParams })
    const page = res.data?.result
    let list = []
    if (page?.content) {
      list = page.content.map(mapMovieFromBackend)
    } else {
      const rawList = Array.isArray(res.data?.result) ? res.data.result : []
      list = rawList.map(mapMovieFromBackend)
    }

    // Filter by status on FE side using derived status from dates
    if (status && status !== 'all' && status !== 'ACTIVE') {
      const targetStatus = status === 'now-showing' ? 'NOW_SHOWING' : status === 'coming-soon' ? 'COMING_SOON' : status.toUpperCase()
      list = list.filter(m => m.status === targetStatus || m.status === status || m.status?.toLowerCase() === status.toLowerCase())
    }

    if (page?.content) {
      return {
        data: list,
        total: list.length,
        totalPages: Math.ceil(list.length / (params.size || 10)) || 1,
        currentPage: page.number,
      }
    }
    return { data: list }
  },

  // GET /api/v1/movies/{id}
  getById: async (id) => {
    const res = await api.get(`/api/v1/movies/${id}`)
    const data = res.data?.result || res.data
    return { data: mapMovieFromBackend(data) }
  },

  // GET /api/v1/movies/{id}/actors
  getActors: async (id) => {
    const res = await api.get(`/api/v1/movies/${id}/actors`)
    return res.data?.result || res.data || []
  },

  // GET /api/v1/genres
  getGenres: async () => {
    const res = await api.get('/api/v1/genres')
    return res.data
  },

  // GET /api/v1/countries
  getCountries: async () => {
    const res = await api.get('/api/v1/countries')
    return res.data
  },

  // GET /api/v1/cinema-rooms
  getCinemaRooms: async (cinemaId = null) => {
    const res = await api.get('/api/v1/cinema-rooms', {
      params: cinemaId ? { cinemaId } : {}
    })
    return res.data
  },

  // GET /api/v1/movies/all - Returns all movies for admin selection
  getAllMovies: async () => {
    const res = await api.get('/api/v1/movies/all')
    return res.data
  },
}

export default movieService
