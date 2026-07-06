import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Clock, UserCheck, CheckCircle, AlertCircle, X } from 'lucide-react'

// Seed Shift Staff Data
const INITIAL_SHIFTS = [
  { id: 201, name: 'Nguyễn Văn Hùng', role: 'Nhân viên soát vé', shift: 'Sáng (08:00 - 14:00)', room: 'Phòng chiếu 3 (IMAX)', status: 'Đã ra ca' },
  { id: 202, name: 'Trần Minh Tâm', role: 'Nhân viên bán vé', shift: 'Chiều (14:00 - 20:00)', room: 'Quầy bán vé trung tâm', status: 'Trực ca' },
  { id: 203, name: 'Lê Thị Hồng', role: 'Nhân viên soát vé', shift: 'Tối (18:00 - 23:00)', room: 'Phòng chiếu 1 (Standard)', status: 'Trực ca' },
  { id: 204, name: 'Phạm Quốc Bảo', role: 'Nhân viên bắp nước', shift: 'Tối (18:00 - 23:00)', room: 'Quầy bắp nước số 2', status: 'Vắng mặt' }
]

export default function ManagerShiftsPage() {
  const [shifts, setShifts] = useState([])
  const [toast, setToast] = useState(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('manager_shifts_db')
    setShifts(saved ? JSON.parse(saved) : INITIAL_SHIFTS)
  }, [])

  // Sync state back to localStorage
  const syncShifts = (newShifts) => {
    setShifts(newShifts)
    localStorage.setItem('manager_shifts_db', JSON.stringify(newShifts))
  }

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleStatusToggle = (id, name, currentStatus) => {
    const nextStatus = currentStatus === 'Trực ca' ? 'Đã ra ca' : currentStatus === 'Đã ra ca' ? 'Vắng mặt' : 'Trực ca'

    const updated = shifts.map((sf) => {
      if (sf.id === id) {
        return { ...sf, status: nextStatus }
      }
      return sf
    })

    syncShifts(updated)
    triggerToast(`Đã thay đổi trạng thái ca trực của ${name} thành: ${nextStatus}`)
  }

  const handleRoomAllocation = (id, name, room) => {
    const updated = shifts.map((sf) => {
      if (sf.id === id) {
        return { ...sf, room }
      }
      return sf
    })

    syncShifts(updated)
    triggerToast(`Đã phân công ${name} vận hành tại: ${room}`)
  }

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
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Quản lý ca trực & Điểm danh nhân viên
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Điểm danh nhân sự đầu ca, phân bổ phòng chiếu và khu vực làm việc của các nhân sự trong ca làm việc.
        </p>
      </div>

      {/* Shifts Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              <th className="px-6 py-4">Nhân viên / Employee</th>
              <th className="px-6 py-4">Vai trò hoạt động</th>
              <th className="px-6 py-4">Thời gian ca trực</th>
              <th className="px-6 py-4">Khu vực phân bổ</th>
              <th className="px-6 py-4">Trạng thái ca trực</th>
              <th className="px-6 py-4 text-right">Hành động nhanh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {shifts.map((sf) => (
              <tr key={sf.id} className="hover:bg-white/2s transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-white/5">
                      {sf.name[0]}
                    </div>
                    <span className="font-extrabold text-white">{sf.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-semibold text-gray-300 uppercase">
                    {sf.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--color-text-muted)] font-semibold flex items-center gap-1.5 mt-2">
                  <Clock size={12} /> {sf.shift}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={sf.room}
                    onChange={(e) => handleRoomAllocation(sf.id, sf.name, e.target.value)}
                    className="bg-color-mix(in srgb, var(--color-surface-container) 70%, transparent) border border-[var(--color-border)] rounded-lg py-1.5 px-3 outline-none text-[11px] text-white focus:border-red-500 font-medium cursor-pointer"
                  >
                    <option value="Quầy bán vé trung tâm">Quầy bán vé trung tâm</option>
                    <option value="Quầy bắp nước số 1">Quầy bắp nước số 1</option>
                    <option value="Quầy bắp nước số 2">Quầy bắp nước số 2</option>
                    <option value="Phòng chiếu 1 (Standard)">Phòng chiếu 1 (Standard)</option>
                    <option value="Phòng chiếu 2 (3D)">Phòng chiếu 2 (3D)</option>
                    <option value="Phòng chiếu 3 (IMAX)">Phòng chiếu 3 (IMAX)</option>
                    <option value="Phòng chiếu 4 (Dolby Atmos)">Phòng chiếu 4 (Dolby Atmos)</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sf.status === 'Trực ca'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : sf.status === 'Đã ra ca'
                        ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {sf.status === 'Trực ca' && <UserCheck size={10} />}
                    {sf.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleStatusToggle(sf.id, sf.name, sf.status)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-white/5 transition-all text-[10px] cursor-pointer"
                  >
                    Đổi trạng thái
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
