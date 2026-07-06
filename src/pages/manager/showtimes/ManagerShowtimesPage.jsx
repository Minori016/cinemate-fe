import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react'

// Mock Movie List for Scheduler Form
const AVAILABLE_MOVIES = [
  'Lật Mặt 7: Một Điều Ước',
  'Dune: Hành Tinh Cát - Phần 2',
  'Inside Out 2: Những Mảnh Ghép Cảm Xúc',
  'Furiosa: Mad Max Saga'
]

const AVAILABLE_ROOMS = [
  'Phòng chiếu 1 (Standard)',
  'Phòng chiếu 2 (3D)',
  'Phòng chiếu 3 (IMAX)',
  'Phòng chiếu 4 (Dolby Atmos)'
]

// Seed Showtime Data
const INITIAL_SHOWTIMES = [
  { id: 101, movie: 'Dune: Hành Tinh Cát - Phần 2', room: 'Phòng chiếu 3 (IMAX)', date: '2026-06-18', time: '18:30', price: 120000 },
  { id: 102, movie: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc', room: 'Phòng chiếu 2 (3D)', date: '2026-06-18', time: '17:00', price: 90000 },
  { id: 103, movie: 'Lật Mặt 7: Một Điều Ước', room: 'Phòng chiếu 1 (Standard)', date: '2026-06-18', time: '20:15', price: 110000 }
]

export default function ManagerShowtimesPage() {
  const [showtimes, setShowtimes] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    movie: AVAILABLE_MOVIES[0],
    room: AVAILABLE_ROOMS[0],
    date: '2026-06-18',
    time: '19:00',
    price: 90000
  })

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('manager_showtimes_db')
    setShowtimes(saved ? JSON.parse(saved) : INITIAL_SHOWTIMES)
  }, [])

  // Sync state back to localStorage
  const syncShowtimes = (newShowtimes) => {
    setShowtimes(newShowtimes)
    localStorage.setItem('manager_showtimes_db', JSON.stringify(newShowtimes))
  }

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreateShowtime = (e) => {
    e.preventDefault()
    if (!form.time || !form.date || form.price <= 0) {
      triggerToast('Vui lòng điền đầy đủ và đúng thông tin!', 'error')
      return
    }

    const newShow = {
      id: Date.now(),
      movie: form.movie,
      room: form.room,
      date: form.date,
      time: form.time,
      price: parseInt(form.price, 10)
    }

    const updated = [newShow, ...showtimes]
    syncShowtimes(updated)
    setModalOpen(false)
    triggerToast(`Đã lên lịch chiếu thành công phim: ${form.movie}`)
  }

  const handleDeleteShowtime = (id, movieTitle) => {
    const updated = showtimes.filter((st) => st.id !== id)
    syncShowtimes(updated)
    triggerToast(`Đã xóa suất chiếu của phim ${movieTitle}`)
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  return (
    <motion.div
      className="space-y-8 text-left"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(229,9,20,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(229,9,20,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#e50914' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="shrink-0" size={20} />
          ) : (
            <AlertCircle className="shrink-0" size={20} />
          )}
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Quản lý lịch chiếu phim
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Lập kế hoạch, lên lịch giờ chiếu cho các phim đang và sắp chiếu tại các phòng chiếu.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-[rgba(229,9,20,0.25)] text-sm border-none"
        >
          <Plus size={16} /> Lên lịch suất chiếu
        </button>
      </div>

      {/* Showtimes Table List */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              <th className="px-6 py-4">Phim / Movie</th>
              <th className="px-6 py-4">Phòng chiếu</th>
              <th className="px-6 py-4">Ngày chiếu</th>
              <th className="px-6 py-4">Giờ chiếu</th>
              <th className="px-6 py-4">Đơn giá vé</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {showtimes.length > 0 ? (
              showtimes.map((st) => (
                <tr key={st.id} className="hover:bg-white/2s transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-extrabold text-white">{st.movie}</p>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] font-semibold">{st.room}</td>
                  <td className="px-6 py-4 font-medium">{st.date}</td>
                  <td className="px-6 py-4 text-[var(--color-primary-container)] font-bold">{st.time}</td>
                  <td className="px-6 py-4 font-bold font-mono">{formatVND(st.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteShowtime(st.id, st.movie)}
                      className="text-red-400 hover:text-red-500 font-semibold transition-colors bg-transparent border-none cursor-pointer"
                    >
                      Xóa lịch
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-10 text-[var(--color-text-muted)] font-semibold">
                  Chưa có lịch chiếu nào được lên kế hoạch. Ấn "Lên lịch suất chiếu" để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Scheduler Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center bg-white/5">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white" style={{ fontFamily: 'Montserrat' }}>
                🗓️ Lên lịch suất chiếu mới
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-white bg-transparent border-none outline-none cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Chọn phim</label>
                <select
                  value={form.movie}
                  onChange={(e) => setForm({ ...form, movie: e.target.value })}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-red-500 cursor-pointer"
                >
                  {AVAILABLE_MOVIES.map((mv) => (
                    <option key={mv} value={mv}>{mv}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Phòng chiếu</label>
                <select
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-red-500 cursor-pointer"
                >
                  {AVAILABLE_ROOMS.map((rm) => (
                    <option key={rm} value={rm}>{rm}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Ngày chiếu</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-red-500 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Giờ chiếu</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-red-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Đơn giá vé (VND)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 120000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  min="30000"
                  step="5000"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-red-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all cursor-pointer border-none"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer border-none animate-pulse-once"
                >
                  Xác nhận lên lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
