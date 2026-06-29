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
  }
}

export const movieService = {
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
}
