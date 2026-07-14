/**
 * Cinema Seat Gap Validation Utilities
 *
 * Implements the "no orphan seat" rule used by commercial cinema systems
 * (CGV, Galaxy, Lotte, BHD...).  A single isolated empty seat surrounded
 * by barriers / occupied seats is illegal.
 *
 * Algorithm: O(n) per affected row.
 *   1. Split each row into segments at barriers (aisle, sold, disabled…).
 *   2. For each segment, simulate the user's action.
 *   3. Reject if any remaining empty block has length === 1.
 */

/* ──────────────────────────────── Constants ──────────────────────────────── */

/** Statuses / types that break a seat segment (barriers). */
const BARRIER_STATUSES = new Set([
  'SOLD',
  'RESERVED',
  'MAINTENANCE',
  'DISABLED',
  'BROKEN',
  'AISLE',
  'COUPLE_EXTENSION',
])

/** Statuses / types that count as occupied (not empty). */
const OCCUPIED_STATUSES = new Set([
  'SOLD',
  'RESERVED',
  'MAINTENANCE',
  'DISABLED',
  'BROKEN',
  'AISLE',
  'COUPLE_EXTENSION',
  'SELECTED',
])

export const SEAT_GAP_ERROR_MESSAGE = 'Không được để lại một ghế trống.'

/* ──────────────────────────────── Helpers ──────────────────────────────── */

/**
 * Check if a seat acts as a barrier (breaks a segment).
 * @param {{ status?: string, type?: string }} seat
 * @returns {boolean}
 */
export function isBarrier(seat) {
  const status = String(seat?.status || '').toUpperCase()
  const type = String(seat?.type || '').toUpperCase()
  return BARRIER_STATUSES.has(status) || type === 'AISLE' || type === 'COUPLE_EXTENSION'
}

/**
 * Check if a seat is permanently occupied (sold / reserved / disabled).
 * Does NOT include user-selected seats — those are handled separately.
 * @param {{ status?: string, type?: string }} seat
 * @returns {boolean}
 */
export function isPermanentlyOccupied(seat) {
  const status = String(seat?.status || '').toUpperCase()
  const type = String(seat?.type || '').toUpperCase()
  return OCCUPIED_STATUSES.has(status) || type === 'AISLE' || type === 'COUPLE_EXTENSION'
}

/**
 * Extract the numeric position of a seat within its row.
 * Handles IDs like "A1", "A-1", "a05", etc.
 * @param {string} seatId
 * @returns {number|null}
 */
