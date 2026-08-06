import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { movieService } from '../../../services/movieService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { 
  ArrowLeft, Plus, Trash2, Upload, Film, Calendar, 
  Clock, Globe, Languages, Tag, User, PlusCircle, CheckCircle, AlertCircle, X 
} from 'lucide-react'

export default function MovieFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin'
  
  const isEditMode = !!id

  // Helper: trả về "YYYY-MM-DD" theo local timezone (tránh lệch 1 ngày so với UTC)
  const todayStr = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  
  // State for reference data
  const [genres, setGenres] = useState([])
  const [countries, setCountries] = useState([])
  const [cinemaRooms, setCinemaRooms] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  // Form states
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
  const [language, setLanguage] = useState('Tiếng Việt - Phụ đề Tiếng Anh')
  const [trailerUrl, setTrailerUrl] = useState('')
  
  // Categorization states
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedCountries, setSelectedCountries] = useState([])
  
  // Dynamic lists states
  const [actors, setActors] = useState([{ fullName: '', characterName: '' }])

  // File states
  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)

  // UI feedback states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [hasActiveShowtimes, setHasActiveShowtimes] = useState(false)

  const isLoadedRef = useRef(false)

  // Mark form as loaded once reference data & movie details are loaded
  useEffect(() => {
    if (!loadingRefs) {
      const timer = setTimeout(() => {
        isLoadedRef.current = true
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [loadingRefs])

  // Monitor form fields for changes to set dirty status
  useEffect(() => {
    if (isLoadedRef.current) {
      setIsDirty(true)
    }
  }, [
    titleVn, titleEn, description, director, durationMinutes, rating,
    selectedVersions, fromDate, toDate, language, trailerUrl, selectedGenres,
    selectedCountries, actors, posterFile
  ])

  const handleCancel = () => {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      navigate(`${basePath}/movies`)
    }
  }

  // Fetch reference data on load
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [genresRes, countriesRes, roomsRes] = await Promise.all([
          movieService.getGenres(),
          movieService.getCountries(),
          movieService.getCinemaRooms()
        ])
        
        setGenres(genresRes.result || genresRes.data?.result || [])
        setCountries(countriesRes.result || countriesRes.data?.result || [])
        setCinemaRooms(roomsRes.result || roomsRes.data?.result || [])

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
            } else {
              setSelectedVersions(['2D'])
            }
            setFromDate(movie.releaseDate || '')
            setOriginalFromDate(movie.releaseDate || '')
            setToDate(movie.endDate || '')
            setLanguage(movie.language || 'Tiếng Việt - Phụ đề Tiếng Anh')
            setTrailerUrl(movie.trailerUrl || '')
            if (movie.posterUrl) setPosterPreview(movie.posterUrl)
            
            if (movie.genres) setSelectedGenres(movie.genres.map(g => g.id))
            if (movie.countries) setSelectedCountries(movie.countries.map(c => c.id))
            if (movie.actors) setActors(movie.actors.map(a => ({ fullName: a.fullName, characterName: a.characterName || '' })))
            if (movie.hasActiveShowtimes) setHasActiveShowtimes(true)
          }
        }
      } catch (err) {
        console.error('Failed to load form reference data or movie data', err)
        showToast('Không thể tải dữ liệu. Vui lòng thử lại.', 'danger')
      } finally {
        setLoadingRefs(false)
      }
    }
    fetchReferences()
  }, [id, isEditMode])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Handle Poster selection and preview
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPosterFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPosterPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Genre selection helpers
  const toggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId))
    } else {
      setSelectedGenres([...selectedGenres, genreId])
    }
  }

  // Country selection helpers
  const toggleCountry = (countryId) => {
    if (selectedCountries.includes(countryId)) {
      setSelectedCountries(selectedCountries.filter(id => id !== countryId))
    } else {
      setSelectedCountries([...selectedCountries, countryId])
    }
  }

  // Actors list helpers
  const handleAddActor = () => {
    setActors([...actors, { fullName: '', characterName: '' }])
  }

  const handleRemoveActor = (index) => {
    setActors(actors.filter((_, i) => i !== index))
  }

  const handleActorChange = (index, field, value) => {
    const newActors = [...actors]
    newActors[index][field] = value
    setActors(newActors)
  }

  // Validation
  const validateForm = () => {
    const tempErrors = {}
    if (!titleVn.trim()) tempErrors.titleVn = 'Tên phim (tiếng Việt) không được để trống'
    if (!description.trim()) tempErrors.description = 'Mô tả phim không được để trống'
    if (!director.trim()) tempErrors.director = 'Tên đạo diễn không được để trống'
    if (!durationMinutes || isNaN(durationMinutes) || Number(durationMinutes) < 30) {
      tempErrors.durationMinutes = 'Thời lượng phim tối thiểu 30 phút'
    } else if (Number(durationMinutes) > 600) {
      tempErrors.durationMinutes = 'Thời lượng phim tối đa 600 phút'
    }
    if (selectedVersions.length === 0) {
      tempErrors.version = 'Chọn ít nhất 1 phiên bản chiếu cho phim'
    }
    if (!fromDate) {
      tempErrors.fromDate = 'Ngày bắt đầu chiếu không được để trống'
    } else {
      const today = todayStr()
      const isEditingOldPastDate = isEditMode && fromDate < today && fromDate === originalFromDate
      if (!isEditingOldPastDate && fromDate < today) {
        tempErrors.fromDate = 'Ngày khởi chiếu phải từ hôm nay trở đi'
      }
    }
    if (!toDate) {
      tempErrors.toDate = 'Ngày kết thúc chiếu không được để trống'
    } else if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      tempErrors.toDate = 'Ngày kết thúc chiếu phải sau ngày bắt đầu chiếu'
    }
    if (selectedGenres.length === 0) {
      tempErrors.genres = 'Chọn ít nhất 1 thể loại cho phim'
    }
    
    // Validate actors
    const invalidActors = actors.some(act => !act.fullName.trim())
    if (invalidActors) {
      tempErrors.actors = 'Vui lòng điền tên đầy đủ cho tất cả diễn viên đã thêm'
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      showToast('Vui lòng kiểm tra lại các thông tin nhập liệu.', 'danger')
      return
    }

    setIsSubmitting(true)

    // Build the movie request body object
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
        showToast('Cập nhật phim thành công!', 'success')
      } else {
        await movieService.createAdmin(movieData, posterFile)
        showToast('Thêm phim mới thành công!', 'success')
      }
      setTimeout(() => {
        navigate(`${basePath}/movies`)
      }, 1500)
    } catch (err) {
      console.error('Failed to save movie', err)
      const serverMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
      showToast(`Không thể lưu phim: ${serverMsg}`, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 text-[var(--color-on-surface-variant)] text-left relative pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-md transition-all duration-300 animate-slide-in-up"
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
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Phim</span>
          </button>
          <h1 
            className="text-4xl text-[var(--color-on-surface)] font-black tracking-wider uppercase" 
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isEditMode ? 'Cập nhật phim' : 'Thêm phim mới'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin phim, poster và lịch chiếu.' : 'Khai báo thông tin chi tiết, thể loại, quốc gia sản xuất, dàn diễn viên và lập lịch chiếu phim tại rạp.'}
          </p>
        </div>
      </div>

      {hasActiveShowtimes && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex gap-3 items-start animate-fade-in">
          <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-1">
              Phim đang có suất chiếu kích hoạt
            </h4>
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              Vì bộ phim này hiện đang có các suất chiếu được lên lịch trên hệ thống, bạn <strong>chỉ được phép sửa đổi Ngày kết thúc chiếu</strong>. 
              Các thông tin khác như thời lượng, phiên bản, thể loại... đã bị khoá để đảm bảo tính nhất quán của lịch chiếu.
            </p>
          </div>
        </div>
      )}

      {loadingRefs ? (
        <div className="py-20 flex flex-col justify-center items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl">
          <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
          <p className="text-sm text-gray-400">Đang tải cấu hình hệ thống...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main info inputs (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Information Section */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-2 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
                <Film className="text-red-500" size={18} />
                Thông tin chung
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tên phim (tiếng Việt) *"
                  placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước"
                  value={titleVn}
                  onChange={(e) => setTitleVn(e.target.value)}
                  error={errors.titleVn}
                  disabled={hasActiveShowtimes}
                />
                
                <Input
                  label="Tên phim (tiếng Anh)"
                  placeholder="Ví dụ: Face Off 7: One Wish"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  disabled={hasActiveShowtimes}
                />
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Mô tả phim *
                </label>
                <textarea
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full h-32 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nhập nội dung tóm tắt cốt truyện của phim..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={hasActiveShowtimes}
                />
                {errors.description && <span className="text-xs text-red-400 mt-1">{errors.description}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Đạo diễn *"
                  placeholder="Ví dụ: Lý Hải"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  error={errors.director}
                  disabled={hasActiveShowtimes}
                />
                
                <Input
                  label="Thời lượng (phút) *"
                  type="number"
                  placeholder="Ví dụ: 138"
                  value={durationMinutes}
                  min={30}
                  max={600}
                  step={1}
                  inputMode="numeric"
                  disabled={hasActiveShowtimes}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                      e.preventDefault()
                    }
                  }}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      setDurationMinutes('')
                      return
                    }
                    const n = parseInt(raw, 10)
                    if (Number.isNaN(n)) {
                      setDurationMinutes('')
                      return
                    }
                    if (n < 30) {
                      setDurationMinutes('30')
                      return
                    }
                    if (n > 600) {
                      setDurationMinutes('600')
                      return
                    }
                    setDurationMinutes(String(n))
                  }}
                  error={errors.durationMinutes}
                />

                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
                    Độ tuổi giới hạn (Rating)
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    disabled={hasActiveShowtimes}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="P">P (Mọi lứa tuổi)</option>
                    <option value="K">K (Dưới 13 tuổi xem cùng phụ huynh)</option>
                    <option value="T13">T13 (Từ 13 tuổi trở lên)</option>
                    <option value="T16">T16 (Từ 16 tuổi trở lên)</option>
                    <option value="T18">T18 (Từ 18 tuổi trở lên)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2">
                    Phiên bản chiếu *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['2D', '3D', '4DX', 'IMAX'].map(v => {
                      const isChecked = selectedVersions.includes(v)
                      return (
                        <button
                          key={v}
                          type="button"
                          disabled={hasActiveShowtimes}
                          onClick={() => {
                            if (isChecked) {
                              if (selectedVersions.length > 1) {
                                setSelectedVersions(selectedVersions.filter(x => x !== v))
                              }
                            } else {
                              setSelectedVersions([...selectedVersions, v])
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                            ${isChecked 
                              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm' 
                              : 'bg-[var(--color-surface-container)] border-[var(--color-border)] text-[var(--color-on-surface-variant)] hover:border-red-500 hover:text-[var(--color-on-surface)]'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-red-500' : 'bg-[var(--color-text-muted)]'}`}></span>
                          <span>{v}</span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.version && <span className="text-xs text-red-400 mt-1">{errors.version}</span>}
                </div>

                <Input
                  label="Ngôn ngữ bản phim"
                  placeholder="Ví dụ: Tiếng Việt - Phụ đề Tiếng Anh"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={hasActiveShowtimes}
                />

                <Input
                  label="Trailer URL (Youtube)"
                  placeholder="Ví dụ: https://youtube.com/watch?v=..."
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  disabled={hasActiveShowtimes}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Khởi chiếu từ ngày *"
                  type="date"
                  value={fromDate}
                  disabled={hasActiveShowtimes}
                  min={(() => {
                    // Trong edit mode, nếu fromDate cũ thuộc quá khứ, vẫn cho giữ
                    if (isEditMode && fromDate && fromDate < todayStr()) return fromDate
                    return todayStr()
                  })()}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) { setFromDate(v); return }
                    if (isEditMode && fromDate && fromDate < todayStr() && v === fromDate) {
                      setFromDate(v); return
                    }
                    if (v < todayStr()) {
                      setFromDate(todayStr())
                      return
                    }
                    setFromDate(v)
                  }}
                  error={errors.fromDate}
                />

                <Input
                  label="Chiếu đến ngày *"
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
                    if (v < minAllowed) {
                      setToDate(minAllowed)
                      return
                    }
                    if (fromDate) {
                      const maxDate = new Date(fromDate)
                      maxDate.setDate(maxDate.getDate() + 90)
                      const maxStr = maxDate.toISOString().slice(0, 10)
                      if (v > maxStr) {
                        setToDate(maxStr)
                        return
                      }
                    }
                    setToDate(v)
                  }}
                  error={errors.toDate}
                />
              </div>
            </div>

            {/* Cast & Crew Section */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
                <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                  <User className="text-red-500" size={18} />
                  Dàn diễn viên (Cast)
                </h3>
                <button
                  type="button"
                  onClick={handleAddActor}
                  disabled={hasActiveShowtimes}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle size={14} /> Add Actor
                </button>
              </div>

              {errors.actors && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 font-bold rounded-lg text-xs leading-normal">
                  ⚠️ {errors.actors}
                </div>
              )}

              {actors.length > 0 && (
                <div className="flex gap-3 px-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 hidden md:flex">
                  <span className="w-6 text-center">STT</span>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <span>Tên diễn viên (FullName) *</span>
                    <span>Vai diễn (CharacterName)</span>
                  </div>
                  {actors.length > 1 && <span className="w-8"></span>}
                </div>
              )}

              <div className="space-y-3">
                {actors.map((actor, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[var(--color-surface-container)] p-3 rounded-xl border border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-text-muted)] font-bold w-6 text-center">{index + 1}</span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 w-full text-left">
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase md:hidden">
                          Tên diễn viên (FullName) *
                        </label>
                        <input
                          type="text"
                          placeholder="Tên diễn viên (FullName) *"
                          value={actor.fullName}
                          disabled={hasActiveShowtimes}
                          onChange={(e) => handleActorChange(index, 'fullName', e.target.value)}
                          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs text-[var(--color-on-surface)] placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors w-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-full text-left">
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase md:hidden">
                          Vai diễn (CharacterName)
                        </label>
                        <input
                          type="text"
                          placeholder="Vai diễn (CharacterName)"
                          value={actor.characterName}
                          disabled={hasActiveShowtimes}
                          onChange={(e) => handleActorChange(index, 'characterName', e.target.value)}
                          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs text-[var(--color-on-surface)] placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors w-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {actors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveActor(index)}
                        disabled={hasActiveShowtimes}
                        className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Categorizations & Poster (Right Column) */}
          <div className="space-y-6">
            
            {/* Movie Poster Upload */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl text-center">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center justify-center gap-2 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
                <Upload className="text-red-500" size={18} />
                Ảnh Poster phim
              </h3>

              <div className="relative group mx-auto w-56 h-80 rounded-2xl overflow-hidden border border-dashed border-white/20 bg-black/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-red-500/50">
                {posterPreview ? (
                  <>
                    <img 
                      src={posterPreview} 
                      alt="Poster Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Upload size={14} /> Thay thế ảnh
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-gray-600">image</span>
                    <span className="text-xs text-gray-400 font-semibold px-4">Tải lên ảnh poster phim (.jpg, .png)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={hasActiveShowtimes}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              {posterFile && (
                <div className="text-xs text-gray-400 truncate max-w-full">
                  File: {posterFile.name} ({(posterFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Genres Selector */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
                <Tag className="text-red-500" size={18} />
                Thể loại *
              </h3>
              
              {errors.genres && (
                <div className="text-xs text-red-400 font-bold">
                  ⚠️ {errors.genres}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {genres.map(genre => {
                  const isChecked = selectedGenres.includes(genre.id)
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      disabled={hasActiveShowtimes}
                      onClick={() => toggleGenre(genre.id)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                        ${isChecked 
                          ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm' 
                          : 'bg-[var(--color-surface-container)] border-[var(--color-border)] text-[var(--color-on-surface-variant)] hover:border-red-500 hover:text-[var(--color-on-surface)]'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-red-500' : 'bg-[var(--color-text-muted)]'}`}></span>
                      <span className="truncate">{genre.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Countries Selector */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
                <Globe className="text-red-500" size={18} />
                Quốc gia
              </h3>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {countries.map(country => {
                  const isChecked = selectedCountries.includes(country.id)
                  return (
                    <button
                      key={country.id}
                      type="button"
                      disabled={hasActiveShowtimes}
                      onClick={() => toggleCountry(country.id)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                        ${isChecked 
                          ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm' 
                          : 'bg-[var(--color-surface-container)] border-[var(--color-border)] text-[var(--color-on-surface-variant)] hover:border-red-500 hover:text-[var(--color-on-surface)]'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-red-500' : 'bg-[var(--color-text-muted)]'}`}></span>
                      <span className="truncate">{country.name} ({country.code})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 uppercase tracking-wider font-extrabold"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Đang lưu phim...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Plus size={16} /> {isEditMode ? 'Cập nhật phim' : 'Lưu phim mới'}
                  </span>
                )}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={handleCancel}
                className="w-full py-3.5 uppercase tracking-wider font-extrabold"
              >
                Hủy bỏ
              </Button>
            </div>

          </div>

        </form>
      )}

      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.45)', 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-left">
            <h4 className="font-bold text-[var(--color-on-surface)] text-sm uppercase tracking-wider mb-2">
              Xác nhận thoát
            </h4>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed font-sans">
              Bạn có các thay đổi chưa lưu. Bạn có chắc chắn muốn thoát và hủy bỏ toàn bộ thay đổi này không?
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
                  navigate(`${basePath}/movies`)
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
