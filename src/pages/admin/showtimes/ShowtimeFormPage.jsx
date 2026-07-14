import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { priceConfigService } from '../../../services/priceConfigService'
import { systemConfigService } from '../../../services/systemConfigService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'

export default function ShowtimeFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const isAdmin = user && user.roles?.includes('ADMIN')
  const basePath = isAdmin ? '/admin' : '/manager'

  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])

  const [movieId, setMovieId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [format, setFormat] = useState('2D')
  const [language, setLanguage] = useState('Phụ đề')
  const [price, setPrice] = useState(70000)
  const [formatPrices, setFormatPrices] = useState({})
  const [systemConfigs, setSystemConfigs] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const timeDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setIsTimeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch movies
        const mRes = await movieService.getAll()
        const mList = mRes.data || []
        setMovies(mList)
        // Fetch rooms
        const rRes = await cinemaRoomService.getAll()
        const rList = rRes.data?.result || rRes.data || []
        const sortedList = (Array.isArray(rList) ? rList : []).sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'vi', { numeric: true })
        );
        setRooms(sortedList)
        // Fetch prices
        const pRes = await priceConfigService.getAll()
        const pList = pRes || []
        const pMap = {}
        pList.forEach(p => {
          const key = p.format?.replace('_', '') || '2D'
          pMap[key] = p.basePrice
        })
        setFormatPrices(pMap)
        if (!isEditMode && pMap['2D']) {
          setPrice(pMap['2D'])
        }
        // Fetch system configs
        try {
          const sRes = await systemConfigService.getAll()
          setSystemConfigs(sRes.data || sRes || [])
        } catch (sErr) {
          console.error('Failed to load system configs', sErr)
        }
      } catch (err) {
        console.error('Failed to load reference data', err)
        setToast({ message: 'Không thể tải dữ liệu phim và phòng chiếu', type: 'danger' })
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (isEditMode) {
      showtimeService.getById(id).then(st => {
        if (st) {
          setMovieId(st.movieId || st.movie?.id || '')
          setRoomId(st.roomId || st.room?.id || '')
          setDate(st.date || '')
          setTime(st.time || '')
          setFormat(st.format || '2D')
          setLanguage(st.language || 'Phụ đề')
          setPrice(st.price || 90000)
        } else {
          setToast({ message: 'Không tìm thấy lịch chiếu', type: 'danger' })
        }
      }).catch(err => {
        console.error('Failed to load showtime', err)
        setToast({ message: 'Không thể tải thông tin lịch chiếu', type: 'danger' })
      })
    }
  }, [id, isEditMode])

  // Calculations based on business logic
  const selectedMovie = movies.find(m => m.id === movieId)
  const duration = selectedMovie?.duration || 120

  const availableFormats = useMemo(() => {
    if (!selectedMovie?.version) return ['2D'];
    const v = selectedMovie.version.toUpperCase();
    const formats = [];
    const systemFormats = Object.keys(formatPrices);

    // We try to match with system formats
    systemFormats.forEach(fmt => {
      if (v.includes(fmt)) formats.push(fmt);
    });

    return formats.length > 0 ? formats : ['2D'];
  }, [selectedMovie, formatPrices]);

  const availableLanguages = useMemo(() => {
    if (!selectedMovie?.language) return ['Phụ đề'];
    const l = selectedMovie.language.toLowerCase();
    const langs = [];
    if (l.includes('phụ đề') || l.includes('sub')) langs.push('Phụ đề');
    if (l.includes('lồng tiếng') || l.includes('dub')) langs.push('Lồng tiếng');

    return langs.length > 0 ? langs : ['Phụ đề'];
  }, [selectedMovie]);

  // Auto-select valid format and language when movie changes
  useEffect(() => {
    if (selectedMovie) {
      if (!availableFormats.includes(format) && availableFormats.length > 0) {
        const newFmt = availableFormats[0];
        setFormat(newFmt);
        if (!isEditMode && formatPrices[newFmt]) {
          setPrice(formatPrices[newFmt]);
        }
      }
      if (!availableLanguages.includes(language) && availableLanguages.length > 0) {
        setLanguage(availableLanguages[0]);
      }
    }
  }, [selectedMovie, availableFormats, availableLanguages]); // excluded format/language to prevent loops, wait, if we exclude them, it won't loop if they change manually.

  // Filter rooms based on the currently selected format
  const filteredRooms = useMemo(() => {
    if (!format) return rooms;
    return rooms.filter(r => {
      if (!r.supportedFormats || !Array.isArray(r.supportedFormats)) return false;
      return r.supportedFormats.some(f => f.replace('_', '') === format);
    });
  }, [rooms, format]);

  // Reset selected room if it's no longer supported by the new format
  useEffect(() => {
    if (roomId && format) {
      const isRoomValid = filteredRooms.some(r => r.id === roomId);
      if (!isRoomValid) {
        setRoomId('');
      }
    }
  }, [format, filteredRooms, roomId]);

  const getConfigValue = (key, defaultValue) => {
    const conf = systemConfigs.find(c => c.configKey === key);
    if (conf && conf.configValue != null) {
      return parseInt(conf.configValue, 10);
    }
    return defaultValue;
  };

  const calculatedTimes = (() => {
    if (!date || !time) return null
    try {
      const startT = new Date(`${date}T${time}:00`)
      if (!isNaN(startT.getTime())) {
        const adMins = 10
        const selectedRoomObj = rooms.find(r => String(r.id) === String(roomId))
        let cleanMins = getConfigValue('CLEANING_BUFFER_DEFAULT', 15)
        if (selectedRoomObj) {
          const formats = selectedRoomObj.supportedFormats || []
          const name = (selectedRoomObj.name || '').toUpperCase()
          if (formats.includes('IMAX') || formats.includes('_IMAX') || name.includes('IMAX')) {
            cleanMins = getConfigValue('CLEANING_BUFFER_IMAX', 30)
          } else if (formats.includes('4DX') || formats.includes('_4DX') || name.includes('4DX')) {
            cleanMins = getConfigValue('CLEANING_BUFFER_4DX', 20)
          } else if (formats.includes('3D') || formats.includes('_3D') || name.includes('3D')) {
            cleanMins = getConfigValue('CLEANING_BUFFER_3D', 20)
          }
        }

        let totalMins = duration + adMins
        const remainder = totalMins % 5
        if (remainder !== 0) {
          totalMins += (5 - remainder)
        }
        const endT = new Date(startT.getTime() + totalMins * 60 * 1000)

        const bufferStart = new Date(startT.getTime() - cleanMins * 60 * 1000)
        const bufferEnd = new Date(endT.getTime() + cleanMins * 60 * 1000)

        const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })

        return {
          start: formatTime(startT),
          end: formatTime(endT),
          bufferStart: formatTime(bufferStart),
          bufferEnd: formatTime(bufferEnd),
          cleanMins
        }
      }
    } catch {
      // Ignore parsing errors for partial date/time input
    }
    return null
  })();

  const handleFormatChange = (e) => {
    const newFormat = e.target.value
    setFormat(newFormat)
    if (!isEditMode && formatPrices[newFormat]) {
      setPrice(formatPrices[newFormat])
    }
  }

  const validateForm = () => {
    const tempErrors = {}
    if (!movieId) tempErrors.movieId = 'Vui lòng chọn phim'
    if (!roomId) tempErrors.roomId = 'Vui lòng chọn phòng chiếu'
    if (!date) tempErrors.date = 'Vui lòng chọn ngày chiếu'
    if (!time) tempErrors.time = 'Vui lòng chọn giờ chiếu'
    if (!price || price <= 0) tempErrors.price = 'Giá vé phải lớn hơn 0'

    if (date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(date)
      selectedDate.setHours(0, 0, 0, 0)
      if (selectedDate <= today) {
        tempErrors.date = 'Ngày chiếu phải từ ngày mai trở đi'
      }
    }

    if (date && time) {
      const selectedTime = new Date(`${date}T${time}:00`)
      if (selectedTime <= new Date()) {
        tempErrors.time = 'Thời gian chiếu phải ở tương lai'
      }
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setToast({ message: 'Vui lòng điền đầy đủ thông tin.', type: 'danger' })
      return
    }

    setIsSubmitting(true)

    const localDateTime = new Date(`${date}T${time}:00`)
    const startTimeIso = localDateTime.toISOString()

    const calculateCGVPrices = (base, showDate) => {
      let effectiveBase = Number(base)
      let calcVip = effectiveBase * 1.2
      let calcCouple = (effectiveBase * 2) * 1.1

      if (showDate) {
        const d = new Date(showDate)
        if (d.getDay() === 3) {
          effectiveBase = effectiveBase * 0.7
          calcVip = calcVip * 0.7
          calcCouple = calcCouple * 0.7
        }
      }

      return {
        calcBase: Math.round(effectiveBase),
        calcVip: Math.round(calcVip),
        calcCouple: Math.round(calcCouple)
      }
    }

    const { calcBase, calcVip, calcCouple } = calculateCGVPrices(price, date)

    const payload = {
      movieId,
      roomId,
      startTime: startTimeIso,
      format,
      language,
      basePrice: calcBase,
      vipPrice: calcVip,
      couplePrice: calcCouple
    }

    try {
      // 1. Validate first
      const valRes = await showtimeService.validateManual(payload)
      if (valRes && !valRes.valid) {
        setToast({ message: valRes.hardErrors?.join(', ') || 'Lỗi không xác định', type: 'danger' })
        setIsSubmitting(false)
        return
      }

      if (valRes && valRes.softWarnings && valRes.softWarnings.length > 0) {
        const confirmMsg = valRes.softWarnings.join('\n') + '\n\nBạn có muốn tiếp tục lưu không?'
        if (!window.confirm(confirmMsg)) {
          setIsSubmitting(false)
          return
        }
      }

      // 2. Create or Update
      if (isEditMode) {
        await showtimeService.delete(id) // delete old
        await showtimeService.create(payload) // create new (simple approach)
        setToast({ message: 'Cập nhật lịch chiếu thành công!', type: 'success' })
      } else {
        await showtimeService.create(payload)
        setToast({ message: 'Thêm lịch chiếu mới thành công!', type: 'success' })
      }
      setTimeout(() => {
        navigate(`${basePath}/showtimes`)
      }, 1500)
    } catch (err) {
      console.error('Failed to save showtime', err)
      const serverMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
      setToast({ message: `Không thể lưu: ${serverMsg}`, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`${basePath}/showtimes`)
  }

  return (
    <div className="space-y-6 text-[#191c1e] text-left relative pb-36 bg-[#f7f9fb] min-h-[calc(100vh-80px)] p-6 rounded-2xl">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm max-w-md transition-all duration-300 animate-slide-in-up bg-white"
          style={{
            borderColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {toast.type === 'success' ? <CheckCircle className="shrink-0" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-[#5c647a] hover:text-[#b80035] uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Lịch chiếu</span>
          </button>
          <h1 className="text-3xl font-black tracking-wider uppercase text-[#191c1e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Cập nhật lịch chiếu' : 'Thêm lịch chiếu mới'}
          </h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin lịch chiếu.' : 'Tạo lịch chiếu mới cho phim tại phòng.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e0e3e5] rounded-2xl p-6 pb-48 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2 mb-4 border-b border-[#e0e3e5] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <Calendar className="text-red-500" size={18} />
              Thông tin lịch chiếu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Phim *</label>
                <select
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                >
                  <option value="">Chọn phim...</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.titleVn} ({m.duration} phút)</option>
                  ))}
                </select>
                {errors.movieId && <span className="text-xs text-red-400 mt-1">{errors.movieId}</span>}
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Định dạng *</label>
                <select
                  value={format}
                  onChange={handleFormatChange}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                >
                  {availableFormats.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Phòng chiếu *</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                  disabled={!format}
                >
                  <option value="">Chọn phòng...</option>
                  {filteredRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({(r.capacity || r.seatsCount)} ghế)</option>
                  ))}
                  {filteredRooms.length === 0 && format && (
                    <option value="" disabled>Không có phòng hỗ trợ định dạng {format}</option>
                  )}
                </select>
                {errors.roomId && <span className="text-xs text-red-400 mt-1">{errors.roomId}</span>}
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Ngôn ngữ *</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Ngày chiếu *"
                  type="date"
                  value={date}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  error={errors.date}
                />
              </div>
              <div className="flex flex-col gap-1 w-full text-left md:col-span-1" ref={timeDropdownRef}>
                <label className="text-sm font-bold text-[#5c647a] mb-1">Giờ chiếu *</label>
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                    className={`bg-[#f7f9fb] border ${errors.time ? 'border-red-400' : 'border-[#e0e3e5]'} rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full flex justify-between items-center cursor-pointer`}
                  >
                    <span>{time || 'Chọn giờ...'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      {isTimeDropdownOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isTimeDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                      {Array.from({ length: 192 }, (_, i) => {
                        const hour = Math.floor(i / 12) + 8;
                        if (hour > 23) return null;
                        const min = (i % 12) * 5;
                        const timeString = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                        return (
                          <div
                            key={timeString}
                            onClick={() => {
                              setTime(timeString)
                              setIsTimeDropdownOpen(false)
                            }}
                            className={`px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-[#ffdad6]/20 hover:text-[#b80035] transition-colors ${time === timeString ? 'bg-[#ffdad6]/40 text-[#b80035] font-bold' : 'text-[#191c1e]'
                              }`}
                          >
                            {timeString}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                {errors.time && <span className="text-xs text-red-400 mt-1">{errors.time}</span>}
              </div>
              <div className="flex flex-col gap-1 w-full text-left md:col-span-2">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Giá vé cơ bản (Base Price) *</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full"
                />
                {errors.price && <span className="text-xs text-red-400 mt-1">{errors.price}</span>}
              </div>
            </div>

            {calculatedTimes && (
              <div className="bg-[#fff0f1] p-4 rounded-xl border border-[#ffdad6] flex flex-col gap-2 text-sm text-[#5c3f40] mt-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#ffdad6]">
                  <span>Thời lượng phim:</span>
                  <span className="font-bold text-[#ba1a1a]">{duration} phút + 10 phút quảng cáo</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-[#5c647a]">Giờ chiếu thực tế:</span>
                  <span className="text-[#191c1e] font-mono font-bold">
                    {calculatedTimes.start} - {calculatedTimes.end}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Khoảng thời gian chiếm dụng phòng (kèm {calculatedTimes.cleanMins}p dọn dẹp):</span>
                  <span className="font-mono text-[#b80035] font-bold">
                    {calculatedTimes.bufferStart} - {calculatedTimes.bufferEnd}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#e0e3e5] rounded-2xl p-5 space-y-3 shadow-sm">
            <Button type="submit" disabled={isSubmitting} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Đang lưu...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 justify-center">
                  <Plus size={16} /> {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                </span>
              )}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleCancel} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
              Hủy bỏ
            </Button>
          </div>

          <div className="bg-white border border-[#e0e3e5] rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-sm font-bold text-[#191c1e] flex items-center gap-2 mb-3" style={{ fontFamily: 'Montserrat' }}>
              <CheckCircle className="text-[#00836c]" size={16} />
              Lưu ý
            </h4>
            <ul className="text-xs text-[#5c647a] space-y-2 font-medium">
              <li>• Chọn phim và phòng chiếu đã được tạo</li>
              <li>• Giờ chiếu không được trùng lặp trong cùng phòng</li>
              <li>• Giá vé có thể điều chỉnh theo suất chiếu</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
