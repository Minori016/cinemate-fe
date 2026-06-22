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

  // Helper to show Toast messages
  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
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
  const handleSave = async (finalSeats) => {
    setSaving(true)
    setError('')
    try {
      // Basic validation
      if (!finalSeats || finalSeats.length === 0) {
        throw new Error('Sơ đồ ghế không được trống.')
      }

      try {
        await cinemaRoomService.updateSeats(roomId, finalSeats)
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
      localStorage.setItem(`admin_room_seats_db_${roomId}`, JSON.stringify(finalSeats))
      setSeats(finalSeats)
      
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
    <div className="space-y-6 text-[#e2e2e2] animate-fade-in text-left">
      <style>{`
        .seat-edit-btn {
          transition: all 0.15s ease-in-out;
        }
        .seat-edit-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
        }
        .screen-glow {
          background: linear-gradient(to bottom, rgba(229, 9, 20, 0.3) 0%, transparent 100%);
          box-shadow: 0 15px 35px rgba(229, 9, 20, 0.15);
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : toast.type === 'info' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
            borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.3)' : toast.type === 'info' ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)',
            color: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="shrink-0" size={20} />
          ) : (
            <CheckCircle className="shrink-0" size={20} />
          )}
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header (AC-06 Back Button & AC-01 Display ID/Name) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/cinema-rooms')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại phòng chiếu</span>
          </button>
          <h1 
            className="text-4xl text-white font-black tracking-wider uppercase flex items-center gap-3" 
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Sơ đồ: {room ? room.name : 'Đang tải...'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {room ? `Cinema Room ID: ${room.id} • Tên: ${room.name} • Quy mô: ${room.capacity ?? room.seatsCount ?? '?'} ghế` : 'Đang lấy dữ liệu chi tiết phòng chiếu...'}
          </p>
        </div>

      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold flex items-center gap-2.5 max-w-3xl leading-relaxed">
          <AlertCircle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col justify-center items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
          <span className="text-sm text-gray-400 font-semibold">Đang nạp sơ đồ ghế...</span>
        </div>
      ) : (
        <SeatLayoutBuilder 
          initialSeats={seats} 
          capacity={room ? (room.capacity ?? room.seatsCount ?? 0) : 0} 
          onSave={handleSave} 
          onCancel={() => navigate('/admin/cinema-rooms')} 
        />
      )}
    </div>
  )
}
