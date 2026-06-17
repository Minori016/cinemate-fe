import api from './api'

export const movieService = {
  getAll: (params) => api.get('/api/v1/movies', { params }),
  getById: (id) => api.get(`/api/v1/movies/${id}`),
  create: (data) => api.post('/api/v1/movies', data),
  update: (id, data) => api.put(`/api/v1/movies/${id}`, data),
  delete: (id) => api.delete(`/api/v1/movies/${id}`),
  getShowtimes: () => api.get('/api/v1/movies/showtimes'),
  getActors: (id) => api.get(`/api/v1/movies/${id}/actors`),
}
