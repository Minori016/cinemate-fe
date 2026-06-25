import { useState } from 'react'
import { X, Calendar, Settings, Play, CheckCircle } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'

export default function AutoGenerateModal({ open, onClose, movies, rooms, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Setup, 2: Preview
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewList, setPreviewList] = useState([])

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    openTime: '08:00',
    closeTime: '23:00',
    goldenHourStart: '18:00',
    goldenHourEnd: '21:00',
    movieIds: [],
    roomIds: [],
    format: '2D',
    language: 'Phụ đề'
  })

  if (!open) return null

  const handleMovieToggle = (id) => {
    setForm(prev => ({
      ...prev,
      movieIds: prev.movieIds.includes(id) 
        ? prev.movieIds.filter(mId => mId !== id)
        : [...prev.movieIds, id]
    }))
  }

  const handleRoomToggle = (id) => {
    setForm(prev => ({
      ...prev,
      roomIds: prev.roomIds.includes(id)
        ? prev.roomIds.filter(rId => rId !== id)
        : [...prev.roomIds, id]
    }))
  }

  const handleGenerate = async () => {
    if (!form.startDate || !form.endDate || form.movieIds.length === 0 || form.roomIds.length === 0) {
      setError('Vui lòng chọn đầy đủ Ngày, Phim và Phòng chiếu!')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      // Mocking the autoGenerate since the backend might not be fully linked with UUIDs yet
      const res = await showtimeService.autoGenerate({
        ...form,
        openTime: form.openTime + ":00",
        closeTime: form.closeTime + ":00",
        goldenHourStart: form.goldenHourStart + ":00",
        goldenHourEnd: form.goldenHourEnd + ":00"
      })
      
      setPreviewList(res || [])
      setStep(2)
    } catch (err) {
      setError('Lỗi khi chạy thuật toán: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSave = async () => {
    setLoading(true)
    try {
      // Convert previewList format to expected batch format
      // Here we assume batchCreate expects array of objects
      await showtimeService.batchCreate(previewList)
      onSuccess('Lưu danh sách tự động thành công!')
      onClose()
    } catch (err) {
      setError('Lỗi khi lưu hàng loạt: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-[#161b2a] to-[#0f121f] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h4 className="font-extrabold uppercase tracking-wider text-sm text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-500">
              <Settings size={16} />
            </span>
            {step === 1 ? 'Thuật toán tạo suất chiếu' : 'Xem trước Lịch chiếu (Preview)'}
          </h4>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-8">
              {/* Step 1: Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Time configs */}
                <div className="space-y-6">
                  <div>
                    <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-wider border-b border-white/10 pb-2">Khoảng thời gian</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400">Từ ngày</label>
                        <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="bg-[#131725] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-blue-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400">Đến ngày</label>
                        <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="bg-[#131725] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-wider border-b border-white/10 pb-2">Khung giờ hoạt động</h5>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400">Mở cửa</label>
                        <input type="time" value={form.openTime} onChange={e => setForm({...form, openTime: e.target.value})} className="bg-[#131725] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-blue-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400">Đóng cửa</label>
                        <input type="time" value={form.closeTime} onChange={e => setForm({...form, closeTime: e.target.value})} className="bg-[#131725] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-orange-400 font-bold">Giờ vàng (Bắt đầu)</label>
                        <input type="time" value={form.goldenHourStart} onChange={e => setForm({...form, goldenHourStart: e.target.value})} className="bg-[#131725] border border-orange-500/30 rounded-xl py-2 px-3 text-sm text-white focus:border-orange-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-orange-400 font-bold">Giờ vàng (Kết thúc)</label>
                        <input type="time" value={form.goldenHourEnd} onChange={e => setForm({...form, goldenHourEnd: e.target.value})} className="bg-[#131725] border border-orange-500/30 rounded-xl py-2 px-3 text-sm text-white focus:border-orange-500 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Movie and Room Selection */}
                <div className="space-y-6">
                  <div>
                    <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-wider border-b border-white/10 pb-2">Chọn Phim</h5>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {movies.map(m => (
                        <label key={m.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-white/5">
                          <input type="checkbox" checked={form.movieIds.includes(m.id)} onChange={() => handleMovieToggle(m.id)} className="w-4 h-4 rounded accent-blue-500" />
                          <span className="text-sm text-white font-medium">{m.titleVn}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-wider border-b border-white/10 pb-2">Chọn Phòng Chiếu</h5>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {rooms.map(r => (
                        <label key={r.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-white/5">
                          <input type="checkbox" checked={form.roomIds.includes(r.id)} onChange={() => handleRoomToggle(r.id)} className="w-4 h-4 rounded accent-blue-500" />
                          <span className="text-sm text-white font-medium">{r.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Preview Calendar
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-xl text-sm flex items-center gap-2">
                <CheckCircle size={18} />
                Thuật toán đã chạy thành công. Tạo ra {previewList.length} suất chiếu dự kiến.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewList.length > 0 ? previewList.map((st, idx) => (
                  <div key={st.tempId || idx} className={`p-4 rounded-xl border ${st.isGoldenHour ? 'bg-orange-950/30 border-orange-500/30' : 'bg-white/5 border-white/10'}`}>
                    <h6 className="font-bold text-white text-sm mb-2 line-clamp-2">{st.movieTitle}</h6>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Phòng: <span className="text-gray-200">{st.roomName}</span></p>
                      <p>Bắt đầu: <span className="text-blue-400 font-bold">{new Date(st.startTime).toLocaleString('vi-VN')}</span></p>
                      <p>Kết thúc: <span className="text-gray-300">{new Date(st.endTime).toLocaleTimeString('vi-VN')}</span></p>
                      <p>Điểm ưu tiên: <span className="text-green-400 font-mono">{st.priorityScore?.toFixed(1)}</span></p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    Không tạo được suất chiếu nào phù hợp. Vui lòng kiểm tra lại điều kiện!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-black/40 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
            Đóng
          </button>
          
          {step === 1 ? (
            <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <Play size={16} />}
              Chạy Thuật Toán
            </button>
          ) : (
            <button onClick={handleBatchSave} disabled={loading || previewList.length === 0} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <CheckCircle size={16} />}
              Lưu {previewList.length} Suất Chiếu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
