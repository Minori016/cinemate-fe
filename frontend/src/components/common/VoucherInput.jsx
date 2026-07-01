import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Tag, Check, AlertCircle, X, Sparkles } from 'lucide-react'

/**
 * Component VoucherInput
 *
 * Dùng trong flow booking/checkout. Không phụ thuộc backend (chưa có
 * endpoint validate). Người dùng nhập mã → apply state local.
 *
 * Props:
 *  - value:        string  - mã voucher hiện tại (controlled)
 *  - onChange:     (code|null) => void
 *  - onApply:      (code) => { valid: bool, discountText?: string, message?: string }
 *                  Nếu không truyền thì component tự validate theo regex
 *  - orderValue:   number - giá trị đơn hàng (tuỳ chọn, hiển thị thông tin)
 *  - appliedText:  string - text hiển thị khi đã apply (VD: "Giảm 20%")
 *  - className:    string
 */
export default function VoucherInput({
  value,
  onChange,
  onApply,
  orderValue,
  appliedText,
  className = '',
}) {
  const [input, setInput] = useState(value || '')
  const [state, setState] = useState(value ? 'applied' : 'idle') // idle | applied | error
  const [message, setMessage] = useState('')
  const [appliedCode, setAppliedCode] = useState(value || '')

  const handleApply = () => {
    const code = input.trim().toUpperCase()
    if (!code) {
      setState('error')
      setMessage('Vui lòng nhập mã khuyến mãi.')
      return
    }

    let result
    if (typeof onApply === 'function') {
      result = onApply(code)
    } else {
      // Mặc định: validate format cơ bản
      const ok = /^[A-Z0-9_-]{3,32}$/.test(code)
      result = ok
        ? { valid: true, discountText: 'Mã hợp lệ — vui lòng liên hệ quầy để áp dụng.' }
        : { valid: false, message: 'Mã không hợp lệ.' }
    }

    if (result.valid) {
      setState('applied')
      setAppliedCode(code)
      setMessage(result.discountText || 'Áp dụng thành công!')
      onChange?.(code)
    } else {
      setState('error')
      setMessage(result.message || 'Mã không hợp lệ hoặc đã hết hạn.')
    }
  }

  const handleRemove = () => {
    setState('idle')
    setInput('')
    setAppliedCode('')
    setMessage('')
    onChange?.(null)
  }

  return (
    <div className={className}>
      <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
        <Tag size={14} className="text-red-500" />
        Mã khuyến mãi
      </label>

      <AnimatePresence mode="wait">
        {state === 'applied' ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between gap-2 p-3 rounded-lg bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/40"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 w-7 h-7 rounded-md bg-green-500/20 flex items-center justify-center">
                <Check size={14} className="text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="font-extrabold font-mono text-white tracking-wider text-sm">{appliedCode}</code>
                  <Sparkles size={12} className="text-yellow-300" />
                </div>
                <p className="text-xs text-green-300 truncate">{appliedText || message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Bỏ mã"
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value.toUpperCase())
                    if (state === 'error') {
                      setState('idle')
                      setMessage('')
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApply()
                    }
                  }}
                  placeholder="Nhập mã (VD: SUMMER2026)"
                  className={`w-full bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 pr-10 text-sm uppercase tracking-wider font-mono text-white placeholder-[var(--color-text-muted)] placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-red-500 transition-colors
                    ${state === 'error' ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleApply}
                disabled={!input.trim()}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Áp dụng
              </button>
            </div>

            {state === 'error' && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-1.5 text-xs text-red-400"
              >
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                <span>{message}</span>
              </motion.div>
            )}

            {orderValue != null && (
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Giá trị đơn hàng:{' '}
                <span className="font-mono font-bold text-white">
                  {new Intl.NumberFormat('vi-VN').format(orderValue)}đ
                </span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
