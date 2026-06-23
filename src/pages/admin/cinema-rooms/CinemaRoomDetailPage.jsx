import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Info, 
  LayoutGrid, 
  RefreshCw 
} from 'lucide-react'
import SeatLayoutBuilder from './components/SeatLayoutBuilder'

// Generate default seats matching CinemaRoomListPage fallback
const generateDefaultSeats = (capacity) => {
  const seatsList = []
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

      seatsList.push({
        id: `${rowName}${c}`,
        row: rowName,
        number: c,
        type: type
      })
    }
  }
  return seatsList
}

export default function CinemaRoomDetailPage() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Authorization check (AC-07)
  const isAdmin = user && user.roles?.includes('ADMIN')

  // States
  const [room, setRoom] = useState(null)
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Helper to show Toast messages
  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleBackClick = () => {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      navigate('/admin/cinema-rooms')
    }
  }

  useEffect(() => {
    let active = true

    const fetchRoomAndSeats = async () => {
      // Yield execution to avoid synchronous setState inside render/effect block
      await Promise.resolve()
      if (!active) return

      setLoading(true)
      setError('')
      let fetchedRoom = null

      try {
        // 1. Fetch Room Info (AC-01)
        // cinemaRoomService.getById() calls /api/v1/cinema-rooms và filter client-side
        const roomRes = await cinemaRoomService.getById(roomId)
        if (roomRes && roomRes.data && active) {
          fetchedRoom = roomRes.data
          setRoom(roomRes.data)
        }
      } catch (err) {
        console.warn('Backend API offline. Fetching room from local storage fallback.', err)
        const localRooms = localStorage.getItem('admin_cinema_rooms_db')
        if (localRooms && active) {
          const roomsList = JSON.parse(localRooms)
          fetchedRoom = roomsList.find(r => r.id === roomId || String(r.id) === String(roomId))
          if (fetchedRoom) {
            setRoom(fetchedRoom)
          }
        }
      }

      if (!fetchedRoom) {
        // Check if it's one of the initial seeds
        const initialRooms = [
          { id: 'CR-01', name: 'Phòng chiếu 1 (Standard)', seatsCount: 80 },
          { id: 'CR-02', name: 'Phòng chiếu 2 (3D)', seatsCount: 60 },
          { id: 'CR-03', name: 'Phòng chiếu 3 (IMAX)', seatsCount: 48 },
          { id: 'CR-04', name: 'Phòng chiếu 4 (Dolby Atmos)', seatsCount: 60 }
        ]
        fetchedRoom = initialRooms.find(r => r.id === roomId)
        if (fetchedRoom && active) {
          setRoom(fetchedRoom)
        } else if (active) {
          setError('Không tìm thấy thông tin phòng chiếu.')
          setLoading(false)
          return
        }
      }

      try {
        // 2. Fetch Seats Info
        const seatsRes = await cinemaRoomService.getSeats(roomId)
        if (seatsRes && seatsRes.data && seatsRes.data.length > 0 && active) {
          setSeats(seatsRes.data)
        } else {
          throw new Error('Empty seats data')
        }
      } catch (err) {
        console.warn('Backend API offline. Fetching seats from local storage fallback.', err)
        const localSeats = localStorage.getItem(`admin_room_seats_db_${roomId}`)
        if (localSeats && active) {
          setSeats(JSON.parse(localSeats))
        } else if (active) {
          // Fallback to generate default seating template
          const defaultSeats = generateDefaultSeats(fetchedRoom.seatsCount)
          setSeats(defaultSeats)
          localStorage.setItem(`admin_room_seats_db_${roomId}`, JSON.stringify(defaultSeats))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    if (isAdmin && roomId) {
      fetchRoomAndSeats()
    }

    return () => {
      active = false
    }
  }, [roomId, isAdmin])

  // Handle Save Seats layout (AC-04 & AC-05)
  const handleSave = async (payload) => {
    setSaving(true)
    setError('')
    try {
      // Basic validation
      if (!payload.seats || payload.seats.length === 0) {
        throw new Error('Sơ đồ ghế không được trống.')
      }

      try {
        await cinemaRoomService.updateLayout(roomId, payload)
      } catch (err) {
        if (err.response) {
          // Server returned an error code
          throw new Error(err.response.data?.message || 'Lưu thất bại: Máy chủ phản hồi lỗi.', { cause: err })
        } else if (err.request) {
          // Connection refused / Network error (fallback to local storage)
          console.warn('Backend server offline. Performing offline save fallback.', err)
        } else {
          throw err
        }
      }

      // Update database / local storage (AC-04)
      localStorage.setItem(`admin_room_seats_db_${roomId}`, JSON.stringify(payload.seats))
      setSeats(payload.seats)
      
      // Return to listing and show confirmation (AC-04)
      navigate('/admin/cinema-rooms', { 
        state: { successMessage: `Cấu hình ghế cho phòng "${room?.name || roomId}" thành công!` } 
      })
    } catch (err) {
      // Save fails: stay on screen, display error, without writing to database/localStorage (AC-05)
      setError(err.message || 'Lưu cấu hình ghế thất bại.')
      triggerToast(err.message || 'Lưu cấu hình ghế thất bại.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Access Denied (AC-07)
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
          Chỉ có tài khoản Quản trị viên (Admin) mới có quyền truy cập và cấu hình phòng chiếu này.
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
    <div className="space-y-6 text-[var(--color-text-primary)] animate-fade-in text-left">
      
      {/* Toast — giữ nguyên, chỉ bỏ backdropFilter & dùng class chuẩn hơn */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg border text-sm max-w-sm
          ${toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : toast.type === 'info'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="shrink-0" size={18} /> : <CheckCircle className="shrink-0" size={18} />}
          <span className="font-medium leading-snug">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Back + Header */}
      <div>
        <button
          onClick={handleBackClick}
          className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white uppercase font-semibold tracking-widest mb-3 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={13} />
          Quay lại phòng chiếu
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium text-white">
              Sơ đồ: {room ? room.name : 'Đang tải...'}
            </h1>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              {room && (
                <>
                  <span className="text-xs bg-white/5 border border-white/10 rounded-md px-2.5 py-0.5 text-gray-400">
                    ID: {room.id}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-400">{room.name}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-400">{room.capacity ?? room.seatsCount ?? '?'} ghế</span>
                </>
              )}
              {!room && <span className="text-sm text-gray-500">Đang lấy dữ liệu...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/8" />

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/15 rounded-xl text-red-400 text-sm leading-relaxed max-w-2xl">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center gap-3 bg-white/[0.03] border border-white/8 rounded-2xl">
          <RefreshCw className="animate-spin text-gray-400" size={28} />
          <span className="text-sm text-gray-500 font-medium">Đang nạp sơ đồ ghế...</span>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          {/* SeatLayoutBuilder header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <LayoutGrid size={17} className="text-gray-400" />
              <span className="text-[15px] font-medium text-white">Trình chỉnh sơ đồ ghế</span>
            </div>
          </div>

          <SeatLayoutBuilder
            initialSeats={seats}
            capacity={room ? (room.capacity ?? room.seatsCount ?? 0) : 0}
            onSave={handleSave}
            onCancel={handleBackClick}
            setIsDirty={setIsDirty}
          />
        </div>
      )}

      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.45)', 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-left">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-2">
              Xác nhận thoát
            </h4>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed font-sans">
              Bạn có những thay đổi chưa lưu. Bạn có chắc chắn muốn thoát và hủy bỏ toàn bộ thay đổi này không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 border border-white/10 text-gray-400 text-xs font-bold rounded-xl bg-transparent hover:bg-white/5 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false)
                  navigate('/admin/cinema-rooms')
                }}
                className="px-5 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 cursor-pointer shadow-md transition-colors"
              >
                Thoát và Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
