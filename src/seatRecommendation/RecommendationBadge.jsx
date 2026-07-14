import { motion } from 'motion/react'

export default function RecommendationBadge({ children = '⭐ Best Seats', style }) {
  return (
    <motion.div
      className="absolute z-[40] pointer-events-none"
      initial={{ opacity: 0, y: -8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        ...style,
        transformOrigin: 'center top',
      }}
    >
      <div
        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap select-none"
        style={{
          background: 'linear-gradient(135deg, rgba(229,9,20,0.85), rgba(185,28,28,0.9))',
          color: '#fff',
          boxShadow: '0 0 12px rgba(229,9,20,0.35), 0 2px 8px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}