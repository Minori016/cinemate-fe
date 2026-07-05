import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md', theme = 'dark' }) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  }
  
  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`
              relative w-full rounded-2xl overflow-hidden
              ${isLight ? 'bg-white border border-[#e5bdbe] shadow-xl' : 'bg-[#111111] border border-white/[0.07] shadow-2xl'}
              ${sizeClasses[size]}
            `}
            style={isLight ? {} : {
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Accent top line */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background: isLight 
                  ? 'linear-gradient(90deg, transparent, #b80035, transparent)'
                  : 'linear-gradient(90deg, transparent, #e50914, transparent)',
                opacity: isLight ? 0.8 : 0.6,
              }}
            />

            {/* Header */}
            {title && (
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-[#e0e3e5] bg-[#f7f9fb]' : 'border-white/[0.06]'}`}>
                <h3
                  className={`text-lg font-bold ${isLight ? 'text-[#191c1e]' : 'text-white'}`}
                  style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isLight ? 'text-[#5c647a] hover:bg-[#e0e3e5]' : 'hover:bg-white/10'}`}
                  style={isLight ? {} : { color: 'var(--color-text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
