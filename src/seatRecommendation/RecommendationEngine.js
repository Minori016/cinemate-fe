import { generateCandidates } from './CandidateGenerator'
import { buildSeatScores, scoreCandidate } from './CandidateScorer'
import { validateSeatSelection } from '../utils/seatValidation'

/**
 * Finds the single best contiguous seat group for the requested quantity.
 * Validates every candidate against the existing gap validator.
 *
 * @param {Object} params
 * @param {Array}  params.rows           - normalized validator rows
 * @param {number} [params.ticketQuantity=1] - desired number of seats
 * @param {string[]} [params.selectedSeats=[]] - currently selected IDs
 * @returns {{ seats: string[], score: number, row: string, startSeat: string, endSeat: string } | null}
 */
export function recommendSeats({ rows = [], ticketQuantity = 1, selectedSeats = [] }) {
  const quantity = Number(ticketQuantity) || 1
  const candidates = generateCandidates(rows, quantity, selectedSeats)
  if (!candidates.length) return null

  const seatScores = buildSeatScores(rows)

  // Score and validate every candidate
  const scored = candidates.map(c => ({
    ...c,
    avgScore: scoreCandidate(c, seatScores),
    valid: validateGroup(rows, c.seats.map(s => s.id), selectedSeats),
  }))

  // Filter valid, sort descending by average score, then by row/column order for determinism
  const valid = scored.filter(c => c.valid)
  if (!valid.length) return null

  valid.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore
    if (a.row !== b.row) return a.row.localeCompare(b.row)
    return a.startColumn - b.startColumn
  })

  const best = valid[0]
  if (!best?.seats?.length) return null

  return {
    seats: best.seats.map(s => s.id),
    score: Math.round(best.avgScore * 1000) / 1000,
    row: best.row,
    startSeat: best.seats[0].id,
    endSeat: best.seats[best.seats.length - 1].id,
  }
}

/**
 * Simulate sequential selection of a group and check that no orphan is created.
 */
function validateGroup(rows, groupIds, currentSelected) {
  if (!groupIds.length) return true
  const combined = [...currentSelected]
  for (const id of groupIds) {
    if (combined.includes(id)) continue
    combined.push(id)
    const result = validateSeatSelection({
      rows,
      currentSelected: combined.slice(0, -1),
      toggledSeatId: id,
      isSelecting: true,
    })
    if (!result.valid) return false
  }
  return true
}

/**
 * Resets cached state for engines that hold internal memoization.
 */
export function clearRecommendation() {
  // No mutable global state — this is a no-op placeholder
  // kept for future callers that may cache results.
}