import api from './api'

export const cinemaRoomService = {
  // GET /api/v1/cinema-rooms?cinemaId={uuid}  (cinemaId optional)
  getAll: (cinemaId) => api.get('/api/v1/cinema-rooms', {
    params: cinemaId ? { cinemaId } : {}
  }),
  getById: (id) => api.get(`/api/v1/cinema-rooms/${id}`),
  getSeats: (roomId) => api.get(`/api/v1/cinema-rooms/${roomId}/seats`),
  create: (payload) => api.post('/api/v1/admin/cinema-rooms', payload),
  updateInfo: (roomId, payload) => api.put(`/api/v1/admin/cinema-rooms/${roomId}`, payload),
  updateLayout: (roomId, payload) => api.put(`/api/v1/admin/cinema-rooms/${roomId}/layout`, payload),
  delete: (roomId) => api.delete(`/api/v1/admin/cinema-rooms/${roomId}`),
}

