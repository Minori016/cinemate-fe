import api from './api'

export const genreService = {
  // GET /api/v1/genres
  getAll: () => api.get('/api/v1/genres'),
}

export const countryService = {
  // GET /api/v1/countries
  getAll: () => api.get('/api/v1/countries'),
}
