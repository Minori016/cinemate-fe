import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { priceConfigService } from '../../../services/priceConfigService'
import { systemConfigService } from '../../../services/systemConfigService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, Calendar, CheckCircle, AlertCircle, X, Star, Hash, Clock, Film, MapPin, Languages, DollarSign, Save, Ticket, Sparkles, ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'
import { useAuth } from '../../../contexts/AuthContext'

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

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
  const [language, setLanguage] = useState('Phu de')
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
        const mRes = await movieService.getAll()
        const mList = mRes.data || []
        setMovies(mList)
        const rRes = await cinemaRoomService.getAll()
        const rList = rRes.data?.result || rRes.data || []
        const sortedList = (Array.isArray(rList) ? rList : []).sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'vi', { numeric: true })
        );
        setRooms(sortedList)
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
        try {
          const sRes = await systemConfigService.getAll()
          setSystemConfigs(sRes.data || sRes || [])
        } catch (sErr) {
          console.error('Failed to load system configs', sErr)
        }
      } catch (err) {
        console.error('Failed to load reference data', err)
        setToast({ message: 'Khong the tai du lieu phim va phong chieu', type: 'danger' })
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
          setLanguage(st.language || 'Phu de')
          setPrice(st.price || 90000)
        } else {
          setToast({ message: 'Khong tim thay lich chieu', type: 'danger' })
        }
      }).catch(err => {
        console.error('Failed to load showtime', err)
        setToast({ message: 'Khong the tai thong tin lich chieu', type: 'danger' })
      })
    }
  }, [id, isEditMode])

  const selectedMovie = movies.find(m => m.id === movieId)
  const duration = selectedMovie?.duration || 120

  const availableFormats = useMemo(() => {
    if (!selectedMovie?.version) return ['2D'];
    const v = selectedMovie.version.toUpperCase();
    const formats = [];
    const systemFormats = Object.keys(formatPrices);
    systemFormats.forEach(fmt => {
      if (v.includes(fmt)) formats.push(fmt);
    });
    return formats.length > 0 ? formats : ['2D'];
  }, [selectedMovie, formatPrices]);

  const availableLanguages = useMemo(() => {
    if (!selectedMovie?.language) return ['Phu de'];
    const l = selectedMovie.language.toLowerCase();
    const langs = [];
    if (l.includes('phu de') || l.includes('sub')) langs.push('Phu de');
    if (l.includes('long tieng') || l.includes('dub')) langs.push('Long tieng');
    return langs.length > 0 ? langs : ['Phu de'];
  }, [selectedMovie]);

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
  }, [selectedMovie, availableFormats, availableLanguages]);

  const filteredRooms = useMemo(() => {
    if (!format) return rooms;
    return rooms.filter(r => {
      if (!r.supportedFormats || !Array.isArray(r.supportedFormats)) return false;
      return r.supportedFormats.some(f => f.replace('_', '') === format);
    });
  }, [rooms, format]);

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
    } catch {}
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
    if (!movieId) tempErrors.movieId = 'Vui long chon phim'
    if (!roomId) tempErrors.roomId = 'Vui long chon phong chieu'
    if (!date) tempErrors.date = 'Vui long chon ngay chieu'
    if (!time) tempErrors.time = 'Vui long chon gio chieu'
    if (!price || price <= 0) tempErrors.price = 'Gia ve phai lon hon 0'

    if (date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(date)
      selectedDate.setHours(0, 0, 0, 0)
      if (selectedDate <= today) {
        tempErrors.date = 'Ngay chieu phai tu ngay mai tro di'
      }
    }

    if (date && time) {
      const selectedTime = new Date(`${date}T${time}:00`)
      if (selectedTime <= new Date()) {
        tempErrors.time = 'Thoi gian chieu phai o tuong lai'
      }
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setToast({ message: 'Vui long dien day du thong tin.', type: 'danger' })
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
      const valRes = await showtimeService.validateManual(payload)
      if (valRes && !valRes.valid) {
        setToast({ message: valRes.hardErrors?.join(', ') || 'Loi khong xac dinh', type: 'danger' })
        setIsSubmitting(false)
        return
      }

      if (valRes && valRes.softWarnings && valRes.softWarnings.length > 0) {
        const confirmMsg = valRes.softWarnings.join('\n') + '\n\nBan co muon tiep tuc luu khong?'
        if (!window.confirm(confirmMsg)) {
          setIsSubmitting(false)
          return
        }
      }

      if (isEditMode) {
        await showtimeService.delete(id)
        await showtimeService.create(payload)
        setToast({ message: 'Cap nhat lich chieu thanh cong!', type: 'success' })
      } else {
        await showtimeService.create(payload)
        setToast({ message: 'Them lich chieu moi thanh cong!', type: 'success' })
      }
      setTimeout(() => {
        navigate(`${basePath}/showtimes`)
      }, 1500)
    } catch (err) {
      console.error('Failed to save showtime', err)
      const serverMsg = err.response?.data?.message || err.message || 'Loi he thong'
      setToast({ message: `Khong the luu: ${serverMsg}`, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`${basePath}/showtimes`)
  }

  return (
    <div className="text-left space-y-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2 text-sm max-w-sm font-bold ${toast.type === 'danger' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-sky-50 via-rose-50 to-amber-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <button
                onClick={handleCancel}
                className="group w-12 h-12 bg-slate-900 hover:bg-red-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:shadow-red-500/30 hover:scale-105"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" />
                    {isEditMode ? 'EDIT MODE' : 'NEW ENTRY'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Ticket size={11} /> Showtime
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  {isEditMode ? <>Cap nhat<br /><span className="text-red-600">lich chieu</span></> : <>Them lich chieu<br /><span className="text-red-600">moi cho phim</span></>}
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  {isEditMode ? 'Chinh sua thong tin lich chieu hien co.' : 'Tao lich chieu moi cho phim tai phong, dinh dang va ngon ngu.'}
                </p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-lg">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Hash size={11} /> Showtime ID
                </div>
                <div className="text-xl font-black font-mono tracking-tight">#{String(Date.now()).slice(-6)}</div>
              </div>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 01 - SHOWTIME INFO */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">01</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-rose-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Thong tin lich chieu</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Phim, phong, dinh dang va ngon ngu</p>
                </div>
                <Calendar size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Film size={11} strokeWidth={2.5} className="text-red-600" /> Phim <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={movieId} onChange={(e) => setMovieId(e.target.value)}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold cursor-pointer ${errors.movieId ? 'border-red-600' : 'border-slate-200'}`}
                  >
                    <option value="">Chon phim...</option>
                    {movies.map(m => (<option key={m.id} value={m.id}>{m.titleVn} ({m.duration} phut)</option>))}
                  </select>
                  {errors.movieId && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.movieId}</span>}
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Sparkles size={11} strokeWidth={2.5} className="text-red-600" /> Dinh dang
                  </label>
                  <select
                    value={format} onChange={handleFormatChange}
                    className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold cursor-pointer"
                  >
                    {availableFormats.map(fmt => (<option key={fmt} value={fmt}>{fmt}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <MapPin size={11} strokeWidth={2.5} className="text-red-600" /> Phong chieu <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!format}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold cursor-pointer ${errors.roomId ? 'border-red-600' : 'border-slate-200'}`}
                  >
                    <option value="">Chon phong...</option>
                    {filteredRooms.map(r => (<option key={r.id} value={r.id}>{r.name} ({(r.capacity || r.seatsCount)} ghe)</option>))}
                    {filteredRooms.length === 0 && format && (<option value="" disabled>Khong co phong ho tro dinh dang {format}</option>)}
                  </select>
                  {errors.roomId && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.roomId}</span>}
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Languages size={11} strokeWidth={2.5} className="text-red-600" /> Ngon ngu
                  </label>
                  <select
                    value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold cursor-pointer"
                  >
                    {availableLanguages.map(lang => (<option key={lang} value={lang}>{lang}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Calendar size={11} strokeWidth={2.5} className="text-red-600" /> Ngay chieu <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date" value={date}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold ${errors.date ? 'border-red-600' : 'border-slate-200'}`}
                  />
                  {errors.date && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.date}</span>}
                </div>
                <div className="md:col-span-1 relative" ref={timeDropdownRef}>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Clock size={11} strokeWidth={2.5} className="text-red-600" /> Gio chieu <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button" onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold flex justify-between items-center cursor-pointer ${errors.time ? 'border-red-600' : 'border-slate-200'}`}
                  >
                    <span>{time || 'Chon gio...'}</span>
                    <ChevronDown size={14} className={`text-slate-700 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                  </button>
                  {isTimeDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] z-50 py-1">
                      {Array.from({ length: 192 }, (_, i) => {
                        const hour = Math.floor(i / 12) + 8;
                        if (hour > 23) return null;
                        const min = (i % 12) * 5;
                        const timeString = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                        return (
                          <div
                            key={timeString}
                            onClick={() => { setTime(timeString); setIsTimeDropdownOpen(false) }}
                            className={`px-3 py-2 text-xs font-bold cursor-pointer hover:bg-red-100 transition-colors ${time === timeString ? 'bg-red-600 text-white' : 'text-slate-900'}`}
                          >
                            {timeString}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {errors.time && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.time}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <DollarSign size={11} strokeWidth={2.5} className="text-red-600" /> Gia ve co ban <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number" min={0} value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 h-[46px] font-bold ${errors.price ? 'border-red-600' : 'border-slate-200'}`}
                  />
                  {errors.price && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.price}</span>}
                </div>
              </div>

              {calculatedTimes && (
                <div className="bg-gradient-to-r from-red-100 to-amber-100 border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-dashed border-slate-300">
                    <Clock size={14} className="text-slate-900" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900">Thoi gian chieu</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border-2 border-slate-200">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Phim</p>
                      <p className="text-sm font-black text-slate-900">{duration} phut + 10p QC</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border-2 border-slate-900">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Gio chieu</p>
                      <p className="text-base font-black text-red-600 font-mono">{calculatedTimes.start} - {calculatedTimes.end}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border-2 border-slate-200">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Chiem phong (+{calculatedTimes.cleanMins}p)</p>
                      <p className="text-xs font-bold text-slate-900 font-mono">{calculatedTimes.bufferStart} - {calculatedTimes.bufferEnd}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* TOM TAT */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">S</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-sky-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Tom tat</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Thong tin chinh</p>
                </div>
                <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>
            <div className="p-6 space-y-3 bg-white">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Film size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Phim</p>
                  <p className="text-sm font-black text-slate-900 truncate">{selectedMovie?.titleVn || 'Chua chon'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Phong chieu</p>
                  <p className="text-sm font-black text-slate-900 truncate">{rooms.find(r => r.id === roomId)?.name || 'Chua chon'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ngay / Gio</p>
                  <p className="text-sm font-black text-slate-900 truncate font-mono">{date || '--'} / {time || '--'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border-2 border-slate-900">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Gia ve</p>
                  <p className="text-base font-black text-red-600">{price ? new Intl.NumberFormat('vi-VN').format(price) + ' d' : '--'}</p>
                </div>
              </div>
              {(format || language) && (
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border-2 border-slate-200">
                  <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Dinh dang / Ngon ngu</p>
                    <p className="text-sm font-black text-slate-900 truncate">{format} - {language}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* LUU Y */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-amber-100 border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 mb-1">Luu y</p>
                  <ul className="text-xs text-slate-800 space-y-1 font-bold leading-relaxed">
                    <li>-- Chon phim va phong chieu da duoc tao</li>
                    <li>-- Gio chieu khong duoc trung lap trong cung phong</li>
                    <li>-- Gia ve co the dieu chinh theo suat chieu</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-3"
          >
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="flex-1 py-4 !rounded-2xl !border-2 !border-dashed !border-slate-500 !bg-slate-600 hover:!bg-slate-500 !text-white hover:!text-white font-black uppercase tracking-wider text-xs !shadow-none transition-all"
              type="button"
            >
              <X size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={3} /> Huy bo
            </Button>
            <Button
              className="flex-1 py-4 rounded-2xl border-2 border-slate-900 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              disabled={isSubmitting} type="submit"
            >
              {isSubmitting ? 'Dang luu...' : <><Save size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={2.5} />{isEditMode ? 'Cap nhat' : 'Them moi'}</>}
            </Button>
          </motion.div>
        </div>
      </form>
    </div>
  )
}