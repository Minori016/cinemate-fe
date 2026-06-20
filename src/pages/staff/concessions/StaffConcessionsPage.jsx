import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CheckCircle,
  X,
  CreditCard,
  ChefHat
} from 'lucide-react'

// Mock concession items
const CONCESSION_ITEMS = [
  { id: 'p1', name: 'Bắp rang Single', desc: '1 Bắp lớn (Ngọt/Mặn)', price: 65000, category: 'food', image: '🍿' },
  { id: 'p2', name: 'Bắp rang Double', desc: '1 Bắp lớn vị tự chọn (Phô mai/Caramel)', price: 75000, category: 'food', image: '🍿' },
  { id: 'd1', name: 'Nước ngọt Coca-Cola', desc: 'Ly lớn 32oz lạnh', price: 35000, category: 'drink', image: '🥤' },
  { id: 'd2', name: 'Nước ngọt Sprite', desc: 'Ly lớn 32oz lạnh', price: 35000, category: 'drink', image: '🥤' },
  { id: 'c1', name: 'Combo Solo', desc: '1 Bắp lớn + 1 Nước ngọt tùy chọn', price: 90000, category: 'combo', image: '🎒' },
  { id: 'c2', name: 'Combo Couple', desc: '1 Bắp lớn + 2 Nước ngọt tùy chọn', price: 125000, category: 'combo', image: '🧑‍🤝‍🧑' },
  { id: 'c3', name: 'Combo Party VIP', desc: '2 Bắp lớn + 3 Nước ngọt + 1 Khoai tây chiên', price: 210000, category: 'combo', image: '🎉' }
]

export default function StaffConcessionsPage() {
  const [revenue, setRevenue] = useState(0)
  const [cart, setCart] = useState([])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [toast, setToast] = useState(null)

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

  const filteredItems = selectedFilter === 'all'
    ? CONCESSION_ITEMS
    : CONCESSION_ITEMS.filter(item => item.category === selectedFilter)

  // Add to Cart Logic
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id)
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
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

    // Generate transaction details
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

    // Update revenue state and persist
    syncRevenue(revenue + cartTotal)

    // Clear cart & trigger receipt modal
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
          Lập đơn hàng nhanh chóng, bán bỏng ngô, nước giải khát cho khách hàng trực tiếp tại quầy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT / CENTER: Products Catalog */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories Filters */}
          <div className="flex gap-2.5 pb-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Tất cả sản phẩm', icon: ChefHat },
              { id: 'food', label: 'Bắp rang', icon: ChefHat },
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
            {filteredItems.map((prod) => (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-red-500/30 transition-all duration-200 cursor-pointer flex gap-4 shadow-md group relative overflow-hidden active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-xl bg-color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent) flex items-center justify-center text-3xl select-none shrink-0 group-hover:scale-105 transition-transform duration-200">
                  {prod.image}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{prod.name}</h4>
                    <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">{prod.desc}</p>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-bold text-[var(--color-primary-container)]">
                      {formatVND(prod.price)}
                    </span>
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-white border border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
