import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  className = '',
  type = 'text',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
  const hasValue = props.value !== undefined && props.value !== ''

  return (
    <div className={`flex flex-col gap-1.5 w-full text-left ${className}`}>
      {label && (
        <motion.label
          className="text-xs font-semibold tracking-wider uppercase"
          style={{
            color: isFocused ? '#e50914' : 'var(--color-text-muted)',
            transition: 'color 0.2s ease',
          }}
        >
          {label}
        </motion.label>
      )}

      <div className="relative flex items-center group">
        {icon && (
          <span
            className="absolute left-3.5 pointer-events-none transition-colors duration-200"
            style={{ color: isFocused ? '#e50914' : 'var(--color-text-muted)' }}
          >
            {icon}
          </span>
        )}

        <input
          ref={inputRef}
          type={inputType}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          className={`
            w-full rounded-xl py-3 text-sm transition-all duration-200
            bg-white/[0.04] border
            placeholder:text-[var(--color-text-dim)]
            focus:outline-none
            disabled:opacity-40 disabled:cursor-not-allowed
            ${icon ? 'pl-11' : 'pl-4'}
            ${rightIcon || isPassword ? 'pr-12' : 'pr-4'}
            ${error
              ? 'border-red-500/60 shadow-[0_0_0_3px_rgba(229,9,20,0.1)]'
              : isFocused
                ? 'border-[#e50914] shadow-[0_0_0_3px_rgba(229,9,20,0.12)]'
                : 'border-white/[0.08] hover:border-white/[0.14]'
            }
          `}
          style={{ color: 'var(--color-text)' }}
          {...props}
        />

        {/* Right icon area */}
        <div className="absolute right-3 flex items-center gap-1">
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded-md transition-colors duration-200 hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <span style={{ color: 'var(--color-text-muted)' }}>{rightIcon}</span>
          )}
        </div>

        {/* Animated bottom glow line */}
        <motion.div
          className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
          initial={false}
          animate={{
            opacity: isFocused ? 1 : 0,
            scaleX: isFocused ? 1 : 0.5,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          style={{
            background: error
              ? '#ef4444'
              : 'linear-gradient(90deg, #e50914, #ff4444)',
            boxShadow: '0 0 8px rgba(229,9,20,0.4)',
          }}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-medium text-red-400 pl-1"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
