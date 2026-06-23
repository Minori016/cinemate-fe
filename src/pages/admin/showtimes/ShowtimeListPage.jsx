import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Calendar, Clock, AlertTriangle, CheckCircle, X, ArrowLeft, RefreshCw } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAuth } from '../../../contexts/AuthContext'

// Fallback lists in case APIs are empty or offline
const FALLBACK_MOVIES = [
  { id: 'm1', titleVn: 'Lật Mặt 7: Một Điều Ước', durationMinutes: 138 },
  { id: 'm2', titleVn: 'Dune: Hành Tinh Cát - Phần 2', durationMinutes: 166 },
  { id: 'm3', titleVn: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc', durationMinutes: 96 },
  { id: 'm4', titleVn: 'Furiosa: Mad Max Saga', durationMinutes: 148 }
]

const FALLBACK_ROOMS = [
  { id: 'CR-01', name: 'Phòng chiếu 1 (Standard)' },
  { id: 'CR-02', name: 'Phòng chiếu 2 (3D)' },
  { id: 'CR-03', name: 'Phòng chiếu 3 (IMAX)' },
  { id: 'CR-04', name: 'Phòng chiếu 4 (Dolby Atmos)' }
]

const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

export default function ShowtimeListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user && user.roles?.includes('ADMIN')

  // States
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Filters state
  const [filterMovie, setFilterMovie] = useState('all')
  const [filterRoom, setFilterRoom] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  // Add Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form State
  const [form, setForm] = useState({
    movieId: '',
    roomId: '',
    date: '',
    time: '',
    price: 90000
  })
  const [validationError, setValidationError] = useState('')

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load Data
  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Showtimes
      const stList = await showtimeService.getAll()
      setShowtimes(stList)

      // 2. Fetch Movies
      try {
        const mRes = await movieService.getAll()
        const mList = mRes.data?.result?.content || mRes.data?.result || []
        setMovies(mList.length > 0 ? mList : FALLBACK_MOVIES)
      } catch (err) {
        setMovies(FALLBACK_MOVIES)
      }

      // 3. Fetch Rooms
      try {
        const rRes = await cinemaRoomService.getAll()
        const rList = rRes.data?.result || rRes.data || []
        setRooms(rList.length > 0 ? rList : FALLBACK_ROOMS)
      } catch (err) {
        setRooms(FALLBACK_ROOMS)
      }
    } catch (err) {
      console.error('Error loading showtimes data:', err)
      triggerToast('Không thể tải danh sách dữ liệu!', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  // Get selected movie info in form
  const selectedMovie = movies.find(m => m.id === form.movieId || String(m.id) === String(form.movieId))
  const duration = selectedMovie ? (selectedMovie.durationMinutes || 120) : 120

  // Calculate estimated end time
  const getEndTime = () => {
    if (!form.date || !form.time || !selectedMovie) return ''
    try {
      const startTime = new Date(`${form.date}T${form.time}:00`)
      if (isNaN(startTime.getTime())) return ''
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000)
      return endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  const handleOpenAddModal = () => {
    setValidationError('')
    setForm({
      movieId: movies[0]?.id || '',
      roomId: rooms[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      price: 90000
    })
    setModalOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setValidationError('')

    if (!form.movieId || !form.roomId || !form.date || !form.time || form.price < 30000) {
      setValidationError('Vui lòng điền đầy đủ thông tin và giá vé tối thiểu 30.000đ.')
      return
    }

    const movieObj = movies.find(m => m.id === form.movieId || String(m.id) === String(form.movieId))
    const roomObj = rooms.find(r => r.id === form.roomId || String(r.id) === String(form.roomId))

    const newStart = new Date(`${form.date}T${form.time}:00`)
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000)

    // Check conflict overlap (same room, same date)
    const hasConflict = showtimes.some(st => {
      // room and date must match
      if (st.room !== roomObj.name && st.roomId !== roomObj.id) return false
      if (st.date !== form.date) return false

      // parse existing start & end
      // existing duration fallback
      const existMovie = movies.find(m => m.titleVn === st.movie || m.id === st.movieId)
      const existDuration = existMovie ? (existMovie.durationMinutes || 120) : 120

      const existStart = new Date(`${st.date}T${st.time}:00`)
      const existEnd = new Date(existStart.getTime() + existDuration * 60 * 1000)

      // Overlap formula: StartA < EndB AND EndA > StartB
      return newStart < existEnd && newEnd > existStart
    })

    if (hasConflict) {
      setValidationError(`Xung đột lịch chiếu! Phòng chiếu này đã có phim chiếu khác trong khoảng thời gian từ ${form.time} đến ${getEndTime()} ngày ${form.date}.`)
      return
    }

    const payload = {
      movieId: form.movieId,
      movie: movieObj.titleVn,
      roomId: form.roomId,
      room: roomObj.name,
      date: form.date,
      time: form.time,
      price: Number(form.price)
    }

    try {
      const created = await showtimeService.create(payload)
      setShowtimes(prev => [created, ...prev])
      setModalOpen(false)
      triggerToast(`Đã lên lịch chiếu phim "${movieObj.titleVn}" thành công!`, 'success')
    } catch (err) {
      triggerToast('Thêm lịch chiếu thất bại!', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await showtimeService.delete(deleteTarget.id)
      setShowtimes(prev => prev.filter(st => st.id !== deleteTarget.id))
      triggerToast(`Đã xóa suất chiếu của phim "${deleteTarget.movie}"`, 'success')
    } catch (err) {
      triggerToast('Xóa lịch chiếu thất bại!', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  // Filter Showtimes
  const filteredShowtimes = showtimes.filter(st => {
    const matchMovie = filterMovie === 'all' || st.movie === filterMovie || st.movieId === filterMovie
    const matchRoom = filterRoom === 'all' || st.room === filterRoom || st.roomId === filterRoom
    const matchDate = !filterDate || st.date === filterDate
    return matchMovie && matchRoom && matchDate
  })

  // Access Denied Screen
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#06080F]">
        <span className="material-symbols-outlined text-red-500 text-6xl font-bold mb-4 animate-bounce">
          gpp_bad
        </span>
        <h2 className="text-2xl font-black uppercase text-white mb-2" style={{ fontFamily: 'Montserrat' }}>
          Quyền truy cập bị từ chối
        </h2>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          Chỉ có tài khoản Quản trị viên (Admin) mới có quyền truy cập và lập lịch chiếu phim.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
        >
          Quay lại trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-[#e2e2e2] text-left animate-fade-in relative">
      
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
          {toast.type === 'success' ? (
            <CheckCircle className="shrink-0" size={20} />
          ) : (
            <AlertTriangle className="shrink-0" size={20} />
          )}
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 
            className="text-4xl text-white font-black tracking-wider uppercase" 
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Quản lý lịch chiếu phim
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Xem danh sách lịch chiếu hiện tại và lập lịch chiếu thủ công cho các phòng chiếu trong rạp.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/10 active:scale-[0.98] transition-all flex items-center gap-2 uppercase tracking-wider shrink-0 border-none cursor-pointer"
        >
          <Plus size={16} />
          <span>Tạo lịch chiếu</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Movie Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Lọc theo phim</label>
            <select
              value={filterMovie}
              onChange={(e) => setFilterMovie(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả phim</option>
              {movies.map(m => (
                <option key={m.id} value={m.titleVn}>{m.titleVn}</option>
              ))}
            </select>
          </div>

          {/* Room Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Phòng chiếu</label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả phòng chiếu</option>
              {rooms.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Ngày chiếu</label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2.5 px-4 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs bg-transparent border-none outline-none"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Showtimes Table List */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl p-5">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-red-500">progress_activity</span>
          </div>
        ) : filteredShowtimes.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-2)]">
                <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="px-6 py-4 text-left">Phim / Movie</th>
                  <th className="px-6 py-4 text-left">Phòng chiếu</th>
                  <th className="px-6 py-4 text-left">Ngày chiếu</th>
                  <th className="px-6 py-4 text-left">Giờ bắt đầu</th>
                  <th className="px-6 py-4 text-left">Giờ kết thúc (Dự kiến)</th>
                  <th className="px-6 py-4 text-left">Giá vé cơ bản</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs">
                {filteredShowtimes.map((st) => {
                  const mObj = movies.find(m => m.titleVn === st.movie || m.id === st.movieId)
                  const dMin = mObj ? (mObj.durationMinutes || 120) : 120
                  
                  // Calculate end time
                  let endTimeStr = '--:--'
                  try {
                    const startT = new Date(`${st.date}T${st.time}:00`)
                    if (!isNaN(startT.getTime())) {
                      const endT = new Date(startT.getTime() + dMin * 60 * 1000)
                      endTimeStr = endT.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
                    }
                  } catch (e) {}

                  return (
                    <tr key={st.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="px-6 py-4 font-bold text-white max-w-xs truncate">{st.movie}</td>
                      <td className="px-6 py-4 text-gray-400 font-semibold">{st.room}</td>
                      <td className="px-6 py-4 font-medium text-gray-300">{st.date}</td>
                      <td className="px-6 py-4 font-bold text-red-500 flex items-center gap-1">
                        <Clock size={12} /> {st.time}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-400">{endTimeStr}</td>
                      <td className="px-6 py-4 font-extrabold font-mono text-green-400">{formatVND(st.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(st)}
                          className="p-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-500/10 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 font-semibold flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-4xl text-gray-600">calendar_today</span>
            <span className="text-sm">Không tìm thấy lịch chiếu nào phù hợp!</span>
          </div>
        )}
      </div>

      {/* Add Showtime Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handleCreate}
            className="bg-gradient-to-b from-[#161b2a] to-[#0f121f] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-sm">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <span className="p-1.5 rounded-lg bg-red-600/10 text-red-500">
                  <Calendar size={16} />
                </span>
                Lập lịch chiếu mới
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white bg-transparent border-none outline-none cursor-pointer flex transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              {validationError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl leading-normal flex items-start gap-2">
                  <AlertTriangle className="shrink-0 text-red-400 mt-0.5" size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Select Movie */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chọn phim chiếu</label>
                <select
                  value={form.movieId}
                  onChange={e => setForm({ ...form, movieId: e.target.value })}
                  className="bg-[#131725] border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-red-500 w-full font-medium cursor-pointer transition-colors"
                >
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.titleVn} ({m.durationMinutes || 120} phút)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Room */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chọn phòng chiếu</label>
                <select
                  value={form.roomId}
                  onChange={e => setForm({ ...form, roomId: e.target.value })}
                  className="bg-[#131725] border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-red-500 w-full font-medium cursor-pointer transition-colors"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Date and Time Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ngày chiếu</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500 w-full font-medium transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    required
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500 w-full font-medium transition-all"
                  />
                </div>
              </div>

              {/* Duration and End Time Preview */}
              {selectedMovie && form.date && form.time && (
                <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex flex-col gap-2 text-[10px] text-red-300 leading-normal">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Thời lượng phim:</span>
                    <span className="font-bold text-white text-xs">{duration} phút</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                    <span className="text-gray-400">Giờ kết thúc dự kiến:</span>
                    <span className="font-black text-red-400 text-sm flex items-center gap-1">
                      <Clock size={12} /> {getEndTime()}
                    </span>
                  </div>
                </div>
              )}

              {/* Base Ticket Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Giá vé cơ bản (VND)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 90000"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  required
                  min="30000"
                  step="5000"
                  className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 w-full placeholder-gray-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all cursor-pointer border-none"
              >
                Xác nhận lên lịch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa suất chiếu">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">
          Bạn có chắc muốn xóa suất chiếu phim <span className="text-white font-semibold">"{deleteTarget?.movie}"</span> lúc <span className="text-red-400 font-bold">{deleteTarget?.time}</span> ngày <span className="text-white font-semibold">{deleteTarget?.date}</span> tại <span className="text-white font-semibold">{deleteTarget?.room}</span>?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa lịch</Button>
        </div>
      </Modal>

    </div>
  )
}
