import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Plus, Minus, Ticket, Check } from 'lucide-react'
import { promotionService, getQuickDiscountText } from '../../../../services/promotionService'

export default function ComboStep({
  combos = [],
  selectedCombos = {},
  onChangeCombo,
  promoCode,
  setPromoCode,
  discount,
  onApplyPromo,
  loading = false,
  orderAmount = 0,
}) {
  const [promoInput, setPromoInput] = useState(promoCode || '')
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState(discount > 0 ? 'Đã áp dụng thành công!' : '')
  const [applying, setApplying] = useState(false)
  const [activePromos, setActivePromos] = useState([])

  useEffect(() => {
    let cancelled = false
    promotionService.getActiveForUi()
      .then(list => {
        if (!cancelled) setActivePromos(Array.isArray(list) ? list.slice(0, 6) : [])
      })
      .catch(() => { if (!cancelled) setActivePromos([]) })
    return () => { cancelled = true }
  }, [])

  const handleApply = async () => {
    setPromoError('')
    setPromoSuccess('')
    if (!promoInput.trim()) {
      setPromoError('Vui lòng nhập mã giảm giá')
      return
    }

    setApplying(true)
    try {
      const result = await promotionService.validateForUi(promoInput, orderAmount)
      if (!result.success) {
        setPromoError(result.message || 'Mã giảm giá không chính xác hoặc đã hết hạn')
        return
      }

      // Parent onApplyPromo(code, val): val < 1 = percent ratio, val >= 1 = fixed VND
      let applyVal = 0
      if (result.discountPercent != null && Number(result.discountPercent) > 0) {
        applyVal = Number(result.discountPercent) / 100
      } else if (result.discountAmount != null && Number(result.discountAmount) > 0) {
        applyVal = Number(result.discountAmount)
      }

      const code = result.promotionCode || promoInput.trim().toUpperCase()
      onApplyPromo?.(code, applyVal)
      setPromoCode?.(code)
      setPromoSuccess(result.message || `Áp dụng thành công mã ${code}!`)
    } catch (err) {
      setPromoError(err?.response?.data?.message || 'Không thể xác thực mã giảm giá')
    } finally {
      setApplying(false)
    }
  }

  const handleRemovePromo = () => {
    onApplyPromo?.('', 0)
    setPromoCode?.('')
    setPromoInput('')
    setPromoSuccess('')
    setPromoError('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 w-full text-left"
    >
      {/* Combos selection section */}
      <div>
        <h3 className="text-lg font-black uppercase text-white tracking-wider mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Chọn Bắp & Nước
        </h3>
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-3xl text-red-500">progress_activity</span>
            </div>
          ) : combos.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">Hiện chưa có combo bắp nước.</p>
          ) : combos.map(combo => {
            const qty = selectedCombos[combo.id] || 0
            const hasImg = combo.img && (String(combo.img).startsWith('http') || String(combo.img).startsWith('/') || String(combo.img).startsWith('data:'))
            return (
              <div
                key={combo.id}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:border-white/20"
              >
                {hasImg ? (
                  <img
                    src={combo.img}
                    alt={combo.name}
                    className="w-20 h-20 rounded-xl object-cover border border-white/5 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-4xl flex-shrink-0 select-none">
                    {combo.img || '🍿'}
                  </div>
                )}
                <div className="flex-grow">
                  <h4 className="text-white font-bold text-base mb-1">{combo.name}</h4>
                  <p className="text-xs text-gray-400 mb-2 leading-relaxed">{combo.desc}</p>
                  {combo.category && (
                    <span className="inline-block text-[10px] uppercase tracking-wider text-gray-500 mb-1 mr-2">
                      {combo.category}
                    </span>
                  )}
                  <span className="text-red-500 font-extrabold text-sm">
                    {Number(combo.price).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Quantity counters */}
                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => onChangeCombo(combo.id, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border-none cursor-pointer"
                  >
                    <Minus size={14} />
                  </motion.button>
                  <span className="w-6 text-center text-white font-extrabold text-sm select-none">
                    {qty}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => onChangeCombo(combo.id, 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/5 hover:bg-white/10 border-none cursor-pointer"
                  >
                    <Plus size={14} />
                  </motion.button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Promos / Offers section */}
      <div className="border-t border-white/5 pt-6">
        <h3 className="text-lg font-black uppercase text-white tracking-wider mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Mã Ưu Đãi / Khuyến Mãi
        </h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-3 font-medium">Nhập mã ưu đãi hoặc thử mã mẫu bên dưới để nhận chiết khấu trực tiếp.</p>
          
          <div className="flex gap-3 mb-3">
            <div className="relative flex-grow">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Ví dụ: CINEMATE10, BAPNUOC20"
                disabled={discount > 0}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none focus:border-red-500/50 transition-colors uppercase tracking-wider font-semibold"
              />
            </div>
            {discount > 0 ? (
              <button
                onClick={handleRemovePromo}
                className="px-6 rounded-xl border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent"
              >
                Hủy mã
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-6 rounded-xl bg-red-600 text-white hover:bg-red-500 hover:scale-102 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer border-none disabled:opacity-60"
              >
                {applying ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            )}
          </div>

          {promoError && <p className="text-xs text-red-500 font-semibold m-0">{promoError}</p>}
          {promoSuccess && <p className="text-xs text-green-500 font-semibold m-0 flex items-center gap-1"><Check size={14} />{promoSuccess}</p>}

          {/* Quick suggestions from active promotions API */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black shrink-0">Mã gợi ý:</span>
            {activePromos.length === 0 ? (
              <span className="text-[10px] text-gray-500 italic">Chưa có mã khuyến mãi đang chạy</span>
            ) : activePromos.map(p => (
              <button
                key={p.id || p.code}
                onClick={() => { if (discount === 0 && p.code) setPromoInput(p.code) }}
                disabled={discount > 0 || !p.code}
                title={getQuickDiscountText(p) || p.title}
                className="text-[10px] font-bold border border-dashed border-white/20 bg-white/5 rounded-full px-3 py-1 text-gray-300 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {p.code}{getQuickDiscountText(p) ? ` (${getQuickDiscountText(p)})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  )
}
