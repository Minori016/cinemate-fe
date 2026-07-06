import { motion } from 'motion/react'

const ratingColors = {
  T18: { bg: '#dc2626' },
  T16: { bg: '#ef4444' },
  T13: { bg: '#f97316' },
  K: { bg: '#16a34a' },
  P: { bg: '#eab308' },
}

const variantConfig = {
  default: 'bg-white/[0.06] text-[var(--color-text-muted)] border-white/[0.08]',
  success: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/12 text-red-400 border-red-500/20',
  info: 'bg-blue-500/12 text-blue-400 border-blue-500/20',
  genre: 'bg-white/[0.04] text-[var(--color-text-muted)] border-white/[0.08]',
  vip: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
}

export default function Badge({
  children,
  variant = 'default',
  rating,
  className = '',
  size = 'md',
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  const isRating = rating && ratingColors[rating]
  const variantClass = variantConfig[variant] || variantConfig.default

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      whileHover={{ scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 20 } }}
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-lg border ${sizeClasses[size]} ${isRating ? 'text-white border-0' : variantClass} ${className}`}
      style={isRating ? { backgroundColor: ratingColors[rating].bg } : undefined}
    >
      {children}
    </motion.span>
  )
}
