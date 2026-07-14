import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { showtimeService } from '../../../services/showtimeService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import { ArrowLeft, Plus, Search, HelpCircle, CheckCircle, AlertCircle, X, RotateCcw, DoorOpen, Users, Film, Settings, Eye, Trash2, ChevronRight, Hash, Sparkles, Star, MapPin, Filter } from 'lucide-react'

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

const STATUS_META = {
  ACTIVE: { label: 'ACTIVE', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-700' },
  MAINTENANCE: { label: 'MAINTENANCE', bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-700' },
}


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
        const showtimes = await showtimeService.getAll()
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
    {
      key: 'name',
      label: 'Cinema Room',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-slate-900 shadow-sm">
            <DoorOpen size={16} className="text-amber-300" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{row.name}</p>
            <p className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">{row.id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'capacity',
      label: 'Seats',
      render: (row) => {
        const cap = row.capacity || row.seatsCount || 0
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center border-2 border-amber-300 flex-shrink-0">
              <Users size={14} className="text-amber-700" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{cap}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">ghe</p>
            </div>
          </div>
        )
      }
    },
    {
      key: 'supportedFormats',
      label: 'Dinh dang ho tro',
      render: (row) => {
        if (!row.supportedFormats || row.supportedFormats.length === 0) {
          return <span className="text-[10px] font-bold text-slate-400 italic">Chua cau hinh</span>
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {row.supportedFormats.map(fmt => (
              <span key={fmt} className="px-2.5 py-1 bg-sky-200 border-2 border-sky-700 text-sky-900 rounded-md text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                {fmt.replace('_', '')}
              </span>
            ))}
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Trang thai',
      render: (row) => {
        const isActive = row.status !== 'MAINTENANCE'
        const meta = isActive ? STATUS_META.ACTIVE : STATUS_META.MAINTENANCE
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 ${meta.bg} ${meta.text} ${meta.border} shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-900'}`} />
            {meta.label}
          </span>
        )
      }
    }
  ]

  // Render Access Denied state (AC-06)
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-red-600 border-4 border-slate-900 rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mb-6">
          <AlertCircle size={40} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-black uppercase text-slate-900 mb-3 tracking-tight">
          Quyen truy cap<br /><span className="text-red-600">bi tu choi</span>
        </h2>
        <p className="text-slate-600 text-sm max-w-sm mb-6 leading-relaxed">
          Chi co tai khoan Quan tri vien (Admin) moi co quyen truy cap va quan ly phong chieu nay.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-slate-900 hover:bg-red-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Quay lai trang chu
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">

      {/* Toast Alert */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2 text-sm max-w-sm font-bold ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`}
        >
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.text}</span>
        </motion.div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <DoorOpen size={24} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> CINEMA ROOM
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {rooms.length} phong
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly<br /><span className="text-red-600">phong chieu</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Xem danh sach, them moi phong chieu va tuy chon cau hinh chi tiet loai ghe ngoi.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/cinema-rooms/add')}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs rounded-2xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} /> Them phong chieu
            </button>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* Maintenance Warning Alerts */}
      {rooms.filter(r => r.status === 'MAINTENANCE').map(r => {
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-amber-100 border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-start gap-3 max-w-4xl"
          >
            <div className="w-10 h-10 bg-amber-500 border-2 border-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="font-black uppercase tracking-wider text-sm text-slate-900 mb-1">Canh bao bao tri: {r.name}</p>
              <p className="text-slate-700 text-xs leading-relaxed font-bold">
                Phong chieu nay dang o trang thai bao tri (<span className="text-amber-700 font-black">MAINTENANCE</span>).
                Cac suat chieu tai phong nay se tam ngung ban ve cho toi khi hoan tat bao tri.
              </p>
            </div>
          </motion.div>
        )
      })}

      {/* Search Bar */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-sky-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Tim kiem phong chieu</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Theo Room ID hoac ten phong (toi da 28 ky tu)</p>
            </div>
            <Filter size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>
        <form onSubmit={handleSearchSubmit} className="p-5 md:p-6 flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1">
            <input
              type="text"
              placeholder="Vi du: CR-12 hoac Phong chieu 5..."
              value={searchTerm}
              maxLength={28}
              onChange={e => setSearchTerm(e.target.value.slice(0, 28))}
              className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl pl-4 pr-14 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-amber-50 transition-all font-bold"
            />
            {searchTerm && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-black select-none bg-white px-1.5 py-0.5 rounded">
                {searchTerm.length}/28
              </span>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          >
            <Search size={14} strokeWidth={3} /> Tim kiem
          </button>
          {activeSearch && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-dashed border-slate-500 hover:border-rose-500 transition-all cursor-pointer"
            >
              <RotateCcw size={14} strokeWidth={2.5} /> Reset
            </button>
          )}
        </form>
      </div>

      {/* Main List Table rendering */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
      >
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <span className="text-xl font-black">L</span>
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-amber-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Danh sach phong chieu</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {filteredRooms.length} phong {activeSearch && <span className="text-red-600">(filtered)</span>}
              </p>
            </div>
            <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-5">
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-3">
            <span className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
            <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Dang tai...</span>
          </div>
        ) : filteredRooms.length > 0 ? (
          <Table
            columns={columns}
            data={filteredRooms}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2.5">
                {/* Status Toggle */}
                <select
                  value={row.status || 'ACTIVE'}
                  onChange={(e) => handleStatusChange(row, e.target.value)}
                  className={`bg-white border-2 border-slate-900 rounded-lg text-[10px] py-1.5 px-2.5 font-black uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:outline-none focus:border-red-600 ${
                    (row.status || 'ACTIVE') === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINT.</option>
                </select>

                {/* Seat Detail Button */}
                <button
                  onClick={() => navigate(`/admin/cinema-rooms/${row.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <Eye size={11} strokeWidth={3} /> Chi tiet
                </button>
              </div>
            )}
          />
        ) : (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
              <Search size={28} className="text-slate-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-base font-black text-slate-700 uppercase tracking-wider">Khong co phong chieu nao</p>
              <p className="text-xs text-slate-500 font-bold mt-1">Hay them phong chieu moi de bat dau</p>
            </div>
            {activeSearch && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-rose-700 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <RotateCcw size={12} strokeWidth={2.5} /> Reset tim kiem
              </button>
            )}
          </div>
        )}
        </div>
      </motion.div>

      {/* Add Cinema Room Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.form
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onSubmit={handleAddRoom}
            className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] flex flex-col"
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              <TicketStrip count={14} />
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 px-6 py-5 flex justify-between items-center border-b-2 border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 border-2 border-slate-900 rounded-xl flex items-center justify-center">
                    <Plus size={18} className="text-amber-300" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Them phong chieu</h4>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-1">Tao phong moi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-700 hover:text-red-600 bg-white border-2 border-slate-900 rounded-lg p-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 bg-white">
              {modalError && (
                <div className="p-3.5 bg-rose-100 border-2 border-rose-700 text-rose-900 font-bold rounded-xl leading-normal flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <AlertCircle size={16} className="shrink-0" strokeWidth={2.5} />
                  <span className="text-xs">{modalError}</span>
                </div>
              )}

              {/* Room Name Input */}
              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <DoorOpen size={11} strokeWidth={2.5} className="text-red-600" />
                  Ten phong chieu
                </label>
                <input
                  type="text"
                  placeholder="Vi du: Phong chieu 5 (IMAX)"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-rose-50 transition-all font-bold"
                />
              </div>

              {/* Seat Capacity Select */}
              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <Users size={11} strokeWidth={2.5} className="text-red-600" />
                  So luong ghe ngoi
                </label>
                <select
                  value={newRoomSeats}
                  onChange={e => setNewRoomSeats(Number(e.target.value))}
                  className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold cursor-pointer transition-all"
                >
                  <option value={48}>48 Ghe (6 Hang x 8 Cot)</option>
                  <option value={60}>60 Ghe (6 Hang x 10 Cot)</option>
                  <option value={80}>80 Ghe (8 Hang x 10 Cot)</option>
                </select>
              </div>

              {/* Informative Tip */}
              <div className="bg-sky-100 border-2 border-slate-900 rounded-2xl p-4 flex gap-3 items-start shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={16} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <p className="text-[11px] text-slate-800 leading-relaxed font-bold">
                  He thong se tu dong khoi tao luoi so do cho ngoi mac dinh (<strong className="text-slate-900">Standard, VIP, Couple</strong>) tuong ung voi so luong ghe da chon. Ban co the thay doi thiet lap tai <strong className="text-slate-900">Chi tiet</strong>.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={3} /> Huy bo
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Plus size={14} strokeWidth={3} /> Them phong
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  )
}
