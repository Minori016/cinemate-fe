import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CheckCircle,
  X,
  CreditCard,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Coffee,
  ShoppingBag,
  Printer,
  RotateCcw,
  Coins,
  QrCode,
  Landmark
} from 'lucide-react'
import { concessionService, groupConcessionsByBaseName, FALLBACK_COMBOS } from '../../../services/concessionService'
import { bookingService } from '../../../services/bookingService'
import { paymentService } from '../../../services/paymentService'

export default function StaffConcessionsPage() {
  const [revenue, setRevenue] = useState(0)
  const [cart, setCart] = useState([])
  const [concessionItems, setConcessionItems] = useState([])
  const [loadingCombos, setLoadingCombos] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash') // 'cash' | 'card' | 'momo' | 'vnpay'
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Track size selection per product family: { [groupId]: sizeKey }
  const [selectedSizesMap, setSelectedSizesMap] = useState({})

  // Track expanded combo accordion state: { [comboId]: boolean }
  const [expandedCombos, setExpandedCombos] = useState({})

  // Track sub-item flavor/type selection: { [comboId]: { [subItemId]: { flavor, size } } }
  const [comboCustomizations, setComboCustomizations] = useState({})

  // 🟢 TẢI DANH SÁCH SẢN PHẨM & COMBO KHẢ DỤNG TỪ BACKEND API
  useEffect(() => {
    let cancelled = false
    setLoadingCombos(true)
    concessionService.getActiveForUi({ fallback: true })
      .then(list => {
        if (cancelled) return
        const rawList = Array.isArray(list) && list.length > 0 ? list : FALLBACK_COMBOS
        setConcessionItems(rawList)

        // Khởi tạo size mặc định cho sản phẩm
        const initSizes = {}
        rawList.forEach(item => {
          const itemId = item.id || item.uuid
          if (item.sizes && item.sizes.length > 0) {
            initSizes[itemId] = item.sizes[0].key
          }
        })
        setSelectedSizesMap(initSizes)
      })
      .catch(err => console.error('Lỗi tải bắp nước phía Staff:', err))
      .finally(() => {
        if (!cancelled) setLoadingCombos(false)
      })
    return () => { cancelled = true }
  }, [])

  // 🟢 KIỂM TRA & TỰ ĐỘNG MỞ HÓA ĐƠN NẾU QUAY VỀ TỪ MOMO / VNPAY THANH TOÁN THÀNH CÔNG
  useEffect(() => {
    const pendingReceiptStr = sessionStorage.getItem('pending_pos_receipt')
    if (pendingReceiptStr) {
      try {
        const pendingReceipt = JSON.parse(pendingReceiptStr)
        setActiveReceipt(pendingReceipt)
        sessionStorage.removeItem('pending_pos_receipt')
        triggerToast('Thanh toán MoMo/VNPay thành công! Đã tạo hóa đơn bắp nước.')
      } catch (e) {
        console.warn('Lỗi đọc hóa đơn chờ từ SessionStorage:', e)
      }
    }
  }, [])

  // Gom nhóm các món theo tên sản phẩm gốc (Bắp / Nước / Combo)
  const groupedProducts = useMemo(() => {
    return groupConcessionsByBaseName(concessionItems)
  }, [concessionItems])

  // Tải doanh thu từ LocalStorage
  useEffect(() => {
    const savedRevenue = localStorage.getItem('staff_revenue')
    setRevenue(savedRevenue ? parseInt(savedRevenue, 10) : 3450000)
  }, [])

  const syncRevenue = (newRevenue) => {
    setRevenue(newRevenue)
    localStorage.setItem('staff_revenue', newRevenue.toString())
  }

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const toggleExpandCombo = (comboId) => {
    setExpandedCombos(prev => ({ ...prev, [comboId]: !prev[comboId] }))
  }

  const handleSubItemOptionChange = (comboId, subItemId, key, value) => {
    setComboCustomizations(prev => ({
      ...prev,
      [comboId]: {
        ...(prev[comboId] || {}),
        [subItemId]: {
          ...(prev[comboId]?.[subItemId] || {}),
          [key]: value
        }
      }
    }))
  }

  const filteredItems = selectedFilter === 'all'
    ? groupedProducts
    : groupedProducts.filter(item => item.category === selectedFilter)

  // Logic Thêm món vào Giỏ hàng
  const addToCart = (productGroup) => {
    const isCombo = productGroup.itemType === 'combo'
    const currentSizeKey = selectedSizesMap[productGroup.id] || productGroup.sizes?.[0]?.key || 'STANDARD'
    const currentSizeObj = productGroup.sizes?.find(s => s.key === currentSizeKey) || productGroup.sizes?.[0]
    const variantId = currentSizeObj?.variantId || productGroup.id
    const price = currentSizeObj?.price || productGroup.price

    let detailsLabel = ''
    if (isCombo && productGroup.subItems) {
      const opts = comboCustomizations[productGroup.id] || {}
      const detailsList = productGroup.subItems.map(sub => {
        const fKey = opts[sub.id]?.flavor || sub.defaultFlavor || 'sweet'
        const fObj = (sub.flavors || []).find(f => f.id === fKey)
        return fObj ? fObj.label.replace(/\s*\(\+.*\)/, '') : sub.name
      })
      if (detailsList.length > 0) {
        detailsLabel = ` (${detailsList.join(', ')})`
      }
    } else if (productGroup.sizes && productGroup.sizes.length > 1) {
      detailsLabel = ` (${currentSizeObj?.label || currentSizeKey})`
    }

    const cartItemId = `${variantId}${detailsLabel ? '_' + detailsLabel : ''}`
    const displayName = `${productGroup.name}${detailsLabel}`

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === cartItemId)
      if (existing) {
        return prevCart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, {
        id: cartItemId,
        variantId: variantId,
        name: displayName,
        price: price,
        quantity: 1,
        image: productGroup.img
      }]
    })
    triggerToast(`Đã thêm ${displayName} vào đơn hàng!`)
  }

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // 🟢 HÀM XỬ LÝ THANH TOÁN & XUẤT HÓA ĐƠN
  const handleCheckout = async () => {
    if (cart.length === 0 || submitting) return

    setSubmitting(true)
    try {
      // Chuẩn hóa danh sách món
      const concessionsPayload = cart.map(item => {
        const rawId = item.variantId || item.id
        const cleanUuid = String(rawId).split('_')[0]
        return {
          concessionId: cleanUuid,
          quantity: Number(item.quantity) || 1
        }
      }).filter(c => c.concessionId && c.quantity > 0)

      // Gọi API holdSeats với seatIds rỗng
      const holdRes = await bookingService.holdSeats({
        showtimeId: null,
        seatIds: [],
        concessions: concessionsPayload
      })

      const bookingData = holdRes?.data?.result || holdRes?.data
      const bookingId = bookingData?.bookingId || bookingData?.id

      if (!bookingId) {
        throw new Error('Máy chủ không khởi tạo được đơn hàng bắp nước.')
      }

      const timeNow = new Date()
      const formattedDate = `${String(timeNow.getDate()).padStart(2, '0')}/${String(timeNow.getMonth() + 1).padStart(2, '0')}/${timeNow.getFullYear()} ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`

      const methodLabels = {
        cash: 'Tiền mặt',
        card: 'Thẻ ngân hàng (POS)',
        momo: 'Ví MoMo',
        vnpay: 'VNPay'
      }

      const invoice = {
        txId: bookingId,
        date: formattedDate,
        items: [...cart],
        total: cartTotal,
        paymentMethod: methodLabels[paymentMethod] || 'Tiền mặt'
      }

      // Xử lý thanh toán Tiền mặt / Cà thẻ POS
      if (paymentMethod === 'cash' || paymentMethod === 'card') {
        await bookingService.confirm(bookingId)

        setCart([])
        setActiveReceipt(invoice)
        triggerToast('Thanh toán thành công!')
        return
      }

      // Xử lý thanh toán Online (MoMo / VNPay): Lưu tạm thông tin Hóa đơn trước khi điều hướng sang MoMo/VNPay
      sessionStorage.setItem('pending_pos_receipt', JSON.stringify(invoice))

      let payRes
      if (paymentMethod === 'momo') {
        payRes = await paymentService.createMomoPayment(bookingId)
      } else {
        payRes = await paymentService.createVnPayPayment(bookingId)
      }

      const payUrl = payRes?.data?.result?.payUrl || payRes?.data?.payUrl || payRes?.data

      if (payUrl) {
        window.location.href = payUrl
      } else {
        sessionStorage.removeItem('pending_pos_receipt')
        throw new Error('Không lấy được link thanh toán MoMo/VNPay.')
      }

    } catch (err) {
      console.error('Lỗi thanh toán bắp nước:', err)
      triggerToast(err.response?.data?.message || err.message || 'Lỗi xử lý giao dịch.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' đ'

  return (
    <div className="space-y-6 text-left min-h-screen text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-xs max-w-sm transition-all duration-300"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          <CheckCircle className="shrink-0" size={18} />
          <span className="font-bold">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80 border-none bg-transparent cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Page */}
      <div className="pb-4 border-b border-[var(--color-border)]">
        <h2 className="text-3xl font-black tracking-tight uppercase text-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Quầy Bán Bắp Nước POS
        </h2>
        <p className="text-sm text-slate-600 font-medium mt-1">
          Giao diện lập hóa đơn và chọn bắp nước dành riêng cho nhân viên tại quầy rạp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* CỘT TRÁI: DANH MỤC BẮP NƯỚC (8 COLS) */}
        <div className="lg:col-span-8 bg-[#0a0b0e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

          {/* Bộ lọc danh mục */}
          <div className="flex gap-2.5 pb-2 overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: 'TẤT CẢ SẢN PHẨM' },
              { id: 'popcorn', label: 'BẮP RANG' },
              { id: 'drink', label: 'THỨC UỐNG' },
              { id: 'combo', label: 'COMBO ƯU ĐÃI' }
            ].map(f => {
              const active = selectedFilter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${active
                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'bg-[#121620] border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Danh sách Sản Phẩm */}
          {loadingCombos ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <span className="material-symbols-outlined animate-spin text-3xl text-red-500 block mb-2">sync</span>
              Đang tải danh sách bắp nước từ hệ thống...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl text-xs">
              Không có sản phẩm bắp nước nào trong danh mục này.
            </div>
          ) : (
            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredItems.map((prod) => {
                const isCombo = prod.itemType === 'combo'
                const currentSizeKey = selectedSizesMap[prod.id] || prod.sizes?.[0]?.key || 'STANDARD'
                const currentSizeObj = prod.sizes?.find(s => s.key === currentSizeKey) || prod.sizes?.[0]
                const activePrice = currentSizeObj?.price || prod.price
                const isExpanded = !!expandedCombos[prod.id]

                return (
                  <div
                    key={prod.id}
                    className="bg-[#121620] border border-white/5 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-3xl">
                          {prod.img && typeof prod.img === 'string' && prod.img.startsWith('http') ? (
                            <img src={prod.img} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            prod.img || (isCombo ? '🎒' : '🍿')
                          )}
                        </div>

                        <div className="space-y-1 text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white tracking-wide truncate">{prod.name}</h4>
                            {isCombo && (
                              <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                                COMBO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{prod.desc || prod.description}</p>

                          {/* Chọn Size trên Card */}
                          {!isCombo && prod.sizes && prod.sizes.length > 1 && (
                            <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SIZE:</span>
                              {prod.sizes.map(s => {
                                const isSelected = s.key === currentSizeKey
                                return (
                                  <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => setSelectedSizesMap(prev => ({ ...prev, [prod.id]: s.key }))}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${isSelected
                                      ? 'bg-red-600 border-red-500 text-white shadow-md'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                      }`}
                                  >
                                    {s.label} ({formatVND(s.price)})
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          <span className="text-sm font-black text-red-500 block pt-1 font-mono">{formatVND(activePrice)}</span>
                        </div>
                      </div>

                      {/* Thao tác Thêm món */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isCombo && (
                          <button
                            type="button"
                            onClick={() => toggleExpandCombo(prod.id)}
                            className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-amber-500/20 transition-all cursor-pointer"
                          >
                            <Sparkles size={13} />
                            <span>{isExpanded ? 'Ẩn vị' : 'Chọn vị'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => addToCart(prod)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 border-none"
                        >
                          <Plus size={15} /> Thêm món
                        </button>
                      </div>
                    </div>

                    {/* Accordion chọn vị Combo */}
                    {isCombo && isExpanded && (
                      <div className="border-t border-white/10 pt-3 mt-3 space-y-2 bg-black/40 p-3.5 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <Coffee size={13} className="text-amber-400" /> Tùy chọn hương vị chi tiết:
                        </p>

                        <div className="grid grid-cols-1 gap-2">
                          {(prod.subItems || []).map((subItem) => {
                            const customState = comboCustomizations[prod.id]?.[subItem.id] || {}
                            const selectedFlavor = customState.flavor || subItem.defaultFlavor || 'sweet'

                            return (
                              <div key={subItem.id} className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-white">{subItem.name}:</span>
                                {subItem.flavors && subItem.flavors.length > 0 && (
                                  <select
                                    value={selectedFlavor}
                                    onChange={(e) => handleSubItemOptionChange(prod.id, subItem.id, 'flavor', e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2.5 text-xs text-white outline-none focus:border-red-500 cursor-pointer"
                                  >
                                    {subItem.flavors.map(f => (
                                      <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                                        {f.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: TÓM TẮT GIỎ HÀNG & THANH TOÁN (4 COLS) */}
        <div className="lg:col-span-4 bg-[#0a0b0e] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-[640px]">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-white uppercase tracking-wider text-sm flex items-center gap-2 font-mono">
                <ShoppingBag size={18} className="text-red-500" />
                ĐƠN HÀNG ({cartItemsCount})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-slate-400 hover:text-red-400 font-bold border-none bg-transparent cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Danh sách món trong giỏ */}
            {cart.length > 0 ? (
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="bg-[#121620] p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 text-left space-y-0.5">
                      <p className="font-bold text-white text-xs truncate" title={item.name}>{item.name}</p>
                      <p className="text-[11px] text-red-500 font-mono font-bold">{formatVND(item.price)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-black text-white font-mono min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:text-red-400 text-slate-500 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 text-slate-500 space-y-2">
                <span className="material-symbols-outlined text-5xl text-slate-700 block">shopping_cart</span>
                <p className="text-xs font-semibold">Chọn sản phẩm bên trái để lập hóa đơn.</p>
              </div>
            )}
          </div>

          {/* Chọn hình thức thanh toán & Nút bấm */}
          <div className="border-t border-white/10 pt-4 space-y-4 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TỔNG HÓA ĐƠN</span>
              <span className="text-2xl font-black text-red-500 font-mono">
                {formatVND(cartTotal)}
              </span>
            </div>

            {/* CỔNG THANH TOÁN QUẦY POS */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phương thức thanh toán</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {[
                  { id: 'cash', label: 'Tiền mặt', icon: Coins },
                  { id: 'card', label: 'Cà thẻ', icon: CreditCard },
                  { id: 'momo', label: 'Ví MoMo', icon: QrCode },
                  { id: 'vnpay', label: 'VNPay', icon: Landmark }
                ].map((method) => {
                  const Icon = method.icon
                  const isSelected = paymentMethod === method.id
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-2 px-1.5 rounded-xl font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${isSelected
                        ? 'bg-red-600/20 text-white border-red-500 shadow-md'
                        : 'bg-[#121620] text-slate-400 border-white/5 hover:bg-white/5'
                        }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-red-500' : 'text-slate-400'} />
                      <span className="font-mono text-[10px] uppercase tracking-wider">{method.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>ĐANG XỬ LÝ...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Thanh toán &amp; Xuất hóa đơn</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* POPUP HÓA ĐƠN IN VÉ QUẦY */}
      {activeReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl max-w-md w-full text-slate-800 text-left relative overflow-hidden">
            <div className="flex flex-col items-center border-b-2 border-dashed border-slate-200 pb-6 text-center space-y-2.5">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                XUẤT HÓA ĐƠN THÀNH CÔNG
              </span>

              <h4 className="text-2xl font-black tracking-widest text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                CINE<span className="text-red-600">MATE</span>
              </h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                HÓA ĐƠN BÁN BẮP NƯỚC TẠI QUẦY<br />
                Mã giao dịch: <span className="font-mono text-slate-700 font-bold">{activeReceipt.txId}</span>
              </p>
            </div>

            <div className="py-6 space-y-4 text-xs font-semibold text-slate-600">
              <div className="flex justify-between text-slate-500">
                <span>Thời gian lập:</span>
                <span className="font-bold text-slate-800">{activeReceipt.date}</span>
              </div>

              <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Chi tiết sản phẩm</span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {activeReceipt.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-bold truncate max-w-[200px]">
                        {item.name} <span className="text-red-600 font-black">(x{item.quantity})</span>
                      </span>
                      <span className="font-mono text-slate-900 font-extrabold">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Hình thức thanh toán:</span>
                  <span className="font-bold text-slate-800">{activeReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 pt-3 border-t border-slate-100">
                  <span className="font-bold text-xs uppercase tracking-wider">TỔNG TIỀN THANH TOÁN:</span>
                  <span className="font-black text-red-600 text-lg font-mono">{formatVND(activeReceipt.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1.5">
              <div className="w-full h-10 border-2 border-slate-900 border-dashed flex items-center justify-center text-xs font-black tracking-[0.3em] text-slate-800 select-none bg-white rounded-lg">
                * {activeReceipt.txId} *
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hóa đơn kèm theo đơn dịch vụ rạp</p>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Printer size={16} />
                <span>In hóa đơn</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <RotateCcw size={16} />
                <span>Đóng cửa sổ</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}