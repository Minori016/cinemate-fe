import { useState } from 'react'
import { X, Calendar as CalendarIcon, Settings, Play, CheckCircle } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function AutoGenerateModal({ open, onClose, movies, rooms, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Setup, 2: Preview
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewList, setPreviewList] = useState([])
  const [templateResponse, setTemplateResponse] = useState(null)

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    openTime: '08:00',
    closeTime: '23:00',
    goldenHourStart: '18:00',
    goldenHourEnd: '21:00',
    movieIds: [],
    roomIds: [],
    formats: ['2D'],
    languages: ['Phụ đề'],
    totalShowsPerDay: 4,
    goldenHourShows: 1
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
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const start = new Date(form.startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(form.endDate)
    end.setHours(0, 0, 0, 0)
    
    if (start <= today) {
      setError('Ngày bắt đầu phải từ ngày mai trở đi!')
      return
    }
    
    if (start > end) {
      setError('Ngày bắt đầu không được sau ngày kết thúc!')
      return
    }
    
    if (form.openTime >= form.closeTime) {
      setError('Giờ mở cửa phải trước giờ đóng cửa!')
      return
    }
    
    if (form.goldenHourStart >= form.goldenHourEnd) {
      setError('Giờ vàng bắt đầu phải trước giờ kết thúc!')
      return
    }
    
    if (form.goldenHourStart < form.openTime || form.goldenHourEnd > form.closeTime) {
      setError('Khung giờ vàng phải nằm trong giờ hoạt động của rạp!')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const moviesPayload = form.movieIds.map(id => {
        const movie = movies.find(m => m.id === id)
        
        const versions = [];
        form.formats.forEach(f => {
          form.languages.forEach(l => {
            versions.push(`${f}_${l === 'Phụ đề' ? 'SUB' : 'DUB'}`);
          });
        });

        return {
          movieId: id,
          totalShowsPerDay: form.totalShowsPerDay,
          goldenHourShows: form.goldenHourShows,
          versions: versions,
          basePrice: movie?.basePrice || 90000,
          isHot: (movie?.hotScore || 0) > 50
        }
      })

      const requestPayload = {
        roomIds: form.roomIds,
        movies: moviesPayload,
        operatingStartTime: form.openTime + ":00",
        operatingEndTime: form.closeTime + ":00",
        adDurationMinutes: 10, // 10 phút trailer/quảng cáo theo nghiệp vụ
        cleanupDurationMinutes: 15, // 15 phút dọn dẹp buffer
        goldenHourStart: form.goldenHourStart + ":00",
        goldenHourEnd: form.goldenHourEnd + ":00",
        startDate: form.startDate,
        endDate: form.endDate,
        maxMoviesPerRoom: 2
      }

      const res = await showtimeService.autoGenerate(requestPayload)
      
      setTemplateResponse(res)
      
      const flatList = []
      if (res && res.scheduleByRoom) {
        Object.values(res.scheduleByRoom).forEach(roomSlots => {
          if (Array.isArray(roomSlots)) {
            flatList.push(...roomSlots)
          }
        })
      }
      
      setPreviewList(flatList)
      setStep(2)
    } catch (err) {
      setError('Lỗi khi chạy thuật toán: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSave = async () => {
    if (!templateResponse) return
    
    setLoading(true)
    try {
      const confirmPayload = {
        startDate: templateResponse.startDate,
        endDate: templateResponse.endDate,
        scheduleByRoom: templateResponse.scheduleByRoom
      }
      const res = await showtimeService.autoConfirm(confirmPayload)
      onSuccess(`Đã tạo thành công ${res.result || previewList.length} suất chiếu!`)
      onClose()
    } catch (err) {
      setError('Lỗi khi lưu hàng loạt: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface-2)]">
          <h4 className="font-extrabold uppercase tracking-wider text-sm text-[var(--color-on-surface)] flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-500">
              <Settings size={16} />
            </span>
            {step === 1 ? 'Thuật toán tạo suất chiếu' : 'Xem trước Lịch chiếu (Preview)'}
          </h4>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-on-surface)] transition-colors">
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
                    <h5 className="text-[var(--color-on-surface)] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[var(--color-border)] pb-2">Khoảng thời gian</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold">Từ ngày</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={`w-full flex items-center justify-between bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] outline-none hover:border-blue-500 cursor-pointer transition-colors ${!form.startDate && "text-gray-500"}`}
                            >
                              {form.startDate ? format(parseISO(form.startDate), "dd/MM/yyyy", { locale: vi }) : <span>DD/MM/YYYY</span>}
                              <CalendarIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[200] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl" align="start">
                            <Calendar
                              mode="single"
                              selected={form.startDate ? parseISO(form.startDate) : undefined}
                              onSelect={(date) => date && setForm({...form, startDate: format(date, 'yyyy-MM-dd')})}
                              initialFocus
                              locale={vi}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold">Đến ngày</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={`w-full flex items-center justify-between bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] outline-none hover:border-blue-500 cursor-pointer transition-colors ${!form.endDate && "text-gray-500"}`}
                            >
                              {form.endDate ? format(parseISO(form.endDate), "dd/MM/yyyy", { locale: vi }) : <span>DD/MM/YYYY</span>}
                              <CalendarIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[200] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl" align="start">
                            <Calendar
                              mode="single"
                              selected={form.endDate ? parseISO(form.endDate) : undefined}
                              onSelect={(date) => date && setForm({...form, endDate: format(date, 'yyyy-MM-dd')})}
                              initialFocus
                              locale={vi}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[var(--color-on-surface)] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[var(--color-border)] pb-2">Khung giờ hoạt động</h5>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold">Mở cửa</label>
                        <input type="time" value={form.openTime} onChange={e => setForm({...form, openTime: e.target.value})} className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] focus:border-blue-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold">Đóng cửa</label>
                        <input type="time" value={form.closeTime} onChange={e => setForm({...form, closeTime: e.target.value})} className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-orange-950/20 border border-orange-500/20 rounded-xl">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-orange-500 font-bold">Giờ vàng (Bắt đầu)</label>
                        <input type="time" value={form.goldenHourStart} onChange={e => setForm({...form, goldenHourStart: e.target.value})} className="bg-[var(--color-surface)] border border-orange-500/30 rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] focus:border-orange-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-orange-500 font-bold">Giờ vàng (Kết thúc)</label>
                        <input type="time" value={form.goldenHourEnd} onChange={e => setForm({...form, goldenHourEnd: e.target.value})} className="bg-[var(--color-surface)] border border-orange-500/30 rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] focus:border-orange-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[var(--color-on-surface)] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[var(--color-border)] pb-2">Cấu hình suất chiếu (mỗi phim)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold">Tổng số suất/ngày</label>
                        <input type="number" min="1" max="20" value={form.totalShowsPerDay} onChange={e => setForm({...form, totalShowsPerDay: parseInt(e.target.value) || 1})} className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] focus:border-blue-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold">Số suất giờ vàng</label>
                        <input type="number" min="0" max="10" value={form.goldenHourShows} onChange={e => setForm({...form, goldenHourShows: parseInt(e.target.value) || 0})} className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm text-[var(--color-on-surface)] focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[var(--color-on-surface)] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[var(--color-border)] pb-2">Định dạng chiếu</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold mb-2 block">Công nghệ</label>
                        {['2D', '3D', 'IMAX'].map(fmt => (
                          <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form.formats.includes(fmt)} 
                              onChange={(e) => {
                                const newFmts = e.target.checked 
                                  ? [...form.formats, fmt] 
                                  : form.formats.filter(f => f !== fmt);
                                setForm({...form, formats: newFmts.length ? newFmts : ['2D']});
                              }}
                              className="w-4 h-4 rounded accent-blue-500" 
                            />
                            <span className="text-sm text-[var(--color-on-surface)]">{fmt}</span>
                          </label>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-[var(--color-text-muted)] font-semibold mb-2 block">Ngôn ngữ</label>
                        {['Phụ đề', 'Lồng tiếng'].map(lang => (
                          <label key={lang} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form.languages.includes(lang)} 
                              onChange={(e) => {
                                const newLangs = e.target.checked 
                                  ? [...form.languages, lang] 
                                  : form.languages.filter(l => l !== lang);
                                setForm({...form, languages: newLangs.length ? newLangs : ['Phụ đề']});
                              }}
                              className="w-4 h-4 rounded accent-blue-500" 
                            />
                            <span className="text-sm text-[var(--color-on-surface)]">{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Movie and Room Selection */}
                <div className="space-y-6">
                  <div>
                    <h5 className="text-[var(--color-on-surface)] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[var(--color-border)] pb-2">Chọn Phim</h5>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {movies.map(m => (
                        <label key={m.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors rounded-xl cursor-pointer border border-[var(--color-border)]">
                          <input type="checkbox" checked={form.movieIds.includes(m.id)} onChange={() => handleMovieToggle(m.id)} className="w-4 h-4 rounded accent-blue-500" />
                          <span className="text-sm text-[var(--color-on-surface)] font-medium">{m.titleVn}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[var(--color-on-surface)] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[var(--color-border)] pb-2">Chọn Phòng Chiếu</h5>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {rooms.map(r => (
                        <label key={r.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors rounded-xl cursor-pointer border border-[var(--color-border)]">
                          <input type="checkbox" checked={form.roomIds.includes(r.id)} onChange={() => handleRoomToggle(r.id)} className="w-4 h-4 rounded accent-blue-500" />
                          <span className="text-sm text-[var(--color-on-surface)] font-medium">{r.name}</span>
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
                  <div key={st.tempId || idx} className={`p-4 rounded-xl border ${st.goldenHour || st.isGoldenHour ? 'bg-orange-950/20 border-orange-500/30' : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'}`}>
                    <h6 className="font-bold text-[var(--color-on-surface)] text-sm mb-2 line-clamp-2">{st.movieTitle}</h6>
                    <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                      <p>Phòng: <span className="text-[var(--color-on-surface-variant)]">{st.roomName}</span></p>
                      <p>Bắt đầu: <span className="text-blue-500 font-bold">{st.slotStartTime}</span></p>
                      <p>Kết thúc: <span className="text-[var(--color-on-surface-variant)]">{st.endTime}</span></p>
                      <p>Định dạng: <span className="text-purple-400 font-bold">{st.format}</span></p>
                      <p>Giờ vàng: <span className="text-orange-500 font-mono font-bold">{st.goldenHour || st.isGoldenHour ? 'Có' : 'Không'}</span></p>
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
        <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-transparent border border-[var(--color-border)] hover:bg-[var(--color-border)] text-[var(--color-on-surface)] font-bold rounded-xl transition-all">
            Đóng
          </button>
          
          {step === 1 ? (
            <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50">
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