export function extractSeatPosition(seatId) {
  if (!seatId) return null
  const match = String(seatId).match(/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

/* ──────────────────────────────── Segment Splitting ──────────────────────────────── */

/**
 * Split a row of seats into contiguous segments separated by barriers.
 *
 * Each segment entry is either:
 *   - an array of seat objects `{ id, occupied }`
 *   - `null` representing a barrier
 *
 * @param {Array<{id:string, status?:string, type?:string}>} rowSeats
 * @param {Set<string>} effectiveOccupied - seats considered occupied after the proposed action
 * @returns {Array<Array<{id:string, occupied:boolean}>|null>}
 */
export function splitSeatSegments(rowSeats, effectiveOccupied) {
  const segments = []
  let current = []

  for (const seat of rowSeats) {
    if (isBarrier(seat)) {
      if (current.length > 0) {
        segments.push(current)
        current = []
      }
      segments.push(null) // barrier marker
      continue
    }

    current.push({
      id: seat.id,
      occupied: effectiveOccupied.has(seat.id),
    })
  }

  if (current.length > 0) {
    segments.push(current)
  }

  return segments
}

/* ──────────────────────────────── Row / Segment Validation ──────────────────────────────── */

/**
 * Validate a single continuous seat segment.
 * Returns invalid if any contiguous empty block has length exactly 1.
 *
 * @param {Array<{id:string, occupied:boolean}>|null} segment
 * @returns {{ valid: boolean, orphanSeatId?: string }}
 */
export function validateRow(segment) {
  if (!segment || segment.length === 0) {
    return { valid: true }
  }

  let i = 0
  while (i < segment.length) {
    if (segment[i].occupied) {
      i++
      continue
    }

    // Start of an empty block
    const start = i
    while (i < segment.length && !segment[i].occupied) {
      i++
    }
    const size = i - start

    if (size === 1) {
      return { valid: false, orphanSeatId: segment[start].id }
    }
  }

  return { valid: true }
}

/* ──────────────────────────────── Main Entry Point ──────────────────────────────── */

/**
 * Count orphan seats (empty blocks of exactly 1) across all segments.
 * Segments stay separate (aisle/sold barriers) so each is independent.
 * @param {Array<Array<{id:string, occupied:boolean}>|null>} segments
 * @returns {number}
 */
function countOrphans(segments) {
  let count = 0
  for (const seg of segments) {
    if (!seg) continue
    let i = 0
    while (i < seg.length) {
      if (seg[i].occupied) { i++; continue }
      const start = i
      while (i < seg.length && !seg[i].occupied) { i++ }
      if (i - start === 1) count++
    }
  }
  return count
}

/**
 * Validate a proposed seat selection / deselection.
 *
 * Compares the "before" and "after" states of the affected row.
 * Only rejects if the action *creates* a new orphan seat that didn't exist before.
 * Pre-existing orphans (e.g. from sold seats) are ignored.
 *
 * @param {Object} params
 * @param {Array<{id?:string, rowLabel?:string, seats: Array<{id:string, status?:string, type?:string}>}>} params.rows
 *   Seat rows (from layout.seatMatrix or synthetic fallback).
 * @param {string[]} params.currentSelected
 *   Seat IDs currently selected by the user (before this action).
 * @param {string} params.toggledSeatId
 *   The seat the user just clicked.
 * @param {boolean} [params.isSelecting]
 *   true = selecting, false = deselecting.  Auto-detected if omitted.
 * @returns {{ valid: boolean, reason?: string, affectedRow?: string, orphanSeatId?: string }}
 */
export function validateSeatSelection({
  rows,
  currentSelected = [],
  toggledSeatId,
  isSelecting,
}) {
  if (!toggledSeatId || !Array.isArray(rows) || rows.length === 0) {
    return { valid: true }
  }

  const currentSet = new Set(currentSelected)
  const selecting = typeof isSelecting === 'boolean'
    ? isSelecting
    : !currentSet.has(toggledSeatId)

  // Collect permanently occupied seats once
  const permOccupied = new Set()
  for (const row of rows) {
    for (const seat of (row.seats || [])) {
      if (isPermanentlyOccupied(seat)) {
        permOccupied.add(seat.id)
      }
    }
  }

  // Helper: build effective occupied set for a given selected-seat list
  const buildEffective = (selSet) => {
    const eff = new Set(selSet)
    permOccupied.forEach(id => eff.add(id))
    return eff
  }

  // Only validate the row that contains the toggled seat (O(n) for that row)
  for (const row of rows) {
    const seats = row.seats || []
    if (!seats.some((s) => s.id === toggledSeatId)) continue

    // Before state: current selections + permanent occupancy
    const beforeEff = buildEffective(currentSet)
    const beforeSegs = splitSeatSegments(seats, beforeEff)
    const beforeOrphans = countOrphans(beforeSegs)

    // After state: apply the toggle
    const afterSet = new Set(currentSet)
    if (selecting) afterSet.add(toggledSeatId)
    else afterSet.delete(toggledSeatId)
    const afterEff = buildEffective(afterSet)
    const afterSegs = splitSeatSegments(seats, afterEff)
    const afterOrphans = countOrphans(afterSegs)

    // Reject only if the action *increased* orphan count
    if (afterOrphans > beforeOrphans) {
      // Find the specific orphan seat that is newly created
      for (const seg of afterSegs) {
        if (seg === null) continue
        const result = validateRow(seg)
        if (!result.valid) {
          return {
            valid: false,
            reason: SEAT_GAP_ERROR_MESSAGE,
            affectedRow: row.rowLabel || row.id || '',
            orphanSeatId: result.orphanSeatId,
          }
        }
      }
    }

    // Found the affected row — done
    return { valid: true }
  }

  // Seat not found in any row — allow (fallback layout mismatch)
  return { valid: true }
}

/* ──────────────────────────────── Layout Helpers ──────────────────────────────── */

/**
 * Convert a cinema-room layout into the row array expected by validateSeatSelection.
 * @param {{ seatMatrix?: Array<{rowLabel?:string, seats?: Array}> } | null} layout
 * @returns {Array<{id:string, rowLabel:string, seats:Array}>}
 */
export function getRowsFromLayout(layout) {
  if (!layout?.seatMatrix?.length) return []
  return layout.seatMatrix.map((row) => ({
    id: row.rowLabel || '',
    rowLabel: row.rowLabel || '',
    seats: Array.isArray(row.seats) ? row.seats : [],
  }))
}

/**
 * Build synthetic rows for the hardcoded fallback seat map
 * (A–F standard/VIP, G–H couple) used when the API layout is unavailable.
 *
 * @returns {Array<{id:string, rowLabel:string, seats:Array}>}
 */
export function buildFallbackRows() {
  const standardRows = ['A', 'B', 'C']
  const vipRows = ['D', 'E', 'F']
  const coupleRows = ['G', 'H']
  const rows = []

  // Standard / VIP: 12 seats with aisles after 3 and 9
  // Layout: 1 2 3 | 4 5 6 7 8 9 | 10 11 12
  for (const label of [...standardRows, ...vipRows]) {
    const type = vipRows.includes(label) ? 'VIP' : 'STANDARD'
    const seats = []
    for (let n = 1; n <= 12; n++) {
      // Aisle gaps after seat 3 and seat 9
      if (n === 4 || n === 10) {
        seats.push({ id: `${label}-aisle-${n}`, type: 'AISLE', status: 'AISLE' })
      }
      seats.push({
        id: `${label}${n}`,
        row: label,
        number: n,
        type,
        status: 'ACTIVE',
      })
    }
    rows.push({ id: label, rowLabel: label, seats })
  }

  // Couple rows: 5 couple seats with aisles after 1 and 4
  // Layout: 1 | 2 3 4 | 5
  for (const label of coupleRows) {
    const seats = []
    for (let n = 1; n <= 5; n++) {
      if (n === 2 || n === 5) {
        seats.push({ id: `${label}-aisle-${n}`, type: 'AISLE', status: 'AISLE' })
      }
      seats.push({
        id: `${label}${n}`,
        row: label,
        number: n,
        type: 'COUPLE',
        status: 'ACTIVE',
      })
    }
    rows.push({ id: label, rowLabel: label, seats })
  }

  return rows
}

/**
 * Apply permanently occupied seats (from OCCUPIED_SEATS fallback list) onto fallback rows.
 * @param {Array<{id:string, rowLabel:string, seats:Array}>} rows
 * @param {string[]} occupiedLabels - e.g. ['A3','B1']
 * @returns {Array}
 */
export function applyOccupiedToRows(rows, occupiedLabels = []) {
  if (!occupiedLabels.length) return rows
  const occ = new Set(occupiedLabels)
  return rows.map((row) => ({
    ...row,
    seats: row.seats.map((seat) =>
      occ.has(seat.id)
        ? { ...seat, status: 'SOLD' }
        : seat
    ),
  }))
}