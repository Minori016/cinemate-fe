import api from './api'

export const cinemaService = {
  // GET /api/v1/cinema-rooms — returns rooms with cinemaName embedded
  getAll: () => api.get('/api/v1/cinema-rooms'),

  // GET /api/v1/cinema-rooms?cinemaId={uuid}
  getRooms: (cinemaId) => api.get('/api/v1/cinema-rooms', { params: cinemaId ? { cinemaId } : {} }),

  // GET /api/v1/cinema-rooms/{id}/layout
  getLayout: (roomId) => api.get(`/api/v1/cinema-rooms/${roomId}/layout`),

  // Derive unique cinemas from rooms list
  getCinemasFromRooms: (rooms) => {
    const map = new Map()
    rooms.forEach(r => {
      if (r.cinemaName && !map.has(r.cinemaName)) {
        map.set(r.cinemaName, { id: r.cinemaName, name: r.cinemaName })
      }
    })
    return Array.from(map.values())
  },
}
