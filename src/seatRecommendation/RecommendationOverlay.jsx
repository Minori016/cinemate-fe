import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import gsap from 'gsap'
import RecommendationBadge from './RecommendationBadge'

/**
 * Measures the first and last recommended seats and surrounds them with one
 * responsive, non-interactive bounding rectangle.
 */
export default function RecommendationOverlay({
  recommendedSeats = [],
  seatRefs = {},
  measureRoot,
  isVisible = false,
}) {
  const [position, setPosition] = useState(null)
  const rectRef = useRef(null)
  const badgeRef = useRef(null)

  const measure = useCallback(() => {
    if (!measureRoot || !recommendedSeats.length) return null
    const firstEl = seatRefs[recommendedSeats[0]]
    const lastEl = seatRefs[recommendedSeats[recommendedSeats.length - 1]]
    if (!firstEl || !lastEl) return null

    const root = measureRoot.getBoundingClientRect()
    const first = firstEl.getBoundingClientRect()
    const last = lastEl.getBoundingClientRect()
    return {
      left: first.left - root.left,
      top: first.top - root.top,
      width: last.right - first.left,
      height: last.bottom - first.top,
    }
  }, [measureRoot, recommendedSeats, seatRefs])

  useLayoutEffect(() => {
    if (!isVisible) {
      setPosition(null)
      return
    }
    setPosition(measure())
  }, [isVisible, measure])

  useEffect(() => {
    if (!isVisible || !measureRoot) return

    const updatePosition = () => setPosition(measure())
    const scrollParent = measureRoot.parentElement
    scrollParent?.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition)

    const observer = new ResizeObserver(updatePosition)
    observer.observe(measureRoot)

    return () => {
      scrollParent?.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
      observer.disconnect()
    }
  }, [isVisible, measureRoot, measure])

  useLayoutEffect(() => {
    if (!position || !rectRef.current || !badgeRef.current) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.fromTo(rectRef.current, {
        opacity: 0,
        scale: reduceMotion ? 1 : 0.88,
      }, {
        opacity: 1,
        scale: 1,
        duration: reduceMotion ? 0 : 0.4,
        ease: 'power2.out',
      })
      gsap.fromTo(badgeRef.current, {
        opacity: 0,
        y: reduceMotion ? 0 : -10,
        scale: reduceMotion ? 1 : 0.92,
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : 0.08,
        ease: 'power2.out',
      })
    })
    return () => ctx.revert()
  }, [position])

  if (!isVisible || !position) return null

  const badgeStyle = {
    left: position.left + position.width / 2,
    top: position.top - 32,
    transform: 'translateX(-50%)',
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[35]" style={{ overflow: 'visible' }}>
      <div
        ref={rectRef}
        className="absolute rounded-2xl border-2"
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          height: position.height,
          borderColor: 'rgba(229, 9, 20, 0.65)',
          background: 'rgba(229, 9, 20, 0.06)',
          boxShadow: '0 0 20px rgba(229, 9, 20, 0.2), inset 0 0 12px rgba(229, 9, 20, 0.05)',
        }}
      />
      <div ref={badgeRef} className="absolute" style={badgeStyle}>
        <RecommendationBadge />
      </div>
    </div>
  )
}