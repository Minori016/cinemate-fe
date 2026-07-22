import { motion } from 'motion/react'

const baseClasses =
  'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none'

const variantClasses = {
  primary:
    'bg-gradient-to-r from-[#e50914] to-[#b3070f] text-white shadow-lg shadow-[rgba(229,9,20,0.35)] hover:shadow-xl hover:shadow-[rgba(229,9,20,0.5)] hover:brightness-110 active:brightness-90 border border-white/10',
  secondary:
    'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm',
  outline:
    'bg-transparent text-[#e50914] border-2 border-[#e50914]/40 hover:bg-[#e50914]/10 hover:border-[#e50914]',
  ghost:
    'bg-transparent text-[var(--color-text-muted)] hover:text-white hover:bg-white/5',
  danger:
    'bg-red-600 text-white border border-red-300/70 hover:bg-red-500 hover:border-red-200 shadow-md shadow-red-500/40',
  success:
    'bg-emerald-500 text-white border border-emerald-300/70 hover:bg-emerald-400 hover:border-emerald-200 shadow-md shadow-emerald-500/40',
  info:
    'bg-blue-600 text-white border border-blue-300/70 hover:bg-blue-500 hover:border-blue-200 shadow-md shadow-blue-500/40',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs tracking-wide',
  md: 'px-5 py-2.5 text-sm tracking-wide',
  lg: 'px-7 py-3.5 text-base tracking-wide',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconRight,
  loading = false,
  ...props
}) {
  const variantStyle = variantClasses[variant] || variantClasses.primary

  return (
    <motion.button
      whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 500, damping: 25 } }}
      className={`${baseClasses} ${variantStyle} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </span>
      )}
    </motion.button>
  )
}
