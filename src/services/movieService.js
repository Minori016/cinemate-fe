import api from './api'

const mapMovieFromBackend = (data) => {
  if (!data) return null
  // Find poster from media
  const poster = data.media?.find(m => m.mediaType === 'POSTER')?.url || data.posterUrl || ''
  // Find trailer from media
  const trailer = data.media?.find(m => m.mediaType === 'TRAILER')?.url || data.trailerUrl || ''
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
    rating: data.rating || 'T13',
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
    status: data.status || null,
  }
}

export const movieService = {
  // POST /api/v1/admin/movies (multipart/form-data)
  createAdmin: async (movieData, posterFile = null) => {
    const formData = new FormData()
    formData.append('movie', JSON.stringify(movieData))
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
    formData.append('movie', JSON.stringify(movieData))
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
    const res = await api.get('/api/v1/movies', { params })
    const page = res.data?.result
    if (page?.content) {
      return {
        data: page.content.map(mapMovieFromBackend),
        total: page.totalElements,
        totalPages: page.totalPages,
        currentPage: page.number,
      }
    }
    const list = Array.isArray(res.data?.result) ? res.data.result : []
    return { data: list.map(mapMovieFromBackend) }
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
}
