import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { movieService } from '../../../services/movieService'
import {
  ArrowLeft, Save, Plus, Trash2, Upload, Film, Calendar,
  Clock, Globe, Languages, Tag, User, PlusCircle, CheckCircle, AlertCircle, X,
  Star, Hash, MapPin, Users, Image as ImageIcon, Sparkles, Shield, Video, BookOpen, Award
} from 'lucide-react'

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const RATING_META = {
  P: { label: 'P', desc: 'Moi lua tuoi', bg: 'bg-emerald-500', border: 'border-emerald-700' },
  K: { label: 'K', desc: 'Duoi 13 tuoi kem PH', bg: 'bg-sky-500', border: 'border-sky-700' },
  T13: { label: 'T13', desc: 'Tu 13 tuoi', bg: 'bg-amber-500', border: 'border-amber-700' },
  T16: { label: 'T16', desc: 'Tu 16 tuoi', bg: 'bg-orange-500', border: 'border-orange-700' },
  T18: { label: 'T18', desc: 'Tu 18 tuoi', bg: 'bg-rose-500', border: 'border-rose-700' },
}

const VERSION_META = {
  '2D': { color: 'sky', label: '2D' },
  '3D': { color: 'violet', label: '3D' },
  '4DX': { color: 'rose', label: '4DX' },
  IMAX: { color: 'amber', label: 'IMAX' },
}

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

function colorClass(c, active) {
  const map = {
    sky:    { on: 'border-sky-700 bg-sky-200 text-sky-900', off: 'border-slate-300 bg-white text-slate-600' },
    violet: { on: 'border-violet-700 bg-violet-200 text-violet-900', off: 'border-slate-300 bg-white text-slate-600' },
    rose:   { on: 'border-rose-700 bg-rose-200 text-rose-900', off: 'border-slate-300 bg-white text-slate-600' },
    amber:  { on: 'border-amber-700 bg-amber-200 text-amber-900', off: 'border-slate-300 bg-white text-slate-600' },
  }
  return active ? map[c].on : map[c].off
}

