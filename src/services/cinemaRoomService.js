import api from './api'

export const cinemaRoomService = {
  // GET /api/v1/cinema-rooms?cinemaId={uuid}  (cinemaId optional)
  getAll: (cinemaId) => api.get('/api/v1/cinema-rooms', {
    params: cinemaId ? { cinemaId } : {}
  }),
  // Fallback for ID-based lookup (route via list + filter client-side if BE has no single-room endpoint)
  getById: (id) => api.get('/api/v1/cinema-rooms').then(res => {
    const rooms = res.data?.result || []
    const room = rooms.find(r => r.id === id)
    if (!room) throw new Error('Room not found')
    return { data: room }
  }),
  // Stub methods for seats since BE only supports cinema-rooms listing currently
  getSeats: (roomId) => Promise.resolve({ data: null }),
  updateSeats: (roomId, seats) => Promise.resolve({ data: null }),
  create: (payload) => api.post('/api/v1/admin/cinema-rooms', payload),
}

