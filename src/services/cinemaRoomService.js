import api from './api'

export const cinemaRoomService = {
  getAll: () => api.get('/cinema-rooms'),
  getById: (id) => api.get(`/cinema-rooms/${id}`),
  create: (data) => api.post('/cinema-rooms', data),
  update: (id, data) => api.put(`/cinema-rooms/${id}`, data),
  getSeats: (id) => api.get(`/cinema-rooms/${id}/seats`),
  updateSeats: (id, data) => api.put(`/cinema-rooms/${id}/seats`, data),
}
