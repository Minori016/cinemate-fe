import api from './api'

/** Convert flat /seats list → RoomLayoutResponse-like seatMatrix for booking UI. */
export const buildSeatMatrixFromFlat = (seats = [], roomMeta = {}) => {
  const list = Array.isArray(seats) ? seats.filter(Boolean) : []
  const byRow = new Map()

  list.forEach(seat => {
    const row = seat.row || String(seat.id || '').charAt(0)
    if (!row) return
    if (!byRow.has(row)) byRow.set(row, [])
    byRow.get(row).push({
      id: seat.id,
      row,
      number: seat.number,
      type: seat.type || 'STANDARD',
      colspan: seat.colspan ?? (String(seat.type).toUpperCase() === 'COUPLE' ? 2 : 1),
      status: seat.status || 'ACTIVE',
    })
  })

  const seatMatrix = Array.from(byRow.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rowLabel, rowSeats]) => ({
      rowLabel,
      seats: rowSeats.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0)),
    }))

  return {
    roomId: roomMeta.roomId || null,
    roomName: roomMeta.roomName || '',
    rowCount: seatMatrix.length,
    columnCount: seatMatrix.reduce((max, row) => Math.max(max, row.seats.length), 0),
    totalSeats: list.length,
    seatMatrix,
  }
}

export const cinemaRoomService = {
  // GET /api/v1/cinema-rooms?cinemaId={uuid}  (cinemaId optional)
  getAll: (cinemaId) => api.get('/api/v1/cinema-rooms', {
    params: cinemaId ? { cinemaId } : {}
  }),
  getById: (id) => api.get(`/api/v1/cinema-rooms/${id}`),
  getSeats: (roomId) => api.get(`/api/v1/cinema-rooms/${roomId}/seats`),
  getLayout: (roomId) => api.get(`/api/v1/cinema-rooms/${roomId}/layout`),

  /**
   * Prefer /layout (seatMatrix). Fallback to /seats flat list and normalize.
   * Returns RoomLayoutResponse-like object (not axios response).
   */
  getLayoutNormalized: async (roomId, roomMeta = {}) => {
    if (!roomId) return null

    try {
      const res = await api.get(`/api/v1/cinema-rooms/${roomId}/layout`)
      const data = res.data?.result || res.data
      if (data?.seatMatrix && Array.isArray(data.seatMatrix) && data.seatMatrix.length > 0) {
        return {
          ...data,
          seatMatrix: data.seatMatrix.map(row => ({
            rowLabel: row.rowLabel || row.row || '',
            seats: Array.isArray(row.seats) ? row.seats : [],
          })),
        }
      }
    } catch (err) {
      // fall through to /seats
      console.warn('getLayout failed, fallback to /seats', err?.response?.status || err?.message)
    }

    const seatsRes = await api.get(`/api/v1/cinema-rooms/${roomId}/seats`)
    const seats = seatsRes.data?.result || seatsRes.data || []
    return buildSeatMatrixFromFlat(Array.isArray(seats) ? seats : [], {
      roomId,
      roomName: roomMeta.roomName || '',
    })
  },

  create: (payload) => api.post('/api/v1/admin/cinema-rooms', payload),
  updateInfo: (roomId, payload) => api.put(`/api/v1/admin/cinema-rooms/${roomId}`, payload),
  updateLayout: (roomId, payload) => api.put(`/api/v1/admin/cinema-rooms/${roomId}/layout`, payload),
  updateStatus: (roomId, status) => api.patch(`/api/v1/admin/cinema-rooms/${roomId}/status`, { status }),
  delete: (roomId) => api.delete(`/api/v1/admin/cinema-rooms/${roomId}`),
}
