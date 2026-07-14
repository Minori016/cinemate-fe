import { motion, AnimatePresence } from 'motion/react'
import { LogIn, X } from 'lucide-react'

export default function RequireAuthModal({ open, onLogin, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div
              className="w-full max-w-md rounded-2xl border p-8 text-center select-none"
              style={{
                background: 'rgba(18,20,20,0.95)',
                borderColor: 'rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(229,9,20,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(229,9,20,0.12)' }}>
                <LogIn size={28} style={{ color: 'var(--color-primary)' }} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-black text-white mb-2 tracking-wide">Đăng Nhập Để Đặt Vé</h3>

              {/* Description */}
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Bạn cần đăng nhập tài khoản để tiếp tục đặt vé. Hãy đăng nhập để trải nghiệm dịch vụ của chúng tôi.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider border transition-all cursor-pointer hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#9ca3af' }}
                >
                  Hủy
                </button>
                <button
                  onClick={onLogin}
                  className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                  style={{ background: 'var(--color-primary)', boxShadow: '0 4px 20px rgba(229,9,20,0.35)' }}
                >
                  <LogIn size={16} /> Đăng nhập
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}