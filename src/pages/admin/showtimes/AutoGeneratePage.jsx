import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Settings, Play, CheckCircle, Calendar as CalendarIcon, X, Trash2, Star, Clock } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Button from '../../../components/common/Button'
import { Calendar } from '../../../components/ui/calendar'
import ShowtimeTimelinePreview from './components/ShowtimeTimelinePreview'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { priceConfigService } from '../../../services/priceConfigService'
import { systemConfigService } from '../../../services/systemConfigService'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

const getMovieSupportedFormats = (movieVersion, formatPrices = {}) => {
  if (!movieVersion) return ['2D'];
  const v = movieVersion.toUpperCase();
  const formats = [];
  const systemFormats = Object.keys(formatPrices);
  if (systemFormats.length === 0) {
    if (v.includes('2D')) formats.push('2D');
    if (v.includes('3D')) formats.push('3D');
    if (v.includes('4DX')) formats.push('4DX');
    if (v.includes('IMAX')) formats.push('IMAX');
  } else {
    systemFormats.forEach(fmt => {
      if (v.includes(fmt)) formats.push(fmt);
    });
  }
  
  if (formats.length === 0) formats.push('2D');
  return formats;
}

const getMovieSupportedLanguages = (movieLanguage) => {
  if (!movieLanguage) return ['Phụ đề'];
  const l = movieLanguage.toLowerCase();
  const langs = [];
  if (l.includes('phụ đề') || l.includes('sub')) langs.push('Phụ đề');
  if (l.includes('lồng tiếng') || l.includes('dub')) langs.push('Lồng tiếng');
  return langs.length > 0 ? langs : ['Phụ đề'];
}

import { useAuth } from '../../../contexts/AuthContext'

