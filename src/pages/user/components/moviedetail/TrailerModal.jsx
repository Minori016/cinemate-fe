import { motion } from 'motion/react'
import { X } from 'lucide-react'

export default function TrailerModal({ isTrailerOpen, onClose, movie }) {
  if (!isTrailerOpen || !movie) return null

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md"
      style={{ backgroundColor: 'rgba(0,0,0,0.93)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      <motion.button
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer border-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X size={20} />
      </motion.button>
      <motion.div
        className="w-full max-w-5xl aspect-video px-4 z-[105] relative"
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.4, ease: [0.34, 1.26, 0.64, 1] }}
      >
        <iframe
          title={`${movie.title} Trailer`}
          src={`${movie.trailerUrl}?autoplay=1&rel=0`}
          className="w-full h-full rounded-xl border border-white/10 shadow-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    </motion.div>
  )
}
