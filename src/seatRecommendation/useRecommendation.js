import { useState, useMemo, useCallback, useEffect } from 'react'
import { recommendSeats as runRecommendation, clearRecommendation as clearEngineRecommendation } from './RecommendationEngine'

/**
 * Recomputes a recommendation from the current layout inputs without owning
 * booking selection state. Future WebSocket consumers can refresh `rows`.
 */
export function useRecommendation({ rows = [], ticketQuantity = 1, selectedSeats = [], enabled = true }) {
  const [isDismissed, setIsDismissed] = useState(false)
  const hasSelection = selectedSeats.length > 0

  const calculatedRecommendation = useMemo(() => {
    if (!enabled || !rows.length) return null
    return runRecommendation({ rows, ticketQuantity, selectedSeats })
  }, [rows, ticketQuantity, selectedSeats, enabled])

  useEffect(() => {
    if (!hasSelection) setIsDismissed(false)
  }, [hasSelection, ticketQuantity, rows])

  const recommendSeats = useCallback((quantity = ticketQuantity) => {
    setIsDismissed(false)
    return runRecommendation({ rows, ticketQuantity: quantity, selectedSeats })
  }, [rows, ticketQuantity, selectedSeats])

  const clearRecommendation = useCallback(() => {
    setIsDismissed(true)
    clearEngineRecommendation()
  }, [])

  return {
    recommendation: hasSelection || isDismissed ? null : calculatedRecommendation,
    recommendSeats,
    clearRecommendation,
    recalculate: recommendSeats,
  }
}