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
  Coffee
} from 'lucide-react'
import { concessionService, groupConcessionsByBaseName, DEFAULT_COMBO_OPTIONS } from '../../../services/concessionService'

// Mock concession items
const CONCESSION_ITEMS = [
  { id: 'c1010101-1010-1010-1010-101010101010', name: 'Combo Solo', desc: '1 Bắp lớn 60oz + 1 Nước ngọt 22oz', price: 75000, category: 'combo', itemType: 'combo', image: '🎒', subItems: [
    { id: 'popcorn_1', name: 'Bắp Rang Lớn 60oz', type: 'popcorn', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.popcornFlavors, defaultFlavor: 'sweet', defaultSize: 'L' },
    { id: 'drink_1', name: 'Nước Ngọt 22oz', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'coca', defaultSize: 'L' }
  ] },
  { id: 'c2020202-2020-2020-2020-202020202020', name: 'Combo Couple', desc: '1 Bắp lớn 60oz + 2 Nước ngọt 22oz', price: 125000, category: 'combo', itemType: 'combo', image: '🧑‍🤝‍🧑', subItems: [
    { id: 'popcorn_1', name: 'Bắp Rang Lớn 60oz', type: 'popcorn', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.popcornFlavors, defaultFlavor: 'sweet', defaultSize: 'L' },
    { id: 'drink_1', name: 'Nước Ngọt Thứ 1 (22oz)', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'coca', defaultSize: 'L' },
    { id: 'drink_2', name: 'Nước Ngọt Thứ 2 (22oz)', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'sprite', defaultSize: 'L' }
  ] },
  { id: 'p101', name: 'Bắp rang bơ (S)', desc: 'Bắp rang bơ khẩu phần vừa', price: 55000, category: 'food', itemType: 'food', size: 'S', image: '🍿' },
  { id: 'p102', name: 'Bắp rang bơ (M)', desc: 'Bắp rang bơ khẩu phần lớn', price: 65000, category: 'food', itemType: 'food', size: 'M', image: '🍿' },
  { id: 'p103', name: 'Bắp rang bơ (L)', desc: 'Bắp rang bơ khẩu phần đặc biệt', price: 75000, category: 'food', itemType: 'food', size: 'L', image: '🍿' },
  { id: 'd101', name: 'Nước ngọt Coca-Cola (M)', desc: 'Ly vừa 22oz lạnh', price: 30000, category: 'drink', itemType: 'drink', size: 'M', image: '🥤' },
  { id: 'd102', name: 'Nước ngọt Coca-Cola (L)', desc: 'Ly lớn 32oz lạnh', price: 38000, category: 'drink', itemType: 'drink', size: 'L', image: '🥤' },
  { id: 'd201', name: 'Nước ngọt Sprite (M)', desc: 'Ly vừa 22oz lạnh', price: 30000, category: 'drink', itemType: 'drink', size: 'M', image: '🥤' },
  { id: 'd202', name: 'Nước ngọt Sprite (L)', desc: 'Ly lớn 32oz lạnh', price: 38000, category: 'drink', itemType: 'drink', size: 'L', image: '🥤' },
]