export default function MovieFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  // Reference data
  const [genres, setGenres] = useState([])
  const [countries, setCountries] = useState([])
  const [cinemaRooms, setCinemaRooms] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  // Form fields
  const [titleVn, setTitleVn] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [description, setDescription] = useState('')
  const [director, setDirector] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [rating, setRating] = useState('P')
  const [selectedVersions, setSelectedVersions] = useState(['2D'])
  const [fromDate, setFromDate] = useState('')
  const [originalFromDate, setOriginalFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [language, setLanguage] = useState('Tieng Viet - Phu de Tieng Anh')
  const [trailerUrl, setTrailerUrl] = useState('')

  // Categorization
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedCountries, setSelectedCountries] = useState([])

  // Dynamic actors
  const [actors, setActors] = useState([{ fullName: '', characterName: '' }])

  // Poster upload
  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const isLoadedRef = useRef(false)

  useEffect(() => {
    if (!loadingRefs) {
      const timer = setTimeout(() => { isLoadedRef.current = true }, 200)
      return () => clearTimeout(timer)
    }
  }, [loadingRefs])

  useEffect(() => {
    if (isLoadedRef.current) setIsDirty(true)
  }, [
    titleVn, titleEn, description, director, durationMinutes, rating,
    selectedVersions, fromDate, toDate, language, trailerUrl, selectedGenres,
    selectedCountries, actors, posterFile
  ])

  const handleCancel = () => {
    if (isDirty) setShowExitConfirm(true)
    else navigate('/admin/movies')
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [genresRes, countriesRes, roomsRes] = await Promise.all([
          movieService.getGenres(),
          movieService.getCountries(),
          movieService.getCinemaRooms()
        ])
        setGenres(genresRes.data?.result || [])
        setCountries(countriesRes.data?.result || [])
        setCinemaRooms(roomsRes.data?.result || [])

        if (isEditMode) {
          const movieRes = await movieService.getById(id)
          const movie = movieRes.data?.result || movieRes.data
          if (movie) {
            setTitleVn(movie.titleVn || '')
            setTitleEn(movie.titleEn || '')
            setDescription(movie.description || '')
            setDirector(movie.director || '')
            setDurationMinutes(movie.duration || '')
            setRating(movie.rating || 'P')
            if (movie.version) {
              const splitVersions = movie.version.split(',').map(v => v.trim()).filter(Boolean)
              setSelectedVersions(splitVersions.length > 0 ? splitVersions : ['2D'])
            } else setSelectedVersions(['2D'])
            setFromDate(movie.fromDate || '')
            setOriginalFromDate(movie.fromDate || '')
            setToDate(movie.toDate || '')
            setLanguage(movie.language || 'Tieng Viet - Phu de Tieng Anh')
            setTrailerUrl(movie.trailerUrl || '')
            if (movie.posterUrl) setPosterPreview(movie.posterUrl)
            if (movie.genres) setSelectedGenres(movie.genres.map(g => g.id))
            if (movie.countries) setSelectedCountries(movie.countries.map(c => c.id))
            if (movie.actors) setActors(movie.actors.map(a => ({ fullName: a.fullName, characterName: a.characterName || '' })))
          }
        }
      } catch (err) {
        console.error('Failed to load form data', err)
        showToast('Khong the tai du lieu. Vui long thu lai.', 'danger')
      } finally {
        setLoadingRefs(false)
      }
    }
    fetchReferences()
  }, [id, isEditMode])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPosterFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPosterPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const toggleGenre = (gid) => {
    setSelectedGenres(prev => prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid])
  }

  const toggleCountry = (cid) => {
    setSelectedCountries(prev => prev.includes(cid) ? prev.filter(x => x !== cid) : [...prev, cid])
  }

  const toggleVersion = (v) => {
    if (selectedVersions.includes(v)) {
      if (selectedVersions.length > 1) setSelectedVersions(prev => prev.filter(x => x !== v))
    } else setSelectedVersions(prev => [...prev, v])
  }

  const handleAddActor = () => setActors([...actors, { fullName: '', characterName: '' }])
  const handleRemoveActor = (i) => setActors(actors.filter((_, idx) => idx !== i))
  const handleActorChange = (i, field, value) => {
    const newActors = [...actors]
    newActors[i][field] = value
    setActors(newActors)
  }

  const validateForm = () => {
    const tempErrors = {}
    if (!titleVn.trim()) tempErrors.titleVn = 'Ten phim (tieng Viet) khong duoc de trong'
    if (!description.trim()) tempErrors.description = 'Mo ta phim khong duoc de trong'
    if (!director.trim()) tempErrors.director = 'Ten dao dien khong duoc de trong'
    if (!durationMinutes || isNaN(durationMinutes) || Number(durationMinutes) < 30) {
      tempErrors.durationMinutes = 'Thoi luong toi thieu 30 phut'
    } else if (Number(durationMinutes) > 600) {
      tempErrors.durationMinutes = 'Thoi luong toi da 600 phut'
    }
    if (selectedVersions.length === 0) tempErrors.version = 'Chon it nhat 1 phien ban chieu'
    if (!fromDate) {
      tempErrors.fromDate = 'Ngay bat dau chieu khong duoc de trong'
    } else {
      const today = todayStr()
      const isEditingOldPastDate = isEditMode && fromDate < today && fromDate === originalFromDate
      if (!isEditingOldPastDate && fromDate < today) {
        tempErrors.fromDate = 'Ngay khoi chieu phai tu hom nay tro di'
      }
    }
    if (!toDate) {
      tempErrors.toDate = 'Ngay ket thuc chieu khong duoc de trong'
    } else if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      tempErrors.toDate = 'Ngay ket thuc phai sau ngay bat dau'
    }
    if (selectedGenres.length === 0) tempErrors.genres = 'Chon it nhat 1 the loai'
    const invalidActors = actors.some(a => !a.fullName.trim())
    if (invalidActors) tempErrors.actors = 'Vui long dien ten day du cho tat ca dien vien'

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      showToast('Vui long kiem tra lai cac thong tin nhap lieu.', 'danger')
      return
    }

    setIsSubmitting(true)
    const movieData = {
      titleVn: titleVn.trim(),
      titleEn: titleEn.trim() || null,
      description: description.trim(),
      director: director.trim(),
      durationMinutes: parseInt(durationMinutes),
      rating: rating,
      version: selectedVersions.join(', '),
      fromDate: fromDate,
      toDate: toDate,
      language: language.trim() || null,
      trailerUrl: trailerUrl.trim() || null,
      genreIds: selectedGenres,
      countryIds: selectedCountries.length > 0 ? selectedCountries : null,
      actors: actors.filter(a => a.fullName.trim() !== '')
    }

    try {
      if (isEditMode) {
        await movieService.updateAdmin(id, movieData, posterFile)
        showToast('Cap nhat phim thanh cong!', 'success')
      } else {
        await movieService.createAdmin(movieData, posterFile)
        showToast('Them phim moi thanh cong!', 'success')
      }
      setTimeout(() => navigate('/admin/movies'), 1500)
    } catch (err) {
      console.error('Failed to save movie', err)
      const serverMsg = err.response?.data?.message || err.message || 'Loi he thong'
      showToast(`Khong the luu phim: ${serverMsg}`, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="text-left space-y-6">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2 text-sm max-w-md font-bold ${toast.type === 'danger' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-violet-50 via-rose-50 to-amber-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <button
                onClick={handleCancel}
                className="group w-12 h-12 bg-slate-900 hover:bg-red-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:scale-105"
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
                    <Film size={11} /> Movie
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  {isEditMode ? <>Cap nhat<br /><span className="text-red-600">phim</span></> : <>Them phim moi<br /><span className="text-red-600">cho rap</span></>}
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  {isEditMode ? 'Chinh sua thong tin phim, poster va lich chieu.' : 'Khai bao thong tin chi tiet, the loai, quoc gia, dien vien va lich chieu phim.'}
                </p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-lg">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Hash size={11} /> Movie ID
                </div>
                <div className="text-xl font-black font-mono tracking-tight">
                  {isEditMode ? id?.slice(0, 8) : 'NEW'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {loadingRefs ? (
        // PART_LOADING_HERE
        <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-10 h-10 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
            <p className="text-base font-black uppercase tracking-wider text-slate-700">Dang tai cau hinh...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* PART_GENERAL_HERE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            >
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                  <span className="text-xl font-black">01</span>
                </div>
                <div className="flex-1 px-5 py-3 flex items-center justify-between bg-rose-50">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Thong tin chung</h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Ten phim, mo ta, dao dien, thoi luong</p>
                  </div>
                  <Film size={20} className="text-slate-900" strokeWidth={2.5} />
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-5 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <BookOpen size={11} strokeWidth={2.5} className="text-red-600" />
                      Ten phim (Tieng Viet) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Vi du: Lat Mat 7: Mot Dieu Uoc"
                      value={titleVn}
                      onChange={(e) => setTitleVn(e.target.value)}
                      className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold ${errors.titleVn ? 'border-red-600' : 'border-slate-200'}`}
                    />
                    {errors.titleVn && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.titleVn}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Languages size={11} strokeWidth={2.5} className="text-red-600" />
                      Ten phim (Tieng Anh)
                    </label>
                    <input
                      type="text"
                      placeholder="Vi du: Face Off 7: One Wish"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Sparkles size={11} strokeWidth={2.5} className="text-red-600" />
                    Mo ta phim <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    placeholder="Nhap noi dung tom tat cot truyen..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold resize-none ${errors.description ? 'border-red-600' : 'border-slate-200'}`}
                  />
                  {errors.description && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <User size={11} strokeWidth={2.5} className="text-red-600" />
                      Dao dien <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Vi du: Ly Hai"
                      value={director}
                      onChange={(e) => setDirector(e.target.value)}
                      className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold ${errors.director ? 'border-red-600' : 'border-slate-200'}`}
                    />
                    {errors.director && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.director}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Clock size={11} strokeWidth={2.5} className="text-red-600" />
                      Thoi luong (phut) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Vi du: 138"
                      value={durationMinutes}
                      min={30} max={600} step={1} inputMode="numeric"
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault()
                      }}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') { setDurationMinutes(''); return }
                        const n = parseInt(raw, 10)
                        if (Number.isNaN(n)) { setDurationMinutes(''); return }
                        if (n < 30) { setDurationMinutes('30'); return }
                        if (n > 600) { setDurationMinutes('600'); return }
                        setDurationMinutes(String(n))
                      }}
                      className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold ${errors.durationMinutes ? 'border-red-600' : 'border-slate-200'}`}
                    />
                    {errors.durationMinutes && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.durationMinutes}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Shield size={11} strokeWidth={2.5} className="text-red-600" />
                      Do tuoi gioi han
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 font-bold focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
                    >
                      <option value="P">P (Moi lua tuoi)</option>
                      <option value="K">K (Duoi 13 kem PH)</option>
                      <option value="T13">T13 (Tu 13 tuoi)</option>
                      <option value="T16">T16 (Tu 16 tuoi)</option>
                      <option value="T18">T18 (Tu 18 tuoi)</option>
                    </select>
                  </div>
                </div>

                {/* PART_GEN_HERE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Award size={11} strokeWidth={2.5} className="text-red-600" />
                      Phien ban chieu <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['2D', '3D', '4DX', 'IMAX'].map(v => {
                        const isChecked = selectedVersions.includes(v)
                        const meta = VERSION_META[v]
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => toggleVersion(v)}
                            className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${colorClass(meta.color, isChecked)}`}
                          >
                            <div className="text-sm font-black tracking-wide">{meta.label}</div>
                          </button>
                        )
                      })}
                    </div>
                    {errors.version && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.version}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Languages size={11} strokeWidth={2.5} className="text-red-600" />
                      Ngon ngu
                    </label>
                    <input
                      type="text"
                      placeholder="Tieng Viet - Phu de Tieng Anh"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Video size={11} strokeWidth={2.5} className="text-red-600" />
                      Trailer URL (Youtube)
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={trailerUrl}
                      onChange={(e) => setTrailerUrl(e.target.value)}
                      className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Calendar size={11} strokeWidth={2.5} className="text-red-600" />
                      Khoi chieu tu ngay <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      min={(() => {
                        if (isEditMode && fromDate && fromDate < todayStr()) return fromDate
                        return todayStr()
                      })()}
                      onChange={(e) => {
                        const v = e.target.value
                        if (!v) { setFromDate(v); return }
                        if (isEditMode && fromDate && fromDate < todayStr() && v === fromDate) { setFromDate(v); return }
                        if (v < todayStr()) { setFromDate(todayStr()); return }
                        setFromDate(v)
                      }}
                      className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold cursor-pointer ${errors.fromDate ? 'border-red-600' : 'border-slate-200'}`}
                    />
                    {errors.fromDate && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.fromDate}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                      <Calendar size={11} strokeWidth={2.5} className="text-red-600" />
                      Chieu den ngay <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || todayStr()}
                      max={(() => {
                        if (!fromDate || (isEditMode && fromDate < todayStr() && fromDate === originalFromDate)) {
                          if (fromDate) {
                            const d = new Date(fromDate)
                            d.setDate(d.getDate() + 90)
                            return d.toISOString().slice(0, 10)
                          }
                          return undefined
                        }
                        const d = new Date(fromDate)
                        d.setDate(d.getDate() + 90)
                        return d.toISOString().slice(0, 10)
                      })()}
                      onChange={(e) => {
                        const v = e.target.value
                        if (!v) { setToDate(v); return }
                        const minAllowed = fromDate || todayStr()
                        if (v < minAllowed) { setToDate(minAllowed); return }
                        if (fromDate) {
                          const maxDate = new Date(fromDate)
                          maxDate.setDate(maxDate.getDate() + 90)
                          const maxStr = maxDate.toISOString().slice(0, 10)
                          if (v > maxStr) { setToDate(maxStr); return }
                        }
                        setToDate(v)
                      }}
                      className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold cursor-pointer ${errors.toDate ? 'border-red-600' : 'border-slate-200'}`}
                    />
                    {errors.toDate && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.toDate}</p>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PART_CAST_HERE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            >
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                  <span className="text-xl font-black">02</span>
                </div>
                <div className="flex-1 px-5 py-3 flex items-center justify-between bg-sky-50">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Dan dien vien (Cast)</h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Them dien vien va vai dien</p>
                  </div>
                  <Users size={20} className="text-slate-900" strokeWidth={2.5} />
                </div>
                <button
                  type="button"
                  onClick={handleAddActor}
                  className="px-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-[10px] border-l-2 border-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle size={12} strokeWidth={3} /> Them
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-3 bg-white">
                {errors.actors && (
                  <div className="p-3 bg-rose-100 border-2 border-rose-700 text-rose-900 font-bold rounded-xl text-xs flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                    <AlertCircle size={14} strokeWidth={3} />
                    {errors.actors}
                  </div>
                )}

                {actors.map((actor, index) => (
                  <div key={index} className="flex items-center gap-3 bg-rose-50/30 p-3 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                    <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-amber-300">{index + 1}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Ten dien vien (FullName) *"
                        value={actor.fullName}
                        onChange={(e) => handleActorChange(index, 'fullName', e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-all font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Vai dien (CharacterName)"
                        value={actor.characterName}
                        onChange={(e) => handleActorChange(index, 'characterName', e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-all font-bold"
                      />
                    </div>
                    {actors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveActor(index)}
                        className="text-slate-900 hover:text-white bg-white hover:bg-rose-600 p-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                      >
                        <Trash2 size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            {/* PART_RIGHT_HERE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            >
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                  <ImageIcon size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1 px-5 py-3 bg-violet-50">
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Poster phim</h2>
                </div>
              </div>

              <div className="p-5 bg-white">
                <label className="relative group block cursor-pointer">
                  <div className={`mx-auto w-full aspect-[2/3] max-w-[220px] rounded-2xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${posterPreview ? 'border-slate-900 border-solid' : 'border-slate-400 bg-rose-50/30 hover:bg-rose-50 hover:border-slate-900'}`}>
                    {posterPreview ? (
                      <>
                        <img src={posterPreview} alt="poster" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Upload size={14} strokeWidth={3} /> Thay the anh
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                          <Upload size={26} className="text-amber-300" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Tai len poster</span>
                        <span className="text-[10px] font-bold text-slate-500">.jpg, .png</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {posterFile && (
                  <p className="text-center text-[10px] font-bold text-slate-600 mt-3 truncate">
                    {posterFile.name} ({(posterFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </motion.div>

            {/* PART_GENRES_HERE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            >
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                  <Tag size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1 px-5 py-3 bg-amber-50">
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">The loai <span className="text-red-600">*</span></h2>
                </div>
              </div>

              <div className="p-5 bg-white">
                {errors.genres && (
                  <div className="mb-3 p-3 bg-rose-100 border-2 border-rose-700 text-rose-900 font-bold rounded-xl text-xs flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                    <AlertCircle size={14} strokeWidth={3} /> {errors.genres}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {genres.map(genre => {
                    const isChecked = selectedGenres.includes(genre.id)
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggleGenre(genre.id)}
                        className={`text-left px-3 py-2.5 rounded-xl border-2 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${isChecked ? 'border-slate-900 bg-amber-200 text-slate-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isChecked ? 'bg-red-600' : 'bg-slate-300'}`} />
                        <span className="truncate">{genre.name}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
                  Da chon: <span className="text-red-600">{selectedGenres.length}</span>
                </p>
              </div>
            </motion.div>

            {/* PART_COUNTRIES_HERE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            >
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                  <Globe size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1 px-5 py-3 bg-sky-50">
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Quoc gia</h2>
                </div>
              </div>

              <div className="p-5 bg-white">
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {countries.map(country => {
                    const isChecked = selectedCountries.includes(country.id)
                    return (
                      <button
                        key={country.id}
                        type="button"
                        onClick={() => toggleCountry(country.id)}
                        className={`text-left px-3 py-2.5 rounded-xl border-2 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${isChecked ? 'border-slate-900 bg-sky-200 text-slate-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isChecked ? 'bg-red-600' : 'bg-slate-300'}`} />
                        <span className="truncate flex-1">{country.name}</span>
                        {country.code && <span className="text-[9px] font-black opacity-70">{country.code}</span>}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
                  Da chon: <span className="text-red-600">{selectedCountries.length}</span>
                </p>
              </div>
            </motion.div>

            {/* PART_SUMMARY_HERE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-3"
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider text-sm rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
              >
                {isSubmitting ? 'Dang luu phim...' : <><Save size={16} strokeWidth={3} />{isEditMode ? 'Cap nhat phim' : 'Luu phim moi'}</>}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-900 font-black uppercase tracking-wider text-sm rounded-2xl border-2 border-dashed border-slate-500 transition-all cursor-pointer"
              >
                <X size={16} strokeWidth={3} /> Huy bo
              </button>
            </motion.div>
          </div>
        </form>
      )}

      {/* PART_MODAL_HERE */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
          >
            <TicketStrip count={14} />
            <div className="bg-gradient-to-br from-amber-50 to-rose-50 px-6 py-5 flex justify-between items-center border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <AlertCircle size={18} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Xac nhan thoat</h4>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Co thay doi chua luu</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                Ban co cac thay doi chua luu. Ban co chac chan muon thoat va <span className="text-rose-600 font-black">HUY BO</span> toan bo thay doi khong?
              </p>
            </div>
            <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={3} /> Huy
              </button>
              <button
                onClick={() => { setShowExitConfirm(false); navigate('/admin/movies') }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <AlertCircle size={14} strokeWidth={3} /> Thoat va Huy
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}