import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Table from '../../../components/common/Table'
import { ArrowLeft, Plus, Search, HelpCircle, CheckCircle, AlertCircle, X } from 'lucide-react'

// Initial seeds matching current workspace listings
const INITIAL_ROOMS = [
  { id: 'CR-01', name: 'Phòng chiếu 1 (Standard)', seatsCount: 80 },
  { id: 'CR-02', name: 'Phòng chiếu 2 (3D)', seatsCount: 60 },
  { id: 'CR-03', name: 'Phòng chiếu 3 (IMAX)', seatsCount: 48 },
  { id: 'CR-04', name: 'Phòng chiếu 4 (Dolby Atmos)', seatsCount: 60 }
]

export default function CinemaRoomListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [toast, setToast] = useState(null)
  
  const triggerToast = useCallback((msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Check for redirected state success message (AC-04)
  useEffect(() => {
    if (location.state?.successMessage) {
      Promise.resolve().then(() => {
        triggerToast(location.state.successMessage, 'success')
      })
      // Clear location state to prevent repeating toast on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state, triggerToast])

  // Authorization check (AC-06)
  const isAdmin = user && user.roles?.includes('ADMIN')

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  // Add Room Dialog Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomSeats, setNewRoomSeats] = useState(80)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    let active = true

    const fetchRooms = async () => {
      // Yield execution to avoid synchronous setState inside render/effect block
      await Promise.resolve()
      if (!active) return

      try {
        const res = await cinemaRoomService.getAll()
        // If we got a structured array from the backend API
        if (res && res.data && active) {
          setRooms(res.data)
          localStorage.setItem('admin_cinema_rooms_db', JSON.stringify(res.data))
        }
      } catch (err) {
        console.warn('Backend service offline. Loading mock data from local storage.', err)
        const local = localStorage.getItem('admin_cinema_rooms_db')
        if (local && active) {
          setRooms(JSON.parse(local))
        } else if (active) {
          setRooms(INITIAL_ROOMS)
          localStorage.setItem('admin_cinema_rooms_db', JSON.stringify(INITIAL_ROOMS))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchRooms()

    return () => {
      active = false
    }
  }, [])

  // Auto-generate seat details grid template based on room capacity (AC-02)
  const generateDefaultSeats = (capacity) => {
    const seats = []
    let rowsCount = 8
    let colsCount = 10
    if (capacity === 48) {
      rowsCount = 6
      colsCount = 8
    } else if (capacity === 60) {
      rowsCount = 6
      colsCount = 10
    }

    const rowNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    for (let r = 0; r < rowsCount; r++) {
      const rowName = rowNames[r]
      for (let c = 1; c <= colsCount; c++) {
        let type = 'STANDARD'
        if (rowName === 'D' || rowName === 'E' || rowName === 'F') {
          type = 'VIP'
        } else if (rowName === 'G' || rowName === 'H') {
          type = 'COUPLE'
        }
        seats.push({
          id: `${rowName}${c}`,
          row: rowName,
          number: c,
          type: type
        })
      }
    }
    return seats
  }

  const handleAddRoom = async (e) => {
    if (e) e.preventDefault()
    setModalError('')

    if (!newRoomName.trim()) {
      setModalError('Tên phòng chiếu không được để trống.')
      return
    }

    // Check unique name in local cache
    if (rooms.some(r => r.name.toLowerCase() === newRoomName.trim().toLowerCase())) {
      setModalError('Tên phòng chiếu này đã tồn tại.')
      return
    }

    const newId = 'CR-' + Math.floor(10 + Math.random() * 90)
    const payload = {
      id: newId,
      name: newRoomName.trim(),
      seatsCount: Number(newRoomSeats)
    }

    try {
      await cinemaRoomService.create(payload)
    } catch (err) {
      console.warn('Backend create skipped. Writing mock storage entity.', err)
    } finally {
      const updatedRooms = [...rooms, payload]
      setRooms(updatedRooms)
      localStorage.setItem('admin_cinema_rooms_db', JSON.stringify(updatedRooms))

      // Write default seat structures for this room (AC-02 editing)
      const defaultSeats = generateDefaultSeats(Number(newRoomSeats))
      localStorage.setItem(`admin_room_seats_db_${newId}`, JSON.stringify(defaultSeats))

      // Clean form states
      setNewRoomName('')
      setNewRoomSeats(80)
      setShowAddModal(false)
    }
  }

  // Handle room keyword matching (AC-04)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    setActiveSearch(searchTerm.trim())
  }

  const filteredRooms = rooms.filter(room => {
    const query = activeSearch.toLowerCase()
    return (
      room.id.toLowerCase().includes(query) ||
      room.name.toLowerCase().includes(query)
    )
  })

  // Direct Columns mapping (AC-01)
  const columns = [
    { key: 'id', label: 'Cinema Room ID' },
    { key: 'name', label: 'Cinema Room Name' },
    { key: 'seatsCount', label: 'Seat Quantity' }
  ]

  // Render Access Denied state (AC-06)
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
          Chỉ có tài khoản Quản trị viên (Admin) mới có quyền truy cập và quản lý phòng chiếu này.
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
    <div className="space-y-6 text-[#e2e2e2] animate-fade-in text-left relative">
      
      {/* Toast Alert (AC-04) */}
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
            <AlertCircle className="shrink-0" size={20} />
          )}
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Header with Back button (AC-05) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Dashboard</span>
          </button>
          <h1 
            className="text-4xl text-white font-black tracking-wider uppercase" 
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Quản lý phòng chiếu
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Xem danh sách, thêm mới phòng chiếu và tùy chọn cấu hình chi tiết loại ghế ngồi.
          </p>
        </div>

        {/* Add Room trigger button (AC-03) */}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/10 active:scale-[0.98] transition-all flex items-center gap-2 uppercase tracking-wider shrink-0 border-none cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Cinema Room</span>
        </button>
      </div>

      {/* Search Bar container with search limits (AC-04) */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder="Tìm theo Room ID hoặc tên phòng..." 
            value={searchTerm}
            maxLength={28} // Max length constraint
            onChange={e => setSearchTerm(e.target.value.slice(0, 28))}
            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 w-full transition-colors shadow-sm font-medium"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          {searchTerm && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold select-none">
              {searchTerm.length}/28
            </span>
          )}
        </div>
        <button
          type="submit"
          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:bg-[var(--color-surface-container-highest)] hover:border-red-500/40 text-white font-bold px-6 rounded-xl flex items-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider"
        >
          <Search size={14} />
          Tìm kiếm
        </button>
      </form>

      {/* Main List Table rendering (AC-01) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl p-5">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-red-500">progress_activity</span>
          </div>
        ) : filteredRooms.length > 0 ? (
          <Table
            columns={columns}
            data={filteredRooms}
            actions={(row) => (
              /* Seat Detail Button (AC-02) */
              <button
                onClick={() => navigate(`/admin/cinema-rooms/${row.id}`)}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 font-bold text-xs rounded-xl transition-all border border-red-500/20 active:scale-[0.98] cursor-pointer"
              >
                Seat Detail
              </button>
            )}
          />
        ) : (
          <div className="text-center py-16 text-gray-500 font-semibold flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-4xl text-gray-600">search_off</span>
            <span className="text-sm">Không tìm thấy phòng chiếu nào phù hợp!</span>
          </div>
        )}
      </div>

      {/* Add Cinema Room Modal Dialog (AC-03) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddRoom}
            className="bg-[#0f121d] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in flex flex-col"
          >
            <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center bg-white/5">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white flex items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                <Plus size={16} className="text-red-500" />
                Thêm phòng chiếu mới
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white bg-transparent border-none outline-none cursor-pointer flex"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 font-bold rounded-lg leading-normal">
                  ⚠️ {modalError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tên phòng chiếu (Room Name)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phòng chiếu 5 (IMAX)"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500/50 w-full font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Số lượng ghế ngồi (Seat Capacity)</label>
                <select
                  value={newRoomSeats}
                  onChange={e => setNewRoomSeats(Number(e.target.value))}
                  className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500/50 w-full font-medium cursor-pointer"
                >
                  <option value={48}>48 Ghế (6 Hàng × 8 Cột)</option>
                  <option value={60}>60 Ghế (6 Hàng × 10 Cột)</option>
                  <option value={80}>80 Ghế (8 Hàng × 10 Cột)</option>
                </select>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex gap-2 items-start text-[10px] text-gray-400 leading-normal">
                <HelpCircle size={14} className="shrink-0 text-gray-500 mt-0.5" />
                <p>
                  Hệ thống sẽ tự động khởi tạo lưới sơ đồ chỗ ngồi mặc định (Standard, VIP, Couple) tương ứng với số lượng ghế đã chọn. Bạn có thể thay đổi thiết lập này tại mục Seat Detail.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-slate-900/40 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Thêm phòng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
