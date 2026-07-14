import { useState, useEffect, useLayoutEffect, useCallback } from 'react'

const FRAME_PADDING = 8

/**
 * Visual-only guide for the score-qualified Best View zone.
 * Uses measured seat DOM bounds so it remains correct for responsive layouts.
 */
export default function BestViewZoneFrame({ seatIds = [], seatRefs = {}, measureRoot, layoutKey = '' }) {
  const [position, setPosition] = useState(null)

  const measure = useCallback(() => {
    if (!measureRoot || !seatIds.length) return null

    const rootRect = measureRoot.getBoundingClientRect()
    const bounds = seatIds
      .map(id => seatRefs[id]?.getBoundingClientRect())
      .filter(Boolean)

    if (!bounds.length) return null

    const left = Math.min(...bounds.map(rect => rect.left)) - rootRect.left - FRAME_PADDING
    const top = Math.min(...bounds.map(rect => rect.top)) - rootRect.top - FRAME_PADDING
    const right = Math.max(...bounds.map(rect => rect.right)) - rootRect.left + FRAME_PADDING
    const bottom = Math.max(...bounds.map(rect => rect.bottom)) - rootRect.top + FRAME_PADDING

    return { left, top, width: right - left, height: bottom - top }
  }, [measureRoot, seatIds, seatRefs])

  useLayoutEffect(() => {
    setPosition(null)
    const frameId = window.requestAnimationFrame(() => setPosition(measure()))
    return () => window.cancelAnimationFrame(frameId)
  }, [measure, layoutKey])

  useEffect(() => {
    if (!measureRoot) return undefined

    const update = () => setPosition(measure())
    const scrollParent = measureRoot.parentElement
    const resizeObserver = new ResizeObserver(update)

    resizeObserver.observe(measureRoot)
    scrollParent?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      resizeObserver.disconnect()
      scrollParent?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [measureRoot, measure])

  if (!position) return null

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[10]" style={{ overflow: 'visible' }}>
      <div
        className="absolute rounded-2xl border"
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          height: position.height,
          borderColor: 'rgba(245, 158, 11, 0.52)',
          background: 'rgba(245, 158, 11, 0.035)',
          boxShadow: 'inset 0 0 16px rgba(245, 158, 11, 0.08), 0 0 12px rgba(245, 158, 11, 0.06)',
        }}
      >
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.16em] whitespace-nowrap"
          style={{
            color: '#fbbf24',
            background: 'rgba(12, 12, 12, 0.9)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          Vùng xem tốt nhất
        </span>
      </div>
    </div>
  )
}