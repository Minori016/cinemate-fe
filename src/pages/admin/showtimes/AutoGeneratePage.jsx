import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Settings, Play, CheckCircle, Calendar as CalendarIcon, X, Trash2 } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { priceConfigService } from '../../../services/priceConfigService'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

const getRoomDetails = (room) => {
  const nameLower = room.name?.toLowerCase() || ''
  if (nameLower.includes('imax')) {
    return { icon: 'videocam', iconColor: 'text-[#ba1a1a]', sub: 'IMAX' }
  }
  if (nameLower.includes('vip') || nameLower.includes('gold')) {
    return { icon: 'star', iconColor: 'text-[#e11d48]', sub: 'VIP' }
  }
  if (nameLower.includes('3d') || nameLower.includes('4d')) {
    return { icon: 'tv', iconColor: 'text-[#00836c]', sub: '3D/4D' }
  }
  return { icon: 'speaker', iconColor: 'text-[#565e74]', sub: 'Standard' }
}

const diagonalHatch = "data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-2,10 L10,-2 M-2,2 L2,-2 M6,10 L10,6' stroke='%23e0e3e5' stroke-width='1' fill='none' opacity='0.5'/%3E%3C/svg%3E"

const getMovieSupportedFormats = (movieVersion) => {
  if (!movieVersion) return ['2D'];
  const v = movieVersion.toUpperCase();
  const formats = [];
  if (v.includes('2D')) formats.push('2D');
  if (v.includes('3D')) formats.push('3D');
  if (v.includes('4DX')) formats.push('4DX');
  if (v.includes('IMAX')) formats.push('IMAX');
  
  if (formats.length === 0) formats.push('2D'); // Fallback if no matching standard format is found
  return formats;
}

import { useAuth } from '../../../contexts/AuthContext'

