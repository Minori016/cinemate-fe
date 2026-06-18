import api from './api'

export const movieService = {
  getAll: (params) => api.get('/api/v1/movies', { params }),
  getById: (id) => api.get(`/api/v1/movies/${id}`),
  create: (data) => api.post('/api/v1/movies', data),
  update: (id, data) => api.put(`/api/v1/movies/${id}`, data),
  delete: (id) => api.delete(`/api/v1/movies/${id}`),
  getShowtimes: () => api.get('/api/v1/movies/showtimes'),
  getActors: (id) => api.get(`/api/v1/movies/${id}/actors`),
  
  // Admin movie creation endpoint with multipart/form-data
  createAdmin: (movieData, posterFile) => {
    const formData = new FormData()
    // Convert the movie JSON object to a Blob with content-type application/json
    formData.append('movie', new Blob([JSON.stringify(movieData)], { type: 'application/json' }))
    if (posterFile) {
      formData.append('posterFile', posterFile)
    }
    return api.post('/api/v1/admin/movies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Helper endpoints for adding a movie
  getGenres: () => api.get('/api/v1/genres'),
  getCountries: () => api.get('/api/v1/countries'),
  getCinemaRooms: () => api.get('/api/v1/cinema-rooms')
}

