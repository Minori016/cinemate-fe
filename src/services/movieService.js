import api from './api'

export const movieService = {
  // Public endpoints — GET /api/v1/movies
  // Params: { search, genreId, status, page, size }
  getAll: (params) => api.get('/api/v1/movies', { params }),
  getById: (id) => api.get(`/api/v1/movies/${id}`),
  getActors: (id) => api.get(`/api/v1/movies/${id}/actors`),

  // Admin movie creation endpoint with multipart/form-data
  // BE expects: "movie" part (JSON Blob) + "posterFile" part (optional image)
  createAdmin: (movieData, posterFile) => {
    const formData = new FormData()
    formData.append('movie', new Blob([JSON.stringify(movieData)], { type: 'application/json' }))
    if (posterFile) {
      formData.append('posterFile', posterFile)
    }
    return api.post('/api/v1/admin/movies', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Helper endpoints for genres, countries and cinema rooms
  getGenres: () => api.get('/api/v1/genres'),
  getCountries: () => api.get('/api/v1/countries'),
  getCinemaRooms: (cinemaId) => api.get('/api/v1/cinema-rooms', {
    params: cinemaId ? { cinemaId } : {}
  }),
}