export default function AutoGeneratePage() {
  const { user } = useAuth()
  const timelineContainerRef = useRef(null)
  const navigate = useNavigate()
  const isAdmin = user && user.roles?.includes('ADMIN')
  const basePath = isAdmin ? '/admin' : '/manager'
  
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  
  const [step, setStep] = useState(1) // 1: Setup, 2: Preview
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewList, setPreviewList] = useState([])
  const [templateResponse, setTemplateResponse] = useState(null)
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [formatPrices, setFormatPrices] = useState({})

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    openTime: '08:00',
    closeTime: '23:00',
    movies: []
  })

  const location = useLocation()
  const [isImportMode, setIsImportMode] = useState(false)

  useEffect(() => {
    if (location.state?.importedPreviewList) {
      const list = location.state.importedPreviewList;
      setPreviewList(list);
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
        const [mRes, rRes, pRes] = await Promise.all([
          movieService.getAll(),
          cinemaRoomService.getAll(),
          priceConfigService.getAll()
        ])
        setMovies(mRes.data || [])
        setRooms(rRes.data?.result || rRes.data || [])
        
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

  const getDatesToRender = () => {
    if (!form.startDate || !form.endDate) return [];
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Array.from({ length: diffDays + 1 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }

  const getBusinessHours = () => {
    let startHour = 8;
    let endHour = 26;
    if (form.openTime && form.closeTime) {
      startHour = parseInt(form.openTime.split(':')[0], 10);
      let closeH = parseInt(form.closeTime.split(':')[0], 10);
      if (closeH <= startHour) closeH += 24;
      endHour = closeH + 3; // Buffer 3 hours for late night showtimes
    }
    return { 
      startHour, 
      endHour, 
      businessHours: endHour - startHour, 
      businessMinutes: (endHour - startHour) * 60 
    };
  };

  const datesToRender = step === 2 ? getDatesToRender() : [];

  const calculatePosition = (startTimeStr, durationMins) => {
    if (!startTimeStr) return { left: '0px', width: '0px' }
    const stDateObj = new Date(startTimeStr);
    const { startHour, businessMinutes } = getBusinessHours();
    
    // Parse form.startDate locally
    const [y, m, d] = form.startDate.split('-');
    const baseDateObj = new Date(y, m - 1, d);
    // Base is exactly at startHour of the first day
    baseDateObj.setHours(startHour, 0, 0, 0);
    
    const diffTimeMs = stDateObj.getTime() - baseDateObj.getTime();
    
    const realDaysPassed = Math.floor(diffTimeMs / (24 * 3600 * 1000));
    const remainderMs = diffTimeMs % (24 * 3600 * 1000);
    
    const minutesIntoDay = Math.floor(remainderMs / 60000);
    
    const totalMinutes = (realDaysPassed * businessMinutes) + minutesIntoDay;
    
    return {
      left: `${totalMinutes}px`,
      width: `${durationMins || 120}px`,
    }
  }

  useEffect(() => {
    if (step === 2 && timelineContainerRef.current) {
      timelineContainerRef.current.scrollTo({ left: 450, behavior: 'smooth' })
    }
  }, [step])

  const handleMovieToggle = (id) => {
    setForm(prev => {
      const isSelected = prev.movies.some(m => m.movieId === id);
      if (!isSelected && prev.movies.length >= 3) {
        toast.error('Chỉ được tạo tự động tối đa 3 phim 1 lần!', { id: 'max-movies-error' });
        return prev;
      }
      
      const movie = movies.find(m => m.id === id);
      const defaultFormat = getMovieSupportedFormats(movie?.version)[0]; // Use the first available format as default
      const isAnimation = movie?.genres?.some(g => g.name?.toLowerCase().includes('hoạt hình'));

      return {
        ...prev,
        movies: isSelected 
          ? prev.movies.filter(m => m.movieId !== id) 
          : [...prev.movies, { movieId: id, formats: [defaultFormat], languages: isAnimation ? ['Phụ đề', 'Lồng tiếng'] : [] }]
      };
    });
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
                res.push({ movieId: m.movieId, format: mapFormatToEnum(fmt), language: lang });
              }
            } else {
              res.push({ movieId: m.movieId, format: mapFormatToEnum(fmt) });
            }
          }
          return res;
        }),
        startTime: form.openTime + ":00",
        endTime: form.closeTime + ":00",
        startDate: form.startDate,
        endDate: form.endDate
      }

      const res = await showtimeService.autoGenerate(requestPayload)
      
      setPreviewList(res || [])
      setStep(2)
    } catch (err) {
      setError('Lỗi khi chạy thuật toán: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSave = async () => {
    if (previewList.length === 0) return
    
    setLoading(true)
    try {
      const calculateCGVPrices = (base) => {
        let effectiveBase = Number(base)
        return {
          calcBase: effectiveBase,
          calcVip: effectiveBase + 10000,
          calcCouple: (effectiveBase * 2) + 10000
        }
      }

      const confirmPayload = previewList.map(st => {
        const fmt = st.format || '2D'
        const baseFromConfig = formatPrices[fmt] || 70000
        const { calcBase, calcVip, calcCouple } = calculateCGVPrices(baseFromConfig)
        return {
          movie_id: st.movie_id,
          room_id: st.room_id,
          startTime: st.startTime,
          basePrice: calcBase,
          vipPrice: calcVip,
          couplePrice: calcCouple,
          format: st.format || '2D',
          language: st.language,
          status: "SCHEDULED"
        }
      })

      const res = await showtimeService.autoConfirm(confirmPayload)
      toast.success(`Đã tạo thành công ${res?.length || previewList.length} suất chiếu!`)
      navigate(`${basePath}/showtimes`)
    } catch (err) {
      setError('Lỗi khi lưu hàng loạt: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShowtime = (indexToDelete) => {
    const deletedSt = previewList[indexToDelete];
    
    const sameRoomDayList = previewList.filter(st => 
      st.room_id === deletedSt.room_id && 
      new Date(st.startTime).toDateString() === new Date(deletedSt.startTime).toDateString()
    ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    const deletedSortedIndex = sameRoomDayList.findIndex(st => st === deletedSt);
    
    let shiftMs = 0;
    if (deletedSortedIndex !== -1 && deletedSortedIndex < sameRoomDayList.length - 1) {
       shiftMs = new Date(sameRoomDayList[deletedSortedIndex + 1].startTime).getTime() - new Date(deletedSt.startTime).getTime();
    }
    
    const newList = previewList.filter((_, i) => i !== indexToDelete).map(st => {
      if (st.room_id === deletedSt.room_id && 
          new Date(st.startTime).toDateString() === new Date(deletedSt.startTime).toDateString() &&
          new Date(st.startTime).getTime() > new Date(deletedSt.startTime).getTime()) {
          
          const newStart = new Date(new Date(st.startTime).getTime() - shiftMs);
          const newEnd = new Date(new Date(st.endTime).getTime() - shiftMs);
          
          return {
            ...st,
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString()
          };
      }
      return st;
    });
    
    setPreviewList(newList);
  }

  const handleSwapShowtimes = (idx1, idx2) => {
    setPreviewList(prev => {
      const newList = [...prev];
      const st1 = { ...newList[idx1] };
      const st2 = { ...newList[idx2] };
      
      const movieKeys = ['movie_id', 'movieTitle', 'durationMinutes', 'basePrice', 'vipPrice', 'couplePrice', 'format', 'language'];
      movieKeys.forEach(key => {
        const temp = st1[key];
        st1[key] = st2[key];
        st2[key] = temp;
      });
      
      newList[idx1] = st1;
      newList[idx2] = st2;

      const recalculateRoomTimeline = (roomId) => {
        const roomSts = [];
        newList.forEach((st, i) => {
          if (st.room_id === roomId) {
            roomSts.push({ ...st, originalIndex: i });
          }
        });
        
        roomSts.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        let pushedPastMidnight = false;

        for (let i = 0; i < roomSts.length; i++) {
          const curr = roomSts[i];
          const currStart = new Date(curr.startTime);
          
          if (i === 0) {
            const currEnd = new Date(currStart.getTime() + (curr.durationMinutes + 10) * 60000);
            curr.endTime = currEnd.toISOString();
          } else {
            const prev = roomSts[i - 1];
            const prevEnd = new Date(prev.endTime);
            const prevEndWithCleaning = new Date(prevEnd.getTime() + 15 * 60000);
            
            if (prevEndWithCleaning > currStart) {
              let newStart = new Date(prevEndWithCleaning);
              const remainder = newStart.getMinutes() % 15;
              if (remainder !== 0) {
                newStart = new Date(newStart.getTime() + (15 - remainder) * 60000);
              }
              
              curr.startTime = newStart.toISOString();
              const currEnd = new Date(newStart.getTime() + (curr.durationMinutes + 10) * 60000);
              curr.endTime = currEnd.toISOString();
              
              // Cảnh báo nếu đẩy qua ngày mới so với ngày bắt đầu gốc (trừ trường hợp vốn dĩ đã là ngày mới)
              if (newStart.getDate() !== currStart.getDate()) {
                 pushedPastMidnight = true;
              }
            } else {
               const currEnd = new Date(currStart.getTime() + (curr.durationMinutes + 10) * 60000);
               curr.endTime = currEnd.toISOString();
            }
          }
          
          newList[curr.originalIndex] = curr;
        }
        
        if (pushedPastMidnight) {
           toast.warning(`Có suất chiếu ở phòng ${roomSts[0].roomName} bị đẩy sang sáng ngày hôm sau do lệch giờ!`, { duration: 5000 });
        }
      };

      recalculateRoomTimeline(st1.room_id);
      if (st1.room_id !== st2.room_id) {
        recalculateRoomTimeline(st2.room_id);
      }

      return newList;
    });
    
    toast.success('Đã hoán đổi suất chiếu thành công!');
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
        
        {step === 1 ? (
          <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-[#b80035] hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
            {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <Play size={18} />}
            Chạy Thuật Toán
          </button>
        ) : (
          <div className="flex gap-3">
            {!isImportMode && (
              <button onClick={() => setStep(1)} disabled={loading} className="px-6 py-3 bg-white border border-[#e0e3e5] text-[#5c647a] font-bold rounded-xl hover:bg-[#f7f9fb] transition-all">
                Chỉnh sửa lại
              </button>
            )}
            <button onClick={handleBatchSave} disabled={loading || previewList.length === 0} className="px-6 py-3 bg-[#00836c] hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <CheckCircle size={18} />}
              Lưu {previewList.length} Suất Chiếu
            </button>
          </div>
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
                              {getMovieSupportedFormats(m.version).map(fmt => {
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
                          {isSelected && m.genres?.some(g => g.name?.toLowerCase().includes('hoạt hình')) && (
                            <div className="pl-7 flex flex-wrap gap-4 mt-1 border-t border-[#e0e3e5] pt-2">
                              <span className="text-xs text-[#b80035] font-bold w-full">Ngôn ngữ (ưu tiên Lồng tiếng 70%):</span>
                              {['Phụ đề', 'Lồng tiếng'].map(lang => {
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Preview Calendar
          <div className="space-y-6 flex flex-col h-full overflow-hidden">
            <div className="p-4 bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] font-bold rounded-xl text-sm flex items-center gap-2 shrink-0">
              <CheckCircle size={18} />
              Thuật toán đã chạy thành công. Tạo ra {previewList.length} suất chiếu dự kiến.
            </div>
            
            <div 
              ref={timelineContainerRef}
              className="flex-1 overflow-auto custom-scrollbar flex bg-[#f7f9fb] border border-[#e5bdbe] rounded-xl relative"
            >
              <div className="flex" style={{ width: `calc(192px + ${datesToRender.length * 1440}px)` }}>
                
                {/* Sidebar (Rooms) */}
                <div className="w-48 shrink-0 sticky left-0 z-40 bg-[#f7f9fb] border-r border-[#e0e3e5] flex flex-col shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-fit min-h-full">
                  <div className="h-16 border-b border-[#e0e3e5] bg-white sticky top-0 z-50 shrink-0"></div>
                  {rooms.filter(r => {
                    const assignedIds = [...new Set(previewList.map(st => st.room_id))];
                    return assignedIds.includes(r.id);
                  }).map(room => {
                    const roomInfo = getRoomDetails(room)
                    return (
                      <div key={room.id} className="h-24 border-b border-[#e0e3e5] flex items-center px-4 gap-3 bg-white hover:bg-gray-50 transition-colors shrink-0">
                        <span className={`material-symbols-outlined ${roomInfo.iconColor}`}>{roomInfo.icon}</span>
                        <div className="min-w-0">
                          <span className="text-[12px] font-semibold text-[#191c1e] block truncate uppercase">{room.name}</span>
                          <span className="text-[10px] text-[#5c3f40] uppercase tracking-wide mt-1 block">{roomInfo.sub || (room.capacity ? `${room.capacity} Ghế` : '')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Timeline Area */}
                <div className="relative bg-[#f7f9fb]" style={{ width: `${datesToRender.length * getBusinessHours().businessMinutes}px` }}>
                  {/* Time Header */}
                  <div className="h-16 flex flex-col sticky top-0 z-30 bg-white border-b border-[#e0e3e5] shadow-sm">
                    {/* Date Row */}
                    <div className="h-8 flex bg-[#eceef0] border-b border-[#e0e3e5]">
                      {datesToRender.map((date, index) => {
                        const formattedDate = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
                        return (
                          <div key={date} 
                            className={`shrink-0 font-extrabold text-sm flex items-center border-r border-[#e0e3e5] uppercase relative ${index % 2 === 0 ? 'bg-white text-[#b80035]' : 'bg-[#f7f9fb] text-[#191c1e]'}`}
                            style={{ width: `${getBusinessHours().businessMinutes}px` }}
                          >
                            <span className="sticky left-48 px-4 tracking-wide">{formattedDate}</span>
                          </div>
                        )
                      })}
                    </div>
                    {/* Hour Row */}
                    <div className="h-8 flex">
                      {datesToRender.map((date, index) => {
                        const { startHour, businessHours, businessMinutes } = getBusinessHours();
                        const numBlocks = Math.ceil(businessHours / 2);
                        return (
                          <div key={`hours-${date}`} 
                            className={`flex shrink-0 border-r border-[#e0e3e5] border-dashed ${index % 2 === 0 ? 'bg-white' : 'bg-[#f7f9fb]'}`}
                            style={{ width: `${businessMinutes}px` }}
                          >
                            {Array.from({ length: numBlocks }).map((_, i) => (
                              <div key={i} className="w-[120px] shrink-0 flex items-center justify-center border-r border-[#e0e3e5] border-dashed text-[13px] font-bold font-mono text-[#5c647a]">
                                {String((startHour + i * 2) % 24).padStart(2, '0')}:00
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Vertical Grid Lines Background */}
                  <div className="absolute inset-0 top-16 flex pointer-events-none z-0">
                    {datesToRender.map((date, index) => {
                      const { businessHours, businessMinutes } = getBusinessHours();
                      const numBlocks = Math.ceil(businessHours / 2);
                      return (
                        <div key={`bg-${date}`} 
                          className={`flex shrink-0 border-r border-[#e0e3e5] border-dashed ${index % 2 === 0 ? 'bg-white' : 'bg-[#f7f9fb]'}`}
                          style={{ width: `${businessMinutes}px` }}
                        >
                          {Array.from({ length: numBlocks }).map((_, i) => (
                            <div key={i} 
                              className={`w-[120px] shrink-0 border-r border-[#e0e3e5] border-dashed opacity-50 h-full`}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {/* Grid Content (Room Rows & Showtimes) */}
                  <div className="relative z-10">
                    {rooms.filter(r => {
                      const assignedIds = [...new Set(previewList.map(st => st.room_id))];
                      return assignedIds.includes(r.id);
                    }).map(room => {
                      const roomShowtimes = previewList.filter(st => st.room_id === room.id)
                      return (
                        <div key={room.id} className="h-24 border-b border-[#e0e3e5] border-dashed relative">
                          {roomShowtimes.map((st) => {
                            // Find index in original previewList for deletion
                            const originalIdx = previewList.indexOf(st)
                            const { left, width } = calculatePosition(st.startTime, st.durationMinutes)
                            const isGoldenHour = st.goldenHour || st.isGoldenHour
                            const isAnimation = form.movies.find(m => m.movieId === st.movie_id)?.languages?.length > 0 || false
                            const isDubbed = isAnimation && st.language === 'Lồng tiếng'
                            
                            // Distinct Preview Colors
                            const barColor = isGoldenHour ? 'bg-[#ffb300]' : 'bg-[#4caf50]'
                            const bgColor = isDubbed ? 'bg-[repeating-linear-gradient(-45deg,#fff,#fff_6px,#fff0f2_6px,#fff0f2_12px)]' : (isGoldenHour ? 'bg-[#fff8e1]' : 'bg-[#e8f5e9]')
                            const borderColor = isGoldenHour ? 'border-[#ffe082]' : 'border-[#a5d6a7]'
                            const textColor = isGoldenHour ? 'text-[#ff6f00]' : 'text-[#2e7d32]'
                            
                            return (
                              <div
                                draggable={true}
                                onDragStart={(e) => {
                                  setDraggedIdx(originalIdx)
                                  e.dataTransfer.effectAllowed = 'move'
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.dataTransfer.dropEffect = 'move'
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  if (draggedIdx !== null && draggedIdx !== originalIdx) {
                                    handleSwapShowtimes(draggedIdx, originalIdx)
                                  }
                                  setDraggedIdx(null)
                                }}
                                onDragEnd={() => setDraggedIdx(null)}
                                key={st.tempId || originalIdx}
                                className={`absolute top-4 h-[64px] ${bgColor} border ${borderColor} rounded shadow-sm flex items-center p-2 cursor-pointer transition-all group overflow-hidden ${draggedIdx === originalIdx ? 'opacity-50 border-dashed scale-95' : 'hover:shadow-md'}`}
                                style={{ left, width }}
                              >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
                                
                                <div className="flex-1 min-w-0 ml-2 flex flex-col justify-center">
                                  <h4 className={`font-semibold text-[12px] text-[#191c1e] line-clamp-1 leading-tight mb-1`} title={st.movieTitle}>
                                    {st.movieTitle}
                                  </h4>
                                  <div className="flex gap-1.5 items-center mb-0.5">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isGoldenHour ? 'bg-[#ffe082] text-[#ff6f00]' : 'bg-[#c8e6c9] text-[#2e7d32]'}`}>
                                      {st.format}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] ${textColor} font-mono font-bold flex gap-1 items-center`}>
                                    <span>{format(parseISO(st.startTime), 'HH:mm')}</span>
                                    <span>-</span>
                                    <span>{format(parseISO(st.endTime), 'HH:mm')}</span>
                                  </p>
                                </div>

                                {/* Delete & Shift Up Button */}
                                <div className="absolute right-0 top-0 bottom-0 bg-white/80 px-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteShowtime(originalIdx); }}
                                    title="Xóa & Lùi giờ"
                                    className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors bg-white shadow-sm"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              {previewList.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-50 pointer-events-none rounded-xl">
                   <span className="material-symbols-outlined text-5xl text-[#565e74] mb-2">event_busy</span>
                   <p className="text-[#565e74] font-semibold text-sm">Không tạo được suất chiếu nào phù hợp</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
