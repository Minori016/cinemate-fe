import { isBarrier, isPermanentlyOccupied } from '../utils/seatValidation'

function isAvailableSeat(seat, selectedSet) {
  return !isBarrier(seat) && !isPermanentlyOccupied(seat) && !selectedSet.has(seat.id)
}

/**
 * Generates every consecutive, available seat block inside each physical row segment.
 * Barriers terminate a segment so candidates can never cross an aisle or unavailable seat.
 */
export function generateCandidates(rows = [], ticketQuantity = 1, selectedSeats = []) {
  const quantity = Number(ticketQuantity)
  if (!Number.isInteger(quantity) || quantity < 1) return []

  const selectedSet = new Set(selectedSeats)
  const candidates = []

  rows.forEach((row, rowIndex) => {
    let segment = []
    let segmentStartColumn = 0

    const flushSegment = () => {
      if (segment.length >= quantity) {
        for (let start = 0; start <= segment.length - quantity; start++) {
          candidates.push({
            seats: segment.slice(start, start + quantity),
            row: row.rowLabel || row.id || '',
            rowIndex,
            startColumn: segmentStartColumn + start,
            order: candidates.length,
          })
        }
      }
      segment = []
    }

    ;(row.seats || []).forEach((seat, columnIndex) => {
      if (!isAvailableSeat(seat, selectedSet)) {
        flushSegment()
        segmentStartColumn = columnIndex + 1
        return
      }
      segment.push({ ...seat, columnIndex })
    })

    flushSegment()
  })

  return candidates
}
