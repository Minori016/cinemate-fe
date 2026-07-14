import { getSeatScore } from '../utils/seatScoring'

/**
 * Builds the existing Gaussian score grid once per layout input.
 */
export function buildSeatScores(rows = []) {
  const rowCount = rows.length
  const scores = new Map()

  rows.forEach((row, rowIndex) => {
    const physicalSeats = (row.seats || []).filter(seat => (
      String(seat.type || '').toUpperCase() !== 'AISLE' &&
      String(seat.type || '').toUpperCase() !== 'COUPLE_EXTENSION'
    ))
    const columnCount = physicalSeats.length

    physicalSeats.forEach((seat, columnIndex) => {
      scores.set(seat.id, getSeatScore(rowIndex, columnIndex, rowCount, columnCount))
    })
  })

  return scores
}

export function scoreCandidate(candidate, seatScores) {
  if (!candidate?.seats?.length) return 0
  const total = candidate.seats.reduce((sum, seat) => sum + (seatScores.get(seat.id) || 0), 0)
  return total / candidate.seats.length
}
