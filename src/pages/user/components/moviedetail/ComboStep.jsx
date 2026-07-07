import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Minus, Ticket, Check, RefreshCw } from 'lucide-react'

const COMBOS = [
  { id: 1, name: 'Combo Solo', desc: '1 bắp ngọt lớn 60oz + 1 nước ngọt mát lạnh 22oz', price: 75000, img: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=600' },
  { id: 2, name: 'Combo Couple', desc: '1 bắp ngọt lớn 60oz + 2 nước ngọt mát lạnh 22oz', price: 95000, img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600' },
  { id: 3, name: 'Combo Party', desc: '2 bắp lớn tự chọn vị + 4 nước ngọt mát lạnh 22oz', price: 165000, img: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=600' },
]

export default function ComboStep({
  combos = COMBOS,
  selectedCombos,
  onChangeCombo,
  promoCode,
  setPromoCode,
  discount,
  onApplyPromo,
  setBookingStep
}) {
  const [promoInput, setPromoInput] = useState(promoCode)
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState(discount > 0 ? 'Đã áp dụng thành công!' : '')

  const handleApply = () => {
    setPromoError('')
    setPromoSuccess('')
    if (!promoInput.trim()) {
      setPromoError('Vui lòng nhập mã giảm giá')
      return
    }

    // Custom coupon check
    const code = promoInput.trim().toUpperCase()
    if (code === 'CINEMATE10') {
      onApplyPromo(code, 0.10) // 10% discount
      setPromoSuccess('Áp dụng thành công mã CINEMATE10 (Giảm 10%)!')
      setPromoCode(code)
    } else if (code === 'BAPNUOC20') {
      onApplyPromo(code, 20000) // Flat 20K discount
      setPromoSuccess('Áp dụng thành công mã BAPNUOC20 (Giảm 20.000đ)!')
      setPromoCode(code)
    } else {
      setPromoError('Mã giảm giá không chính xác hoặc đã hết hạn')
    }
  }

  const handleRemovePromo = () => {
    onApplyPromo('', 0)
    setPromoCode('')
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
          {combos.map(combo => {
            const qty = selectedCombos[combo.id] || 0
            const hasImg = combo.img && (combo.img.startsWith('http') || combo.img.startsWith('/') || combo.img.startsWith('data:'))
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
                className="px-6 rounded-xl bg-red-600 text-white hover:bg-red-500 hover:scale-102 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer border-none"
              >
                Áp dụng
              </button>
            )}
          </div>

          {promoError && <p className="text-xs text-red-500 font-semibold m-0">{promoError}</p>}
          {promoSuccess && <p className="text-xs text-green-500 font-semibold m-0 flex items-center gap-1"><Check size={14} />{promoSuccess}</p>}

          {/* Quick suggestions tags */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black shrink-0">Mã gợi ý:</span>
            <button
              onClick={() => { if (discount === 0) { setPromoInput('CINEMATE10'); } }}
              disabled={discount > 0}
              className="text-[10px] font-bold border border-dashed border-white/20 bg-white/5 rounded-full px-3 py-1 text-gray-300 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CINEMATE10 (Giảm 10%)
            </button>
            <button
              onClick={() => { if (discount === 0) { setPromoInput('BAPNUOC20'); } }}
              disabled={discount > 0}
              className="text-[10px] font-bold border border-dashed border-white/20 bg-white/5 rounded-full px-3 py-1 text-gray-300 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              BAPNUOC20 (Giảm 20K)
            </button>
          </div>
        </div>
      </div>

      {/* Back & Proceed navigation buttons */}
      <div className="flex gap-4 border-t border-white/5 pt-6">
        <button
          onClick={() => setBookingStep(2)}
          className="flex-1 py-3.5 rounded-xl border border-white/10 bg-transparent text-white font-bold text-sm uppercase tracking-wider cursor-pointer transition-all hover:bg-white/5 active:scale-95"
        >
          Quay lại chọn ghế
        </button>
        <button
          onClick={() => setBookingStep(4)}
          className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-wider cursor-pointer border-none transition-all hover:scale-102 active:scale-95 shadow-[0_4px_14px_rgba(229,9,20,0.3)]"
        >
          Tiếp tục thanh toán
        </button>
      </div>
    </motion.div>
  )
}