export default function AutoGeneratePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user && user.roles?.includes('ADMIN')
  const basePath = isAdmin ? '/admin' : '/manager'
  
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [formatPrices, setFormatPrices] = useState({})
  const [systemConfigs, setSystemConfigs] = useState([])
  
  const [step, setStep] = useState(1) // 1: Setup, 2: Preview
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [existingShowtimes, setExistingShowtimes] = useState([])
  const [previewList, setPreviewList] = useState([])
  const [originalPreviewList, setOriginalPreviewList] = useState([])

  const isAuthorized = user && (user.roles?.includes('ADMIN') || user.roles?.includes('MANAGER'))

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    openTime: '08:00',
    closeTime: '23:00',
    staggerDelay: 15,
    movies: []
  })

  const location = useLocation()
  const [isImportMode, setIsImportMode] = useState(false)

  useEffect(() => {
    if (location.state?.importedPreviewList) {
      const list = location.state.importedPreviewList.map(st => ({ ...st, tempId: st.tempId || crypto.randomUUID() }));
      setPreviewList(list);
      setOriginalPreviewList(JSON.parse(JSON.stringify(list)));
      setIsImportMode(true);
      setStep(2);

      // Extract min and max dates from the imported list to set form dates
      if (list.length > 0) {
        let minDate = list[0].startTime.split('T')[0];
        let maxDate = list[0].startTime.split('T')[0];

        list.forEach(item => {
          const d = item.startTime.split('T')[0];
          if (d < minDate) minDate = d;
          if (d > maxDate) maxDate = d;
        });

        setForm(prev => ({
          ...prev,
          startDate: minDate,
          endDate: maxDate
        }));
      }
    }
  }, [location.state])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, rRes, pRes, sRes] = await Promise.all([
          movieService.getAll(),
          cinemaRoomService.getAll(),
          priceConfigService.getAll(),
          systemConfigService.getAll()
        ])
        setMovies(mRes.data || [])
        const rList = rRes.data?.result || rRes.data || [];
        const sortedList = (rList.length > 0 ? rList : []).sort((a, b) => 
          String(a.name || '').localeCompare(String(b.name || ''), 'vi', { numeric: true })
        );
        setRooms(sortedList)
        setSystemConfigs(sRes.data || sRes || [])
        
        const pList = pRes || []
        const pMap = {}
        pList.forEach(p => {
          const key = p.format?.replace('_', '') || '2D'
          pMap[key] = p.basePrice
        })
        setFormatPrices(pMap)
      } catch (err) {
        console.error('Failed to load data', err)
      }
    }
    fetchData()
  }, [])

  const getConfigValue = useCallback((key, defaultVal) => {
    const conf = systemConfigs.find(c => c.configKey === key);
    if (conf && conf.configValue) {
      const parsed = parseInt(conf.configValue, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return defaultVal;
  }, [systemConfigs]);

  const handleMovieToggle = (id) => {
    setForm(prev => {
      const isSelected = prev.movies.some(m => m.movieId === id);
      if (!isSelected && prev.movies.length >= 3) {
        toast.error('Chỉ được tạo tự động tối đa 3 phim 1 lần!', { id: 'max-movies-error' });
        return prev;
      }
      
      const movie = movies.find(m => m.id === id);
      const defaultFormat = getMovieSupportedFormats(movie?.version, formatPrices)[0]; // Use the first available format as default
      const defaultLanguage = getMovieSupportedLanguages(movie?.language)[0];
      const isAnimation = Array.isArray(movie?.genres)
        ? movie.genres.some(g => (g?.name || g || '').toString().toLowerCase().includes('hoạt hình'))
        : false;

      return {
        ...prev,
        movies: isSelected 
          ? prev.movies.filter(m => m.movieId !== id) 
          : [...prev.movies, { movieId: id, formats: [defaultFormat], languages: [defaultLanguage], maxShowtimes: '', isPriority: false }]
      };
    });
  }

  const handleUpdateMovieOption = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      movies: prev.movies.map(m => m.movieId === id ? { ...m, [field]: value } : m)
    }));
  }


  const handleFormatToggle = (id, format) => {
    setForm(prev => {
      return {
        ...prev,
        movies: prev.movies.map(m => {
          if (m.movieId !== id) return m;
          const formats = m.formats || [];
          const hasFormat = formats.includes(format);
          if (hasFormat && formats.length === 1) {
            toast.error('Phải chọn ít nhất 1 định dạng cho phim!', { id: 'min-format-error' });
            return m;
          }
          return {
            ...m,
            formats: hasFormat ? formats.filter(f => f !== format) : [...formats, format]
          };
        })
      };
    });
  }

  const handleLanguageToggle = (id, lang) => {
    setForm(prev => {
      return {
        ...prev,
        movies: prev.movies.map(m => {
          if (m.movieId !== id) return m;
          const languages = m.languages || [];
          const hasLang = languages.includes(lang);
          if (hasLang && languages.length === 1) {
            toast.error('Phải chọn ít nhất 1 ngôn ngữ cho phim!', { id: 'min-lang-error' });
            return m;
          }
          return {
            ...m,
            languages: hasLang ? languages.filter(l => l !== lang) : [...languages, lang]
          };
        })
      };
    });
  }

  const handleGenerate = async () => {
    if (!form.startDate || !form.endDate || form.movies.length === 0) {
      setError('Vui lòng chọn đầy đủ Ngày và Phim!')
      return
    }

    if (form.movies.length > 3) {
      setError('Chỉ được tạo tự động tối đa 3 phim 1 lần!')
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

    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 2) {
      setError('Chỉ cho phép tạo tự động tối đa 3 ngày cùng lúc để tránh quá tải hệ thống!')
      return
    }
    
    if (form.openTime >= form.closeTime) {
      setError('Giờ mở cửa phải trước giờ đóng cửa!')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      // Find the first room that has a valid cinema ID
      const validRoom = rooms.find(r => r.cinemaId || r.cinema?.id);
      const cinemaId = validRoom?.cinemaId || validRoom?.cinema?.id;
      
      if (!cinemaId) {
        setError('Không tìm thấy thông tin rạp (Cinema ID)!')
        setLoading(false)
        return
      }

      const mapFormatToEnum = (fmt) => {
        if (fmt === '2D') return '_2D'
        if (fmt === '3D') return '_3D'
        if (fmt === '4DX') return '_4DX'
        return fmt
      }

      const requestPayload = {
        cinema_id: cinemaId,
        movies: form.movies.flatMap(m => {
          const res = [];
          const formats = m.formats || (m.format ? [m.format] : []);
          for (const fmt of formats) {
            if (m.languages && m.languages.length > 0) {
              for (const lang of m.languages) {
                res.push({ 
                  movieId: m.movieId, 
                  format: mapFormatToEnum(fmt), 
                  language: lang,
                  maxShowtimes: m.maxShowtimes ? parseInt(m.maxShowtimes) : null,
                  isPriority: m.isPriority || false
                });
              }
            } else {
              res.push({ 
                movieId: m.movieId, 
                format: mapFormatToEnum(fmt),
                maxShowtimes: m.maxShowtimes ? parseInt(m.maxShowtimes) : null,
                isPriority: m.isPriority || false
              });
            }
          }
          return res;
        }),
        startTime: form.openTime + ":00",
        endTime: form.closeTime + ":00",
        startDate: form.startDate,
        endDate: form.endDate,
        staggerDelay: form.staggerDelay || 15
      }

      const res = await showtimeService.autoGenerate(requestPayload)
      
      const listWithIds = (res || []).map(st => ({ ...st, tempId: st.tempId || crypto.randomUUID() }));
      setPreviewList(listWithIds);
      setOriginalPreviewList(JSON.parse(JSON.stringify(listWithIds)));
      
      try {
        const existingData = await showtimeService.getAll();
        const filteredExisting = existingData.filter(st => {
            if (!st.startTime) return false;
            const stDate = st.startTime.split('T')[0];
            return stDate >= form.startDate && stDate <= form.endDate;
        });
        setExistingShowtimes(filteredExisting.map(st => ({
            ...st,
            isManual: true,
            tempId: 'manual-' + st.id,
            room_id: st.roomId,
            movieTitle: st.movie,
            durationMinutes: st.endTime ? (new Date(st.endTime) - new Date(st.startTime)) / 60000 : 120
        })));
      } catch (e) {
          console.error("Failed to fetch existing showtimes for preview", e);
      }
      
      setStep(2)
    } catch (err) {
      setError('Lỗi khi chạy thuật toán: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans -m-6 p-6 min-h-[calc(100vh-80px)] overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <button
            onClick={() => {
              if (step === 2 && !isImportMode) setStep(1)
              else navigate(`${basePath}/showtimes`)
            }}
            className="flex items-center gap-1.5 text-xs text-[#5c647a] hover:text-[#b80035] uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{(step === 2 && !isImportMode) ? 'Quay lại Cài đặt' : 'Quay lại Quản lý Lịch chiếu'}</span>
          </button>
          <h2 className="text-[32px] leading-tight font-semibold text-[#191c1e] flex items-center gap-3">
            <Settings className="text-[#b80035]" size={28} />
            {step === 1 ? 'Thuật toán tạo lịch chiếu' : (isImportMode ? 'Xem trước Lịch chiếu nhập từ Excel' : 'Xem trước Lịch chiếu (Preview)')}
          </h2>
        </div>
        
        {step === 1 && (
          <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-[#b80035] hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
            {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <Play size={18} />}
            Chạy Thuật Toán
          </button>
        )}
      </div>

      <div className="flex-1 bg-white border border-[#e5bdbe] rounded-2xl overflow-hidden shadow-sm p-6">
        {error && (
          <div className="mb-6 p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] font-bold rounded-xl text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left: Time configs */}
              <div className="space-y-6">
                <div>
                  <h5 className="text-[#191c1e] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[#e0e3e5] pb-2">Khoảng thời gian</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Từ ngày</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className={`w-full flex items-center justify-between bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] outline-none hover:border-[#b80035] cursor-pointer transition-colors ${!form.startDate && "text-gray-500"}`}>
                            {form.startDate ? format(parseISO(form.startDate), "dd/MM/yyyy", { locale: vi }) : <span>DD/MM/YYYY</span>}
                            <CalendarIcon className="h-4 w-4 text-[#5c647a]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[200] bg-white border border-[#e0e3e5] rounded-xl shadow-xl" align="start">
                          <Calendar mode="single" selected={form.startDate ? parseISO(form.startDate) : undefined} onSelect={(date) => date && setForm({...form, startDate: format(date, 'yyyy-MM-dd')})} initialFocus locale={vi} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Đến ngày</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className={`w-full flex items-center justify-between bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] outline-none hover:border-[#b80035] cursor-pointer transition-colors ${!form.endDate && "text-gray-500"}`}>
                            {form.endDate ? format(parseISO(form.endDate), "dd/MM/yyyy", { locale: vi }) : <span>DD/MM/YYYY</span>}
                            <CalendarIcon className="h-4 w-4 text-[#5c647a]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[200] bg-white border border-[#e0e3e5] rounded-xl shadow-xl" align="start">
                          <Calendar mode="single" selected={form.endDate ? parseISO(form.endDate) : undefined} onSelect={(date) => date && setForm({...form, endDate: format(date, 'yyyy-MM-dd')})} initialFocus locale={vi} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-[#191c1e] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[#e0e3e5] pb-2">Khung giờ hoạt động</h5>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Mở cửa</label>
                      <input type="time" value={form.openTime} onChange={e => setForm({...form, openTime: e.target.value})} className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#b80035] outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Đóng cửa</label>
                      <input type="time" value={form.closeTime} onChange={e => setForm({...form, closeTime: e.target.value})} className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#b80035] outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold flex items-center gap-1">
                        <Clock size={12} />
                        So le giữa các phòng (phút)
                      </label>
                      <select
                        value={form.staggerDelay}
                        onChange={e => setForm({...form, staggerDelay: parseInt(e.target.value)})}
                        className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#b80035] outline-none cursor-pointer"
                      >
                        {[0, 5, 10, 15, 20, 25, 30].map(v => (
                          <option key={v} value={v}>{v === 0 ? 'Không so le' : `${v} phút`}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-[#8c8c9a]">Suất chiếu giữa các phòng cùng format sẽ lệch nhau khoảng thời gian này</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Movie Selection with Format */}
              <div className="space-y-6">
                <div>
                  <h5 className="text-[#191c1e] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[#e0e3e5] pb-2">Chọn Phim & Định dạng</h5>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {movies.map(m => {
                      const isSelected = form.movies.some(mv => mv.movieId === m.id);
                      
                      return (
                        <div key={m.id} className="flex flex-col gap-2 p-3 bg-[#f7f9fb] hover:bg-[#eceef0] transition-colors rounded-xl border border-[#e0e3e5]">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={isSelected} onChange={() => handleMovieToggle(m.id)} className="w-4 h-4 rounded accent-[#b80035]" />
                            <span className="text-sm text-[#191c1e] font-medium">{m.titleVn}</span>
                          </label>
                          {isSelected && (
                            <div className="pl-7 flex flex-wrap gap-4 mt-1">
                              {getMovieSupportedFormats(m.version, formatPrices).map(fmt => {
                                const selectedMovie = form.movies.find(mv => mv.movieId === m.id);
                                const isFmtSelected = selectedMovie?.formats?.includes(fmt);
                                return (
                                  <label key={fmt} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#5c647a]">
                                    <input 
                                      type="checkbox" 
                                      checked={isFmtSelected || false} 
                                      onChange={() => handleFormatToggle(m.id, fmt)}
                                      className="w-3.5 h-3.5 rounded accent-[#00836c]" 
                                    />
                                    {fmt}
                                  </label>
                                )
                              })}
                            </div>
                          )}
                          {isSelected && getMovieSupportedLanguages(m.language).length > 0 && (
                            <div className="pl-7 flex flex-wrap gap-4 mt-1 border-t border-[#e0e3e5] pt-2">
                              <span className="text-xs text-[#b80035] font-bold w-full">Ngôn ngữ:</span>
                              {getMovieSupportedLanguages(m.language).map(lang => {
                                const selectedMovie = form.movies.find(mv => mv.movieId === m.id);
                                const isLangSelected = selectedMovie?.languages?.includes(lang);
                                return (
                                  <label key={lang} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#5c647a]">
                                    <input 
                                      type="checkbox" 
                                      checked={isLangSelected || false} 
                                      onChange={() => handleLanguageToggle(m.id, lang)}
                                      className="w-3.5 h-3.5 rounded accent-[#b80035]" 
                                    />
                                    {lang}
                                  </label>
                                )
                              })}
                            </div>
                          )}
                          {isSelected && (
                            <div className="pl-7 flex flex-wrap gap-4 mt-1 border-t border-[#e0e3e5] pt-3 pb-1 items-center">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors" title="Ưu tiên xếp Giờ Vàng (18:00 - 21:00)">
                                <input 
                                  type="checkbox" 
                                  checked={form.movies.find(mv => mv.movieId === m.id)?.isPriority || false} 
                                  onChange={(e) => handleUpdateMovieOption(m.id, 'isPriority', e.target.checked)}
                                  className="w-3.5 h-3.5 rounded accent-amber-500" 
                                />
                                <Star size={14} className="fill-amber-500 text-amber-500 shrink-0" />
                                Giờ Vàng
                              </label>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#5c647a] font-semibold">Max suất/ngày:</span>
                                <select 
                                  value={form.movies.find(mv => mv.movieId === m.id)?.maxShowtimes || ''}
                                  onChange={(e) => handleUpdateMovieOption(m.id, 'maxShowtimes', e.target.value)}
                                  className="w-32 bg-white border border-[#e0e3e5] rounded py-1.5 px-2 text-xs text-[#191c1e] outline-none focus:border-[#b80035] cursor-pointer font-medium"
                                >
                                  <option value="">Không giới hạn</option>
                                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num} suất</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ShowtimeTimelinePreview
            previewList={previewList}
            setPreviewList={setPreviewList}
            originalPreviewList={originalPreviewList}
            movies={movies}
            rooms={rooms}
            formatPrices={formatPrices}
            existingShowtimes={existingShowtimes}
            setExistingShowtimes={setExistingShowtimes}
            form={form}
            isImportMode={isImportMode}
            onBack={() => setStep(1)}
            basePath={basePath}
            getConfigValue={getConfigValue}
          />
        )}
      </div>
    </div>
  )
}
