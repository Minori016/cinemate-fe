import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { showtimeService } from '../../../services/showtimeService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import { ArrowLeft, Plus, Search, HelpCircle, CheckCircle, AlertCircle, X, RotateCcw, Pencil } from 'lucide-react'


export default function CinemaRoomListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin'

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
        if (res && res.data && active) {
          const roomsList = res.data?.result || res.data
          let finalRooms = Array.isArray(roomsList) ? roomsList : []
          setRooms(finalRooms)
        }
      } catch (err) {
        console.warn('Backend service offline.', err)
        if (active) setRooms([])
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

        // Leave walkways at columns 3 and 8 for 10-column rooms (between 2-3 and 8-9)
        if (colsCount === 10 && (c === 3 || c === 8)) {
          type = 'EMPTY'
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

  const handleStatusChange = async (roomObj, newStatus) => {
    if (newStatus === 'MAINTENANCE') {
      setLoading(true)
      try {
        const todayStr = new Date().toISOString().split('T')[0]
        const showtimes = await showtimeService.getAll({ startDate: todayStr })
        const affectedShowtimes = showtimes.filter(st => 
          String(st.roomId) === String(roomObj.id) && 
          st.startTime && 
          new Date(st.startTime) >= new Date() &&
          st.status !== 'FINISHED' && 
          st.status !== 'CANCELLED'
        )
        const affectedCount = affectedShowtimes.length
        
        if (affectedCount > 0) {
          triggerToast(`Không thể chuyển phòng sang bảo trì vì đang có ${affectedCount} suất chiếu hoạt động!`, 'error')
          return
        }
        
        await updateRoomStatus(roomObj.id, newStatus)
      } catch (err) {
        console.error('Failed to count affected showtimes:', err)
        triggerToast('Không thể kiểm tra lịch chiếu của phòng này.', 'error')
      } finally {
        setLoading(false)
      }
    } else {
      await updateRoomStatus(roomObj.id, newStatus)
    }
  }

  const updateRoomStatus = async (roomId, status) => {
    try {
      await cinemaRoomService.updateStatus(roomId, status)
      const updated = rooms.map(r => {
        if (r.id === roomId) {
          return { ...r, status }
        }
        return r
      })
      setRooms(updated)
      triggerToast(`Đã chuyển trạng thái phòng sang ${status}!`, 'success')
    } catch (err) {
      console.error('Failed to update room status:', err)
      triggerToast(err.response?.data?.message || 'Không thể cập nhật trạng thái phòng.', 'error')
    }
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
      name: newRoomName.trim(),
      capacity: Number(newRoomSeats)
    }

    try {
      const res = await cinemaRoomService.create(payload)
      const createdRoom = res?.data?.result || res?.data || { ...payload, id: newId }
      const updatedRooms = [...rooms, createdRoom]
      setRooms(updatedRooms)
      
      // Clean form states
      setNewRoomName('')
      setNewRoomSeats(80)
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create room:', err)
      setModalError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng chiếu.')
    }
  }

  // Handle room keyword matching (AC-04)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    setActiveSearch(searchTerm.trim())
  }

  const handleResetSearch = () => {
    setSearchTerm('')
    setActiveSearch('')
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
    { key: 'name', label: 'Cinema Room Name' },
    { key: 'capacity', label: 'Seat Quantity', render: (row) => row.capacity || row.seatsCount },
    {
      key: 'supportedFormats',
      label: 'Định dạng hỗ trợ',
      render: (row) => {
        if (!row.supportedFormats || row.supportedFormats.length === 0) return <span className="text-gray-500 italic text-xs">Chưa cấu hình</span>
        return (
          <div className="flex flex-wrap gap-1.5">
            {row.supportedFormats.map(fmt => (
              <span key={fmt} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-[10px] font-bold tracking-wider">
                {fmt.replace('_', '')}
              </span>
            ))}
          </div>
        )
      }
    },
    { 
      key: 'status', 
      label: 'Trạng thái',
      render: (row) => {
        const isActive = row.status !== 'MAINTENANCE'
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isActive 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              {isActive ? 'ACTIVE' : 'MAINTENANCE'}
            </span>
          </div>
        )
      }
    }
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
      
      {/* Header (AC-05) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1
            className="text-4xl text-[var(--color-on-surface)] font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý phòng chiếu
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Xem danh sách, thêm mới phòng chiếu và tùy chọn cấu hình chi tiết loại ghế ngồi.
          </p>
        </div>

        {/* Add Room trigger button (AC-03) */}
        <Button onClick={() => navigate(`${basePath}/cinema-rooms/add`)}>
          <Plus size={16} className="mr-1" /> Thêm phòng chiếu
        </Button>
      </div>

      {/* Maintenance Warning Alerts */}
      {rooms.filter(r => r.status === 'MAINTENANCE').map(r => {
        return (
          <div key={r.id} className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-xs font-semibold flex items-start gap-3 max-w-4xl shadow-sm animate-fade-in">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold uppercase tracking-wider mb-1">Cảnh báo bảo trì: {r.name}</p>
              <p className="text-gray-400 leading-relaxed font-medium">
                Phòng chiếu này đang ở trạng thái bảo trì (<span className="text-amber-500 font-bold">MAINTENANCE</span>). 
                Các suất chiếu tại phòng này sẽ tạm ngưng bán vé cho tới khi hoàn tất bảo trì.
              </p>
            </div>
          </div>
        )
      })}

      {/* Search Bar container with search limits (AC-04) */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 max-w-xl">
        <div className="relative min-w-[240px] flex-1">
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
          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:bg-[var(--color-surface-container-highest)] hover:border-red-500/40 text-[#1e293b] font-bold px-6 rounded-xl flex items-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider"
        >
          <Search size={14} className="text-[#1e293b]" />
          Tìm kiếm
        </button>
        {activeSearch && (
          <button
            type="button"
            onClick={handleResetSearch}
            className="bg-transparent border border-gray-600 hover:border-gray-400 hover:bg-gray-800/30 text-gray-400 hover:text-white font-bold px-5 rounded-xl flex items-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
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
              <div className="flex items-center justify-end gap-3.5">
                {/* Status Toggle/Select */}
                <select
                  value={row.status || 'ACTIVE'}
                  onChange={(e) => handleStatusChange(row, e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg text-xs py-1 px-2.5 text-gray-800 font-semibold focus:outline-none focus:border-red-500 cursor-pointer shadow-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>

                {/* Edit Room Info & Formats */}
                <button
                  onClick={() => navigate(`${basePath}/cinema-rooms/edit/${row.id}`)}
                  className="px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold text-xs rounded-xl transition-all border border-blue-500/20 active:scale-[0.98] cursor-pointer flex items-center gap-1"
                  title="Sửa thông tin & định dạng phòng chiếu"
                >
                  <Pencil size={12} />
                  Sửa
                </button>

                {/* Seat Detail Button (AC-02) */}
                <button
                  onClick={() => navigate(`${basePath}/cinema-rooms/${row.id}`)}
                  className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 font-bold text-xs rounded-xl transition-all border border-red-500/20 active:scale-[0.98] cursor-pointer"
                >
                  Seat Detail
                </button>
              </div>
            )}
          />
        ) : (
          <div className="text-center py-16 text-gray-500 font-semibold flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-gray-600">search_off</span>
            <span className="text-sm">Không tìm thấy phòng chiếu nào phù hợp!</span>
            {activeSearch && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="mt-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 font-bold text-xs rounded-xl transition-all border border-red-500/20 active:scale-[0.98] cursor-pointer"
              >
                Reset tìm kiếm
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Cinema Room Modal Dialog (AC-03) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddRoom}
            className="bg-gradient-to-b from-[#161b2a] to-[#0f121f] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 animate-fade-in flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-sm">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <span className="p-1.5 rounded-lg bg-red-600/10 text-red-500">
                  <Plus size={16} />
                </span>
                Thêm phòng chiếu mới
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white bg-transparent border-none outline-none cursor-pointer flex transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs">
              {modalError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl leading-normal flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Room Name Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tên phòng chiếu (Room Name)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phòng chiếu 5 (IMAX)"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 w-full placeholder-gray-600 transition-all font-medium"
                />
              </div>

              {/* Seat Capacity Select */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Số lượng ghế ngồi (Seat Capacity)</label>
                <select
                  value={newRoomSeats}
                  onChange={e => setNewRoomSeats(Number(e.target.value))}
                  className="bg-[#131725] border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-red-500 w-full font-medium cursor-pointer transition-colors"
                >
                  <option value={48}>48 Ghế (6 Hàng × 8 Cột)</option>
                  <option value={60}>60 Ghế (6 Hàng × 10 Cột)</option>
                  <option value={80}>80 Ghế (8 Hàng × 10 Cột)</option>
                </select>
              </div>

              {/* Informative Tip */}
              <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 flex gap-3 items-start text-[10px] text-blue-300 leading-relaxed shadow-sm">
                <HelpCircle size={16} className="shrink-0 text-blue-400 mt-0.5" />
                <p>
                  Hệ thống sẽ tự động khởi tạo lưới sơ đồ chỗ ngồi mặc định (Standard, VIP, Couple) tương ứng với số lượng ghế đã chọn. Bạn có thể thay đổi thiết lập này tại mục <strong className="text-white">Seat Detail</strong>.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all cursor-pointer border-none"
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