export default function StaffConcessionsPage() {
  const [revenue, setRevenue] = useState(0)
  const [cart, setCart] = useState([])
  const [concessionItems, setConcessionItems] = useState(CONCESSION_ITEMS)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [toast, setToast] = useState(null)

  // Track size selection per product family: { [groupId]: sizeKey }
  const [selectedSizesMap, setSelectedSizesMap] = useState({})
  
  // Track expanded combo accordion state: { [comboId]: boolean }
  const [expandedCombos, setExpandedCombos] = useState({})

  // Track sub-item flavor/type selection: { [comboId]: { [subItemId]: { flavor, size } } }
  const [comboCustomizations, setComboCustomizations] = useState({})

  // Tải danh sách sản phẩm & combo khả dụng từ Backend API cho Nhân viên tại quầy
  useEffect(() => {
    concessionService.getActive()
      .then(res => {
        const rawData = res.data?.result || res.data || []
        const list = Array.isArray(rawData) ? rawData : []
        if (list.length > 0) {
          const mapped = list.map(item => {
            let type = String(item.itemType || item.category || 'food').toLowerCase()
            if (type === 'beverage') type = 'drink'
            const itemId = item.id || item.uuid || item.productUuid || item.comboUuid
            const hasHttpImg = item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') || item.imageUrl.startsWith('data:'))
            return {
              id: itemId,
              uuid: itemId,
              name: item.name,
              desc: item.description || item.desc || '',
              price: Number(item.price) || 0,
              category: type,
              itemType: type,
              size: item.size || null,
              image: hasHttpImg ? item.imageUrl : (item.imageUrl || '🍿'),
              imageUrl: item.imageUrl || ''
            }
          })
          setConcessionItems(mapped)
        }
      })
      .catch(err => console.error('Lỗi tải bắp nước phía Staff:', err))
  }, [])

  // Consolidate raw concession items into single product cards per base product
  const groupedProducts = useMemo(() => {
    return groupConcessionsByBaseName(concessionItems)
  }, [concessionItems])

  // Load revenue from localStorage on mount
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

  // Add to Cart Logic with variant/size & combo options
  const addToCart = (productGroup) => {
    const isCombo = productGroup.itemType === 'combo'
    const currentSizeKey = selectedSizesMap[productGroup.id] || productGroup.sizes?.[0]?.key || 'STANDARD'
    const currentSizeObj = productGroup.sizes?.find(s => s.key === currentSizeKey) || productGroup.sizes?.[0]
    const variantId = currentSizeObj?.variantId || productGroup.id
    const price = currentSizeObj?.price || productGroup.price

    // Build custom details label for combos
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

  // Edit quantity in cart
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

  // Remove from cart
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  // Calculate Cart metrics
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Handle Checkout / Invoice Creation
  const handleCheckout = () => {
    if (cart.length === 0) return

    const timeNow = new Date()
    const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000)
    const formattedDate = `${String(timeNow.getDate()).padStart(2, '0')}/${String(timeNow.getMonth() + 1).padStart(2, '0')}/${timeNow.getFullYear()} ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`

    const invoice = {
      txId,
      date: formattedDate,
      items: [...cart],
      total: cartTotal,
      paymentMethod
    }

    syncRevenue(revenue + cartTotal)
    setCart([])
    setActiveReceipt(invoice)
    triggerToast('Thanh toán thành công! Đã tạo hóa đơn.')
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  return (
    <div className="space-y-8 text-left">
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          <CheckCircle className="shrink-0" size={20} />
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Quầy Bán Bắp Nước
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Lập đơn hàng nhanh chóng, chọn size bắp nước và tùy chỉnh vị cho khách hàng trực tiếp tại quầy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT / CENTER: Products Catalog */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories Filters */}
          <div className="flex gap-2.5 pb-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Tất cả sản phẩm', icon: ChefHat },
              { id: 'popcorn', label: 'Bắp rang', icon: ChefHat },
              { id: 'food', label: 'Đồ ăn khác', icon: ChefHat },
              { id: 'drink', label: 'Thức uống', icon: ChefHat },
              { id: 'combo', label: 'Combo ưu đãi', icon: ChefHat }
            ].map(f => {
              const active = selectedFilter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider shrink-0 transition-all border ${
                    active
                      ? 'bg-[var(--color-primary-container)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-gray-700 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {filteredItems.map((prod) => {
              const isCombo = prod.itemType === 'combo'
              const currentSizeKey = selectedSizesMap[prod.id] || prod.sizes?.[0]?.key || 'STANDARD'
              const currentSizeObj = prod.sizes?.find(s => s.key === currentSizeKey) || prod.sizes?.[0]
              const activePrice = currentSizeObj?.price || prod.price
              const isExpanded = !!expandedCombos[prod.id]

              return (
                <div
                  key={prod.id}
                  className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-red-500/30 transition-all duration-200 flex flex-col gap-3 shadow-md group relative overflow-hidden"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-14 h-14 rounded-xl bg-color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent) flex items-center justify-center text-3xl select-none shrink-0 group-hover:scale-105 transition-transform duration-200">
                      {prod.img || (isCombo ? '🎒' : '🍿')}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{prod.name}</h4>
                          {isCombo && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              Combo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">{prod.desc}</p>
                      </div>

                      {/* Size pills for multi-size product */}
                      {!isCombo && prod.sizes && prod.sizes.length > 1 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] text-gray-400 font-bold">Size:</span>
                          {prod.sizes.map(s => {
                            const isSelected = s.key === currentSizeKey
                            return (
                              <button
                                key={s.key}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedSizesMap(prev => ({ ...prev, [prod.id]: s.key })) }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-red-500/20 text-red-400 border-red-500'
                                    : 'bg-[var(--color-surface-2)] text-gray-400 border-[var(--color-border)] hover:text-white'
                                }`}
                              >
                                {s.label} ({formatVND(s.price)})
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm font-bold text-[var(--color-primary-container)]">
                          {formatVND(activePrice)}
                        </span>

                        <div className="flex items-center gap-2">
                          {isCombo && (
                            <button
                              type="button"
                              onClick={() => toggleExpandCombo(prod.id)}
                              className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-500/20 cursor-pointer"
                            >
                              <Sparkles size={10} />
                              {isExpanded ? 'Ẩn vị' : 'Chọn vị'}
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => addToCart(prod)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={14} /> Thêm món
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Combo Sub-Items Detail Accordion */}
                  {isCombo && isExpanded && (
                    <div className="border-t border-white/10 pt-3 mt-1 space-y-2 bg-black/20 p-3 rounded-xl">
                      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                        <Coffee size={12} className="text-yellow-400" /> Tùy chọn khẩu phần & vị cho từng món:
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        {(prod.subItems || []).map((subItem) => {
                          const customState = comboCustomizations[prod.id]?.[subItem.id] || {}
                          const selectedFlavor = customState.flavor || subItem.defaultFlavor || 'sweet'

                          return (
                            <div key={subItem.id} className="bg-white/5 p-2 rounded-lg border border-white/10 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-white shrink-0">{subItem.name}:</span>
                              {subItem.flavors && subItem.flavors.length > 0 && (
                                <select
                                  value={selectedFlavor}
                                  onChange={(e) => handleSubItemOptionChange(prod.id, subItem.id, 'flavor', e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded py-0.5 px-2 text-[10px] text-white outline-none focus:border-red-500"
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
        </div>

        {/* RIGHT: Cart Drawer */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-xl space-y-6 flex flex-col h-[520px] justify-between">
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                🛒 Đơn hàng ({cartItemsCount})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-[var(--color-text-muted)] hover:text-red-400 font-semibold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length > 0 ? (
              <div className="space-y-3.5">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 justify-between items-start border-b border-white/5 pb-3 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate" title={item.name}>{item.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{formatVND(item.price)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Qty Selector */}
                      <div className="flex items-center bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-white text-[var(--color-text-muted)]"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-bold text-white min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-white text-[var(--color-text-muted)]"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:text-red-400 text-gray-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-gray-700" style={{ fontSize: '40px' }}>
                  shopping_cart
                </span>
                <p className="text-xs mt-3">Chọn các sản phẩm bên trái để bắt đầu lập hóa đơn thanh toán.</p>
              </div>
            )}
          </div>

          {/* Cart Pricing and Checkout Actions */}
          <div className="border-t border-[var(--color-border)] pt-4 space-y-4 shrink-0 bg-[var(--color-surface)]">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-[var(--color-text-muted)] font-semibold">TỔNG HÓA ĐƠN</span>
              <span className="text-xl font-extrabold text-[var(--color-primary-container)]" style={{ fontFamily: 'Montserrat' }}>
                {formatVND(cartTotal)}
              </span>
            </div>

            {/* Payment Method Option */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Phương thức thanh toán</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-red-500/10 text-white border-red-500'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-transparent hover:border-gray-700'
                  }`}
                >
                  💵 Tiền mặt
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-red-500/10 text-white border-red-500'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-transparent hover:border-gray-700'
                  }`}
                >
                  💳 QR / Ví ĐT
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-red-700 disabled:bg-slate-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[rgba(229,9,20,0.2)]"
            >
              <CreditCard size={16} />
              Thanh toán & Xuất hóa đơn
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-[var(--color-border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            {/* Success Banner */}
            <div className="bg-emerald-500 py-6 text-center text-white space-y-1.5">
              <CheckCircle size={40} className="mx-auto" />
              <h4 className="font-extrabold uppercase tracking-wider text-base" style={{ fontFamily: 'Montserrat' }}>
                Thanh toán thành công
              </h4>
              <p className="text-[11px] text-emerald-100 font-medium">Hóa đơn bán bắp nước tại quầy</p>
            </div>

            {/* Receipt Details */}
            <div className="p-6 space-y-6 flex-1 text-xs text-[var(--color-text-muted)] font-medium">
              <div className="flex justify-between">
                <span>Số hóa đơn (TXID):</span>
                <span className="text-white font-bold">{activeReceipt.txId}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span>Thời gian giao dịch:</span>
                <span className="text-white font-semibold">{activeReceipt.date}</span>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Chi tiết hóa đơn</p>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {activeReceipt.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-baseline">
                      <span className="text-white leading-relaxed truncate max-w-[180px]">{item.name} <span className="text-gray-500 font-normal">x{item.quantity}</span></span>
                      <span className="text-white font-semibold font-mono">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing summary */}
              <div className="border-t border-dashed border-[var(--color-border)] pt-4 space-y-3">
                <div className="flex justify-between">
                  <span>Phương thức:</span>
                  <span className="text-white font-semibold">{activeReceipt.paymentMethod === 'cash' ? '💵 Tiền mặt' : '💳 Chuyển khoản / Ví'}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm font-bold pt-1">
                  <span className="text-white">Tổng cộng:</span>
                  <span className="text-xl text-[var(--color-primary-container)] font-extrabold" style={{ fontFamily: 'Montserrat' }}>
                    {formatVND(activeReceipt.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[var(--color-border)] bg-slate-900/40 flex gap-2">
              <button
                onClick={() => {
                  triggerToast('Đang mô phỏng in hóa đơn giấy...')
                }}
                className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all"
              >
                🖨️ In hóa đơn
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
