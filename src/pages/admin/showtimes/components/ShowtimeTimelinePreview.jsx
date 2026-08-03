import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, CheckCircle, Sparkles } from 'lucide-react';
import { showtimeService } from '../../../../services/showtimeService';
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core';
import DraggableShowtime from './DraggableShowtime';
import { toast } from 'sonner';
import AIReasoningConsole from './AIReasoningConsole';

const getRoomDetails = (room) => {
  const nameLower = room.name?.toLowerCase() || '';
  const rawFormats = room.supportedFormats;
  const formats = Array.isArray(rawFormats) ? rawFormats : (typeof rawFormats === 'string' ? rawFormats.split(',') : []);
  const cleanFormats = formats.map(f => String(f).toUpperCase().replace('_', ''));

  if (cleanFormats.includes('IMAX') || nameLower.includes('imax')) {
    return { icon: 'videocam', iconColor: 'text-[#ba1a1a]', sub: 'IMAX' };
  }
  if (nameLower.includes('vip') || nameLower.includes('gold')) {
    return { icon: 'star', iconColor: 'text-[#e11d48]', sub: 'VIP' };
  }
  if (cleanFormats.includes('4DX') || nameLower.includes('4dx') || nameLower.includes('4d')) {
    return { icon: 'tv', iconColor: 'text-[#00836c]', sub: '4DX' };
  }
  if (cleanFormats.includes('3D') || nameLower.includes('3d')) {
    return { icon: 'tv', iconColor: 'text-[#00836c]', sub: '3D' };
  }
  return { icon: 'speaker', iconColor: 'text-[#565e74]', sub: 'Standard' };
};

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
};

const safeParseDate = (dateVal) => {
  if (!dateVal) return null;
  const parsed = new Date(dateVal);
  if (!isNaN(parsed.getTime())) return parsed;
  if (typeof dateVal === 'string' && dateVal.includes(' ')) {
    const fixed = new Date(dateVal.replace(' ', 'T'));
    if (!isNaN(fixed.getTime())) return fixed;
  }
  return null;
};

const safeFormatTime = (dateVal) => {
  const d = safeParseDate(dateVal);
  if (!d) return '--:--';
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toLocalISOString = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${dif}${pad(Math.floor(Math.abs(tzo) / 60))}:${pad(Math.abs(tzo) % 60)}`;
};

const normalizeFormat = (f) => f ? String(f).toUpperCase().replace('_', '') : '';
const parseRoomFormats = (r) => {
  if (!r) return [];
  if (Array.isArray(r.supportedFormats)) return r.supportedFormats.map(normalizeFormat);
  if (typeof r.supportedFormats === 'string') return r.supportedFormats.split(',').map(s => normalizeFormat(s.trim()));
  return [];
};
const isMovieSupportedInRoom = (movieId, movieTitle, room, movies, formatPrices) => {
  if (!room) return false;
  const roomFormats = parseRoomFormats(room);
  if (roomFormats.length === 0) return true;

  const movie = movies.find(m => String(m.id) === String(movieId) || m.titleVn === movieTitle);
  if (!movie) return true;

  const mVersion = (movie.version || movie.versions || '').toString();
  const movieFormats = getMovieSupportedFormats(mVersion, formatPrices).map(normalizeFormat);

  return movieFormats.some(f => roomFormats.includes(f));
};

const getSupportedFormatForRoom = (movieId, movieTitle, currentFormat, room, movies, formatPrices) => {
  if (!room) return currentFormat;
  const roomFormats = parseRoomFormats(room);
  if (roomFormats.length === 0) return currentFormat;

  const currentFormatClean = normalizeFormat(currentFormat);
  if (roomFormats.includes(currentFormatClean)) return currentFormat;

  const movie = movies.find(m => String(m.id) === String(movieId) || m.titleVn === movieTitle);
  if (!movie) return currentFormat;

  const mVersion = (movie.version || movie.versions || '').toString();
  const movieFormats = getMovieSupportedFormats(mVersion, formatPrices).map(normalizeFormat);

  const matchingFormat = movieFormats.find(f => roomFormats.includes(f));
  return matchingFormat || currentFormat;
};

const PIXELS_PER_MINUTE = 1;

const snapToGridModifier = ({ transform }) => {
  if (!transform) return transform;
  return {
    ...transform,
    x: Math.round(transform.x / (10 * PIXELS_PER_MINUTE)) * (10 * PIXELS_PER_MINUTE),
  };
};

function DroppableRoomRow({ room, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `room-${room.id}`,
    data: { isRoom: true, roomId: room.id }
  });
  return (
    <div ref={setNodeRef} className={`h-24 border-b border-dashed relative transition-colors ${isOver ? 'bg-[#b80035]/5 border-[#b80035]' : 'border-[#e0e3e5]'}`}>
      {children}
    </div>
  );
}

export default function ShowtimeTimelinePreview({
  previewList,
  setPreviewList,
  originalPreviewList,
  movies,
  rooms,
  formatPrices,
  existingShowtimes,
  setExistingShowtimes,
  form,
  isImportMode,
  onBack,
  basePath,
  getConfigValue
}) {
  const navigate = useNavigate();
  const timelineContainerRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);

  // AI optimization states
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showReasoningConsole, setShowReasoningConsole] = useState(false);
  const [aiEnhancedResult, setAiEnhancedResult] = useState(null);
  const [currentViewTab, setCurrentViewTab] = useState('algorithm'); // 'algorithm' | 'ai'
  const [aiContext, setAiContext] = useState({
    autoFillMovies: []
  });
  
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState('');
  const progressIntervalRef = useRef(null);

  const updateList = useCallback((action) => {
    if (aiEnhancedResult && currentViewTab === 'ai') {
      setAiEnhancedResult(prev => ({
        ...prev,
        enhancedList: typeof action === 'function' ? action(prev.enhancedList) : action
      }));
    } else {
      setPreviewList(action);
    }
  }, [aiEnhancedResult, currentViewTab, setPreviewList]);

  const listToRender = (aiEnhancedResult && currentViewTab === 'ai') ? aiEnhancedResult.enhancedList : previewList;

  const handleAIEnhance = async () => {
    setAiLoading(true);
    setShowAiModal(false);
    setAiProgress(0);
    setAiStatus('Khởi tạo AI và phân tích cấu trúc phòng...');
    
    progressIntervalRef.current = setInterval(() => {
      setAiProgress(prev => {
        const next = prev + 1;
        if (next === 20) setAiStatus('AI đang tính toán phân bổ dữ liệu...');
        if (next === 50) setAiStatus('Áp dụng thuật toán Gale-Shapley để tối ưu ghép cặp...');
        if (next === 75) setAiStatus('Đánh giá và tinh chỉnh thời gian dọn dẹp...');
        if (next === 90) setAiStatus('Hoàn thiện kết quả...');
        return next > 99 ? 99 : next;
      });
    }, 100);

    try {
      const [response] = await Promise.all([
        showtimeService.enhanceByAI(previewList, aiContext),
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setAiProgress(100);
      setAiStatus('Hoàn tất!');

      if (response && response.enhancedList) {
        setAiEnhancedResult(response);
        setCurrentViewTab('ai');
        toast.success(`Tối ưu hóa AI thành công!`);
      } else {
        toast.error('AI không trả về kết quả tối ưu hợp lệ.');
      }
    } catch (err) {
      toast.error('Lỗi tối ưu hóa AI: ' + (err.response?.data?.message || err.message));
    } finally {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setAiLoading(false);
    }
  };

  const handleApplyAI = () => {
    if (aiEnhancedResult && aiEnhancedResult.enhancedList) {
      setPreviewList(aiEnhancedResult.enhancedList);
      setAiEnhancedResult(null);
      setCurrentViewTab('algorithm');
      toast.success('Đã áp dụng các tối ưu đề xuất từ AI!');
    }
  };

  const handleDiscardAI = () => {
    setAiEnhancedResult(null);
    setCurrentViewTab('algorithm');
    toast.info('Đã hủy bỏ đề xuất tối ưu từ AI.');
  };

  const safeExistingShowtimes = useMemo(() => Array.isArray(existingShowtimes) ? existingShowtimes : [], [existingShowtimes]);

  const safeGetConfigValue = useCallback((key, defaultValue) => {
    if (typeof getConfigValue === 'function') {
      try {
        return getConfigValue(key, defaultValue);
      } catch (e) {
        console.error("Error calling getConfigValue:", e);
        return defaultValue;
      }
    }
    return defaultValue;
  }, [getConfigValue]);

  useEffect(() => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollTo({ left: 450, behavior: 'smooth' });
    }
  }, []);

  const getDatesToRender = useCallback(() => {
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
  }, [form.startDate, form.endDate]);

  const getBusinessHours = useCallback(() => {
    let startHour = 8;
    let endHour = 24;
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
  }, [form.openTime, form.closeTime]);

  const datesToRender = useMemo(() => getDatesToRender(), [getDatesToRender]);

  const calculatePosition = useCallback((startTimeStr, endTimeStr) => {
    if (!startTimeStr || !form.startDate || typeof form.startDate !== 'string') return { left: '0px', width: '0px' };
    const stDateObj = safeParseDate(startTimeStr);
    if (!stDateObj) return { left: '0px', width: '0px' };
    const enDateObj = safeParseDate(endTimeStr) || new Date(stDateObj.getTime() + 120 * 60000);

    let durationMins = (enDateObj.getTime() - stDateObj.getTime()) / 60000;
    if (isNaN(durationMins) || durationMins <= 0) {
      durationMins = 120;
    }

    const { startHour, businessMinutes } = getBusinessHours();

    // Parse form.startDate locally
    const parts = form.startDate.split('-');
    if (parts.length < 3) return { left: '0px', width: '0px' };
    const [y, m, d] = parts;
    const baseDateObj = new Date(y, m - 1, d);
    // Base is exactly at startHour of the first day
    baseDateObj.setHours(startHour, 0, 0, 0);

    const diffTimeMs = stDateObj.getTime() - baseDateObj.getTime();

    const realDaysPassed = Math.floor(diffTimeMs / (24 * 3600 * 1000));
    const remainderMs = diffTimeMs % (24 * 3600 * 1000);

    const minutesIntoDay = Math.floor(remainderMs / 60000);

    const totalMinutes = (realDaysPassed * businessMinutes) + minutesIntoDay;

    return {
      left: `${totalMinutes * PIXELS_PER_MINUTE}px`,
      width: `${durationMins * PIXELS_PER_MINUTE}px`,
    };
  }, [form.startDate, getBusinessHours]);

  const handleResetPreview = () => {
    if (originalPreviewList && originalPreviewList.length > 0) {
      setPreviewList(JSON.parse(JSON.stringify(originalPreviewList)));
      toast.success('Đã khôi phục lại lịch chiếu ban đầu!');
    }
  };

  const handleBatchSave = async () => {
    if (previewList.length === 0) return;

    setLoading(true);
    try {
      const calculateCGVPrices = (base) => {
        let effectiveBase = Number(base);
        let calcVip = effectiveBase * 1.2;
        let calcCouple = (effectiveBase * 2) * 1.1;

        return {
          calcBase: Math.round(effectiveBase),
          calcVip: Math.round(calcVip),
          calcCouple: Math.round(calcCouple)
        };
      };

      const confirmPayload = previewList.map(st => {
        const fmt = normalizeFormat(st.format) || '2D';
        const baseFromConfig = formatPrices[fmt] || 90000;
        const { calcBase, calcVip, calcCouple } = calculateCGVPrices(baseFromConfig);
        return {
          movie_id: st.movie_id,
          room_id: st.room_id,
          startTime: st.startTime,
          basePrice: calcBase,
          vipPrice: calcVip,
          couplePrice: calcCouple,
          format: fmt,
          language: st.language,
          status: "SCHEDULED"
        };
      });

      const res = await showtimeService.autoConfirm(confirmPayload);
      toast.success(`Đã tạo thành công ${res?.length || previewList.length} suất chiếu!`);
      navigate(`${basePath}/showtimes`);
    } catch (err) {
      toast.error('Lỗi khi lưu hàng loạt: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShowtime = useCallback((idToDelete) => {
    updateList(prev => {
      const indexToDelete = prev.findIndex(st => st.tempId === idToDelete);
      if (indexToDelete === -1) return prev;
      const deletedSt = prev[indexToDelete];

      const deletedStStart = safeParseDate(deletedSt.startTime);
      if (!deletedStStart) return prev;

      const sameRoomDayList = prev.filter(st => {
        const stStart = safeParseDate(st.startTime);
        return st.room_id === deletedSt.room_id &&
          stStart && stStart.toDateString() === deletedStStart.toDateString();
      }).sort((a, b) => safeParseDate(a.startTime) - safeParseDate(b.startTime));

      const deletedSortedIndex = sameRoomDayList.findIndex(st => st === deletedSt);

      let shiftMs = 0;
      if (deletedSortedIndex !== -1 && deletedSortedIndex < sameRoomDayList.length - 1) {
        shiftMs = safeParseDate(sameRoomDayList[deletedSortedIndex + 1].startTime).getTime() - deletedStStart.getTime();
      }

      return prev.filter((_, i) => i !== indexToDelete).map(st => {
        const stStart = safeParseDate(st.startTime);
        if (st.room_id === deletedSt.room_id && stStart &&
          stStart.toDateString() === deletedStStart.toDateString() &&
          stStart.getTime() > deletedStStart.getTime()) {

          const newStart = new Date(stStart.getTime() - shiftMs);
          const stEnd = safeParseDate(st.endTime) || new Date(stStart.getTime() + 120 * 60000);
          const newEnd = new Date(stEnd.getTime() - shiftMs);

          return {
            ...st,
            startTime: toLocalISOString(newStart),
            endTime: toLocalISOString(newEnd)
          };
        }
        return st;
      });
    });
  }, [setPreviewList, updateList]);

  const handleNudgeShowtime = useCallback((idx, shiftMinutes) => {
    updateList(prev => {
      const newList = [...prev];
      const target = { ...newList[idx] };

      const originalStart = safeParseDate(target.startTime);
      if (!originalStart) {
        toast.error('Dữ liệu giờ chiếu bị lỗi, không thể thao tác!');
        return prev;
      }

      const originalEnd = safeParseDate(target.endTime) || new Date(originalStart.getTime() + 120 * 60000);

      const newStart = new Date(originalStart.getTime() + shiftMinutes * 60000);
      const newEnd = new Date(originalEnd.getTime() + shiftMinutes * 60000);

      const openDate = new Date(newStart);
      const openTimeStr = form.openTime || '08:00';
      const [oH, oM] = openTimeStr.split(':');
      const openHour = parseInt(oH, 10) || 8;
      openDate.setHours(openHour, parseInt(oM, 10) || 0, 0, 0);

      if (newStart < openDate) {
        toast.error('Không thể nhích! Lịch chiếu vượt quá giờ mở cửa!');
        return prev;
      }

      const baseDate = new Date(originalStart);
      if (baseDate.getHours() < openHour) {
        baseDate.setDate(baseDate.getDate() - 1);
      }

      const closeTimeStr = form.closeTime || '23:00';
      const [cH, cM] = closeTimeStr.split(':');
      const closeHour = parseInt(cH, 10) || 23;

      const allowedMaxEnd = new Date(baseDate);
      if (closeHour <= openHour) {
        allowedMaxEnd.setDate(allowedMaxEnd.getDate() + 1);
      }
      allowedMaxEnd.setHours(closeHour + 1, parseInt(cM, 10) || 0, 0, 0); // closeTime + 1 hour

      if (newEnd > allowedMaxEnd) {
        toast.error('Không thể nhích! Suất chiếu kết thúc muộn quá quy định (Đóng rạp + 1 tiếng)!');
        return prev;
      }

      const sameRoomList = newList.filter((st, i) => {
        const stStart = safeParseDate(st.startTime);
        return i !== idx && String(st.room_id) === String(target.room_id) && stStart && stStart.toDateString() === newStart.toDateString();
      });

      const sameRoomManualList = safeExistingShowtimes.filter(st => {
        const stStart = safeParseDate(st.startTime);
        return String(st.room_id) === String(target.room_id) && stStart && stStart.toDateString() === newStart.toDateString();
      });

      let hasConflict = false;
      const room = rooms.find(r => String(r.id) === String(target.room_id));
      let cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_DEFAULT', 15);
      if (room) {
        const formats = parseRoomFormats(room);
        const name = (room.name || '').toUpperCase();
        if (formats.includes('IMAX') || name.includes('IMAX')) {
          cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_IMAX', 30);
        } else if (formats.includes('4DX') || name.includes('4DX')) {
          cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_4DX', 20);
        } else if (formats.includes('3D') || name.includes('3D')) {
          cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_3D', 20);
        }
      }
      const cleaningBufferMs = cleaningBufferMins * 60000;

      const allRoomShowtimes = [...sameRoomList, ...sameRoomManualList];

      for (const st of allRoomShowtimes) {
        const stStartObj = safeParseDate(st.startTime);
        if (!stStartObj) continue;
        const stEndObj = safeParseDate(st.endTime) || new Date(stStartObj.getTime() + 120 * 60000);

        const stStartMs = stStartObj.getTime() - cleaningBufferMs;
        const stEndMs = stEndObj.getTime() + cleaningBufferMs;

        const targetStartMs = newStart.getTime();
        const targetEndMs = newEnd.getTime();

        // Overlap check (target overlaps with st + buffer)
        if (targetStartMs < stEndMs && targetEndMs > stStartMs) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        toast.error('Nhích giờ thất bại! Bị trùng lịch hoặc vi phạm thời gian dọn dẹp với suất chiếu khác.');
        return prev;
      }

      target.startTime = toLocalISOString(newStart);
      target.endTime = toLocalISOString(newEnd);
      newList[idx] = target;

      toast.success(`Đã nhích suất chiếu ${shiftMinutes > 0 ? 'tiến' : 'lùi'} ${Math.abs(shiftMinutes)} phút!`);
      return newList;
    });
  }, [form.openTime, form.closeTime, rooms, getConfigValue, existingShowtimes, setPreviewList, updateList]);

  const handleMoveToRoom = useCallback((activeId, targetRoomId, shiftMinutes) => {
    updateList(prev => {
      const newList = [...prev];
      const idx = newList.findIndex(st => st.tempId === activeId);
      if (idx === -1) return prev;

      const target = { ...newList[idx] };
      const room = rooms.find(r => String(r.id) === String(targetRoomId));
      if (!room) return prev;

      const roomFormats = parseRoomFormats(room);
      const movie = movies.find(m => String(m.id) === String(target.movie_id) || m.titleVn === target.movieTitle);
      const mVersion = (movie?.version || movie?.versions || '').toString();
      const movieFormats = getMovieSupportedFormats(mVersion, formatPrices).map(normalizeFormat);

      const movieSupportedInRoom = roomFormats.length === 0 || movieFormats.some(f => roomFormats.includes(f));
      if (!movieSupportedInRoom) {
        toast.error(`❌ Phim "${target.movieTitle}" không có định dạng nào phù hợp với phòng ${room.name}!`);
        return prev;
      }

      const targetFormatClean = normalizeFormat(target.format);
      if (roomFormats.length > 0 && !roomFormats.includes(targetFormatClean)) {
        target.format = movieFormats.find(f => roomFormats.includes(f)) || target.format;
      }

      target.room_id = room.id;
      target.roomName = room.name;

      let newStart = safeParseDate(target.startTime);
      let newEnd = safeParseDate(target.endTime) || (newStart ? new Date(newStart.getTime() + 120 * 60000) : null);

      if (!newStart || !newEnd) {
        toast.error('Dữ liệu suất chiếu bị lỗi!');
        return prev;
      }

      if (shiftMinutes && shiftMinutes !== 0) {
        const shiftedStart = new Date(newStart.getTime() + shiftMinutes * 60000);
        const shiftedEnd = new Date(newEnd.getTime() + shiftMinutes * 60000);

        // Verify operational boundaries
        const openDate = new Date(shiftedStart);
        const openTimeStr = form.openTime || '08:00';
        const [oH, oM] = openTimeStr.split(':');
        const openHour = parseInt(oH, 10) || 8;
        openDate.setHours(openHour, parseInt(oM, 10) || 0, 0, 0);

        if (shiftedStart < openDate) {
          toast.error('Không thể di chuyển! Lịch chiếu vượt quá giờ mở cửa!');
          return prev;
        }

        const baseDate = new Date(newStart);
        if (baseDate.getHours() < openHour) {
          baseDate.setDate(baseDate.getDate() - 1);
        }

        const closeTimeStr = form.closeTime || '23:00';
        const [cH, cM] = closeTimeStr.split(':');
        const closeHour = parseInt(cH, 10) || 23;

        const allowedMaxEnd = new Date(baseDate);
        if (closeHour <= openHour) {
          allowedMaxEnd.setDate(allowedMaxEnd.getDate() + 1);
        }
        allowedMaxEnd.setHours(closeHour + 1, parseInt(cM, 10) || 0, 0, 0); // closeTime + 1 hour

        if (shiftedEnd > allowedMaxEnd) {
          toast.error('Không thể di chuyển! Suất chiếu kết thúc muộn quá quy định (Đóng rạp + 1 tiếng)!');
          return prev;
        }

        newStart = shiftedStart;
        newEnd = shiftedEnd;
        target.startTime = toLocalISOString(newStart);
        target.endTime = toLocalISOString(newEnd);
      }

      const sameRoomList = newList.filter((st, i) => {
        const stStart = safeParseDate(st.startTime);
        return i !== idx && String(st.room_id) === String(room.id) && stStart && stStart.toDateString() === newStart.toDateString();
      });

      const sameRoomManualList = safeExistingShowtimes.filter(st => {
        const stStart = safeParseDate(st.startTime);
        return String(st.room_id) === String(room.id) && stStart && stStart.toDateString() === newStart.toDateString();
      });

      let hasConflict = false;
      let cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_DEFAULT', 15);
      const name = (room.name || '').toUpperCase();
      if (roomFormats.includes('IMAX') || name.includes('IMAX')) {
        cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_IMAX', 30);
      } else if (roomFormats.includes('4DX') || name.includes('4DX')) {
        cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_4DX', 20);
      } else if (roomFormats.includes('3D') || name.includes('3D')) {
        cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_3D', 20);
      }
      const cleaningBufferMs = cleaningBufferMins * 60000;

      const allRoomShowtimes = [...sameRoomList, ...sameRoomManualList];

      for (const st of allRoomShowtimes) {
        const stStartObj = safeParseDate(st.startTime);
        if (!stStartObj) continue;
        const stEndObj = safeParseDate(st.endTime) || new Date(stStartObj.getTime() + 120 * 60000);

        const stStartMs = stStartObj.getTime() - cleaningBufferMs;
        const stEndMs = stEndObj.getTime() + cleaningBufferMs;

        const targetStartMs = newStart.getTime();
        const targetEndMs = newEnd.getTime();

        if (targetStartMs < stEndMs && targetEndMs > stStartMs) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        toast.error('Chuyển phòng thất bại! Bị trùng lịch hoặc vi phạm thời gian dọn dẹp.');
        return prev;
      }

      newList[idx] = target;
      toast.success(`Đã chuyển suất chiếu sang ${room.name}!`);
      return newList;
    });
  }, [rooms, getConfigValue, existingShowtimes, form.openTime, form.closeTime, setPreviewList]);

  const handleSwapShowtimes = useCallback((idx1, idx2) => {
    const newList = [...listToRender];
    const st1 = { ...newList[idx1] };
    const st2 = { ...newList[idx2] };

    const start1 = safeParseDate(st1.startTime);
    const start2 = safeParseDate(st2.startTime);

    if (!start1 || !start2) {
      toast.error('Dữ liệu giờ chiếu bị lỗi, không thể tráo đổi!');
      return;
    }

    if (start1.toDateString() !== start2.toDateString()) {
      toast.error('Chỉ được tráo đổi các suất chiếu trong cùng một ngày!');
      return;
    }

    const room1 = rooms.find(r => String(r.id) === String(st1.room_id));
    const room2 = rooms.find(r => String(r.id) === String(st2.room_id));

    // Check movie 1 compatibility with room 2
    const movie1Supported = isMovieSupportedInRoom(st1.movie_id, st1.movieTitle, room2, movies, formatPrices);
    if (!movie1Supported) {
      toast.error(`❌ Phim "${st1.movieTitle}" không hỗ trợ định dạng nào phù hợp với phòng ${room2?.name || ''}!`);
      return;
    }

    // Check movie 2 compatibility with room 1
    const movie2Supported = isMovieSupportedInRoom(st2.movie_id, st2.movieTitle, room1, movies, formatPrices);
    if (!movie2Supported) {
      toast.error(`❌ Phim "${st2.movieTitle}" không hỗ trợ định dạng nào phù hợp với phòng ${room1?.name || ''}!`);
      return;
    }

    const movieKeys = ['movie_id', 'movieTitle', 'durationMinutes', 'language', 'format'];
    movieKeys.forEach(key => {
      const temp = st1[key];
      st1[key] = st2[key];
      st2[key] = temp;
    });

    // Adjust format for st1 (now holding st2's movie) to room1
    st1.format = getSupportedFormatForRoom(st1.movie_id, st1.movieTitle, st1.format, room1, movies, formatPrices);

    // Adjust format for st2 (now holding st1's movie) to room2
    st2.format = getSupportedFormatForRoom(st2.movie_id, st2.movieTitle, st2.format, room2, movies, formatPrices);

    newList[idx1] = st1;
    newList[idx2] = st2;

    const recalculateRoomTimeline = (roomId) => {
      const roomIndices = [];
      newList.forEach((st, i) => {
        if (st.room_id === roomId) {
          roomIndices.push(i);
        }
      });

      roomIndices.sort((a, b) => safeParseDate(newList[a].startTime) - safeParseDate(newList[b].startTime));

      let pushedPastMidnight = false;

      for (let i = 0; i < roomIndices.length; i++) {
        const idx = roomIndices[i];
        const curr = newList[idx];
        const currStart = safeParseDate(curr.startTime);
        if (!currStart) continue;

        let newStartTime = curr.startTime;
        let newEndTime = curr.endTime;

        let duration = parseInt(curr.durationMinutes, 10);
        if (isNaN(duration) || duration <= 0) {
          const movieObj = movies.find(m => String(m.id) === String(curr.movie_id) || m.titleVn === curr.movieTitle);
          duration = parseInt(movieObj?.duration || movieObj?.durationMinutes || 120, 10);
          if (isNaN(duration) || duration <= 0) duration = 120;
        }
        let totalMins = duration + 10;
        let remainder = totalMins % 5;
        if (remainder !== 0) {
          totalMins += (5 - remainder);
        }

        if (i === 0) {
          const currEnd = new Date(currStart.getTime() + totalMins * 60000);
          newEndTime = toLocalISOString(currEnd);
        } else {
          const prev = newList[roomIndices[i - 1]];
          const parsedPrevStart = safeParseDate(prev.startTime);
          const prevEnd = safeParseDate(prev.endTime) || (parsedPrevStart ? new Date(parsedPrevStart.getTime() + 120 * 60000) : new Date());

          const room = rooms.find(r => String(r.id) === String(roomId));
          let cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_DEFAULT', 15);
          if (room) {
            const formats = parseRoomFormats(room);
            const name = (room.name || '').toUpperCase();
            if (formats.includes('IMAX') || name.includes('IMAX')) {
              cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_IMAX', 30);
            } else if (formats.includes('4DX') || name.includes('4DX')) {
              cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_4DX', 20);
            } else if (formats.includes('3D') || name.includes('3D')) {
              cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_3D', 20);
            }
          }
          const prevEndWithCleaning = new Date(prevEnd.getTime() + cleaningBufferMins * 60000);

          if (prevEndWithCleaning > currStart) {
            let newStartObj = new Date(prevEndWithCleaning);
            const remainder = newStartObj.getMinutes() % 5;
            if (remainder !== 0) {
              newStartObj = new Date(newStartObj.getTime() + (5 - remainder) * 60000);
            }

            newStartTime = toLocalISOString(newStartObj);
            const currEndObj = new Date(newStartObj.getTime() + totalMins * 60000);
            newEndTime = toLocalISOString(currEndObj);

            if (newStartObj.getDate() !== currStart.getDate()) {
              pushedPastMidnight = true;
            }
          } else {
            const currEndObj = new Date(currStart.getTime() + totalMins * 60000);
            newEndTime = toLocalISOString(currEndObj);
          }
        }

        if (curr.startTime !== newStartTime || curr.endTime !== newEndTime) {
          newList[idx] = { ...curr, startTime: newStartTime, endTime: newEndTime };
        }
      }

      if (pushedPastMidnight) {
        toast.warning(`Có suất chiếu ở phòng bị đẩy sang sáng ngày hôm sau do lệch giờ!`, { duration: 5000 });
      }
    };

    recalculateRoomTimeline(st1.room_id);
    if (st1.room_id !== st2.room_id) {
      recalculateRoomTimeline(st2.room_id);
    }

    // Check if the new timeline conflicts with any manual showtimes
    let swapHasManualConflict = false;
    for (const st of newList) {
      const stStart = safeParseDate(st.startTime);
      if (!stStart) continue;
      const stEnd = safeParseDate(st.endTime) || new Date(stStart.getTime() + 120 * 60000);

      const sameRoomManualList = safeExistingShowtimes.filter(ms => {
        const msStart = safeParseDate(ms.startTime);
        return String(ms.room_id) === String(st.room_id) && msStart && msStart.toDateString() === stStart.toDateString();
      });

      const room = rooms.find(r => String(r.id) === String(st.room_id));
      let cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_DEFAULT', 15);
      if (room) {
        const formats = parseRoomFormats(room);
        const name = (room.name || '').toUpperCase();
        if (formats.includes('IMAX') || name.includes('IMAX')) {
          cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_IMAX', 30);
        } else if (formats.includes('4DX') || name.includes('4DX')) {
          cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_4DX', 20);
        } else if (formats.includes('3D') || name.includes('3D')) {
          cleaningBufferMins = safeGetConfigValue('CLEANING_BUFFER_3D', 20);
        }
      }
      const cleaningBufferMs = cleaningBufferMins * 60000;

      for (const ms of sameRoomManualList) {
        const msStartObj = safeParseDate(ms.startTime);
        if (!msStartObj) continue;
        const msEndObj = safeParseDate(ms.endTime) || new Date(msStartObj.getTime() + 120 * 60000);

        const msStartMs = msStartObj.getTime() - cleaningBufferMs;
        const msEndMs = msEndObj.getTime() + cleaningBufferMs;

        if (stStart.getTime() < msEndMs && stEnd.getTime() > msStartMs) {
          swapHasManualConflict = true;
          break;
        }
      }
      if (swapHasManualConflict) break;
    }

    if (swapHasManualConflict) {
      toast.error('❌ Hoán đổi thất bại! Suất chiếu sau khi hoán đổi bị trùng lịch hoặc vi phạm thời gian dọn dẹp với suất chiếu cố định (đã lưu).');
      return;
    }

    updateList(newList);
    toast.success('✅ Đã hoán đổi suất chiếu thành công!');
  }, [updateList, movies, formatPrices, rooms, getConfigValue, existingShowtimes, listToRender]);



  const isShowtimeModified = (st) => {
    if (!aiEnhancedResult) return false;
    const orig = aiEnhancedResult.originalList.find(o => o.tempId === st.tempId);
    if (!orig) return false;
    return orig.startTime !== st.startTime || orig.room_id !== st.room_id;
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f9fb]">
      {/* Loading Overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-[#f7f9fb]/80 z-[1000] flex items-center justify-center backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center border border-[#e0e3e5]">
            <div className="w-20 h-20 mb-6 bg-gradient-to-tr from-purple-100 to-indigo-100 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-purple-600 animate-spin" />
              <Sparkles size={36} className="text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-[20px] font-bold text-[#191c1e] mb-2 text-center tracking-tight">AI Đang Tối Ưu Hóa</h3>
            <p className="text-[13px] text-[#5c647a] mb-8 text-center h-5 font-medium transition-all duration-300">{aiStatus}</p>
            
            <div className="w-full h-3 bg-[#f7f9fb] rounded-full overflow-hidden mb-3 border border-[#e0e3e5] shadow-inner relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-150 ease-out"
                style={{ width: `${aiProgress}%` }}
              >
                <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[pulse_1s_linear_infinite]" />
              </div>
            </div>
            <div className="flex justify-between w-full text-[11px] font-bold tracking-wider uppercase text-[#5c647a]">
              <span>Tiến trình</span>
              <span className="text-purple-600">{aiProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Control Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="p-4 bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] font-bold rounded-xl text-sm flex items-center gap-2 flex-1 mr-4">
          <CheckCircle size={18} />
          Thuật toán đã chạy thành công. Tạo ra {previewList.length} suất chiếu dự kiến.
        </div>
        <div className="flex gap-3">
          {!isImportMode && (
            <button onClick={onBack} disabled={loading} className="px-6 py-3 bg-white border border-[#e0e3e5] text-[#5c647a] font-bold rounded-xl hover:bg-[#f7f9fb] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Chỉnh sửa lại
            </button>
          )}
          {!isImportMode && !aiEnhancedResult && (
            <button 
              onClick={() => setShowAiModal(true)} 
              disabled={aiLoading} 
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-650 hover:opacity-95 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              {aiLoading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              )}
              Tối ưu hóa bằng AI
            </button>
          )}
          <button onClick={handleResetPreview} disabled={loading || originalPreviewList.length === 0} className="px-6 py-3 bg-[#fff3e0] border border-[#ffb74d] text-[#e65100] font-bold rounded-xl hover:bg-[#ffe0b2] transition-all flex items-center gap-2 disabled:opacity-50" title="Khôi phục trạng thái mới được tạo ra">
            <span className="material-symbols-outlined text-[18px]">undo</span>
            Hoàn tác gốc
          </button>
          <button onClick={handleBatchSave} disabled={loading || previewList.length === 0} className="px-6 py-3 bg-[#00836c] hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
            {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <CheckCircle size={18} />}
            Lưu {previewList.length} Suất Chiếu
          </button>
        </div>
      </div>

      {/* AI Comparison Banner */}
      {aiEnhancedResult && (
        <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-xl flex justify-between items-center shadow-lg mb-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-purple-300 text-2xl animate-bounce">
              psychology
            </span>
            <div>
              <h4 className="font-bold text-sm text-white">Đề xuất tối ưu hóa bằng Trí Tuệ Nhân Tạo (AI)</h4>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentViewTab('algorithm')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentViewTab === 'algorithm' ? 'bg-white text-purple-900 shadow' : 'bg-white/10 hover:bg-white/20'}`}
            >
              Bản Thuật Toán
            </button>
            <button 
              onClick={() => setCurrentViewTab('ai')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentViewTab === 'ai' ? 'bg-white text-purple-900 shadow' : 'bg-white/10 hover:bg-white/20'}`}
            >
              Đề xuất AI
            </button>
            <button 
              onClick={() => setShowReasoningConsole(true)} 
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">query_stats</span>
              Giải thích AI
            </button>
            <button 
              onClick={handleApplyAI} 
              className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all shadow"
            >
              Áp dụng AI
            </button>
            <button 
              onClick={handleDiscardAI} 
              className="px-4 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded-lg text-xs font-bold transition-all shadow"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}

      {/* AI Context Configuration Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-purple-100 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-650 p-6 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">psychology</span>
                Bối cảnh Tối ưu hóa bằng AI
              </h3>
              <p className="text-xs text-purple-100 mt-1">Cung cấp bối cảnh thực tế để AI xếp lịch tối ưu doanh thu tốt nhất.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Chọn Phim ưu tiên lấp chỗ trống (Auto-Fill Priority)</label>
                <p className="text-[10px] text-gray-500 mb-1">Thuật toán sẽ tự động nhồi các phim bạn chọn vào những khoảng thời gian còn trống cuối ngày sau khi tối ưu.</p>
                <div className="max-h-48 overflow-y-auto border border-gray-150 rounded-xl p-2.5 bg-gray-50 space-y-2 custom-scrollbar">
                  {movies.filter(m => [...new Set(previewList.map(p => p.movie_id))].includes(m.id)).map(movie => (
                    <label key={movie.id} className="flex items-center gap-2 text-xs text-gray-700 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={aiContext.autoFillMovies.includes(movie.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setAiContext({
                            ...aiContext,
                            autoFillMovies: isChecked 
                              ? [...aiContext.autoFillMovies, movie.id]
                              : aiContext.autoFillMovies.filter(id => id !== movie.id)
                          });
                        }}
                        className="w-4 h-4 rounded accent-purple-600"
                      />
                      {movie.titleVn}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 border border-gray-250 text-gray-605 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAIEnhance}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                Bắt đầu Tối ưu
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={timelineContainerRef}
        className="flex-1 overflow-auto custom-scrollbar flex bg-[#f7f9fb] border border-[#e5bdbe] rounded-xl relative"
      >
        <div className="flex h-full min-h-full" style={{ width: `calc(192px + ${datesToRender.length * getBusinessHours().businessMinutes * PIXELS_PER_MINUTE}px)` }}>

          {/* Sidebar (Rooms) */}
          <div className="w-48 shrink-0 sticky left-0 z-40 bg-[#f7f9fb] border-r border-[#e0e3e5] flex flex-col shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-fit min-h-full">
            <div className="h-16 border-b border-[#e0e3e5] bg-white sticky top-0 z-50 shrink-0"></div>
            {rooms.filter(r => {
              if (listToRender.length === 0) return false;
              const firstStRoom = rooms.find(room => room.id === listToRender[0].room_id);
              const targetCinemaId = firstStRoom?.cinemaId || firstStRoom?.cinema?.id;
              if (targetCinemaId) {
                return (r.cinemaId || r.cinema?.id) === targetCinemaId;
              }
              return true;
            }).map(room => {
              const roomInfo = getRoomDetails(room);
              return (
                <div key={room.id} className="h-24 border-b border-[#e0e3e5] flex items-center px-4 gap-3 bg-white hover:bg-gray-50 transition-colors shrink-0">
                  <span className={`material-symbols-outlined ${roomInfo.iconColor}`}>{roomInfo.icon}</span>
                  <div className="min-w-0">
                    <span className="text-[12px] font-semibold text-[#191c1e] block truncate uppercase">{room.name}</span>
                    <span className="text-[10px] text-[#5c3f40] uppercase tracking-wide mt-1 block">{roomInfo.sub || (room.capacity ? `${room.capacity} Ghế` : '')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Area */}
          <div className="relative bg-[#f7f9fb]" style={{ width: `${datesToRender.length * getBusinessHours().businessMinutes * PIXELS_PER_MINUTE}px` }}>
            {/* Time Header */}
            <div className="h-16 flex flex-col sticky top-0 z-30 bg-white border-b border-[#e0e3e5] shadow-sm">
              {/* Date Row */}
              <div className="h-8 flex bg-[#eceef0] border-b border-[#e0e3e5]">
                {datesToRender.map((date, index) => {
                  const formattedDate = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
                  return (
                    <div key={date}
                      className={`shrink-0 font-extrabold text-sm flex items-center border-r border-[#e0e3e5] uppercase relative ${index % 2 === 0 ? 'bg-white text-[#b80035]' : 'bg-[#f7f9fb] text-[#191c1e]'}`}
                      style={{ width: `${getBusinessHours().businessMinutes * PIXELS_PER_MINUTE}px` }}
                    >
                      <span className="sticky left-48 px-4 tracking-wide">{formattedDate}</span>
                    </div>
                  );
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
                      style={{ width: `${businessMinutes * PIXELS_PER_MINUTE}px` }}
                    >
                      {Array.from({ length: numBlocks }).map((_, i) => (
                        <div key={i} className="w-[120px] shrink-0 flex items-center justify-center border-r border-[#e0e3e5] border-dashed text-[13px] font-bold font-mono text-[#5c647a]">
                          {String((startHour + i * 2) % 24).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vertical Grid Lines Background */}
            <div className="absolute inset-0 top-16 flex pointer-events-none z-0">
              {datesToRender.map((date, index) => {
                const { businessHours, businessMinutes, startHour } = getBusinessHours();
                const numBlocks = Math.ceil(businessHours / 2);
                
                // Tính tọa độ cho Khung giờ vàng (18:00 - 21:00)
                const goldenStartLeft = (18 - startHour) * 60 * PIXELS_PER_MINUTE;
                const goldenWidth = (21 - 18) * 60 * PIXELS_PER_MINUTE;

                return (
                  <div key={`bg-${date}`}
                    className={`flex shrink-0 border-r border-[#e0e3e5] border-dashed relative ${index % 2 === 0 ? 'bg-white' : 'bg-[#f7f9fb]'}`}
                    style={{ width: `${businessMinutes * PIXELS_PER_MINUTE}px` }}
                  >
                    {/* Vẽ grid lines */}
                    {Array.from({ length: numBlocks * 2 }).map((_, i) => (
                      <div key={i}
                        className="w-[60px] shrink-0 border-r border-[#cbd1d6] h-full relative z-10"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 9px, rgba(0,0,0,0.1) 9px, rgba(0,0,0,0.1) 10px)'
                        }}
                      />
                    ))}
                    
                    {/* Highlight Khung giờ vàng */}
                    <div 
                      className="absolute top-0 bottom-0 bg-[#fff8e1]/60 border-x border-[#ffe082]/50 z-0"
                      style={{ left: `${goldenStartLeft}px`, width: `${goldenWidth}px` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Grid Content (Room Rows & Showtimes) */}
            <DndContext
              modifiers={[snapToGridModifier]}
              collisionDetection={closestCenter}
              onDragStart={(e) => setActiveId(e.active.id)}
              onDragEnd={(e) => {
                const { active, over, delta } = e;
                if (over) {
                  if (String(over.id).startsWith('room-')) {
                    const targetRoomId = String(over.id).replace('room-', '');
                    let shiftMinutes = 0;
                    if (Math.abs(delta.x) >= 10 * PIXELS_PER_MINUTE) {
                      shiftMinutes = Math.round(delta.x / (10 * PIXELS_PER_MINUTE)) * 10;
                    }
                    handleMoveToRoom(active.id, targetRoomId, shiftMinutes);
                  } else if (active.id !== over.id) {
                    const idx1 = listToRender.findIndex(st => String(st.tempId) === String(active.id));
                    const idx2 = listToRender.findIndex(st => String(st.tempId) === String(over.id));
                    if (idx1 !== -1 && idx2 !== -1) {
                      handleSwapShowtimes(idx1, idx2);
                    }
                  } else {
                    const idx = listToRender.findIndex(st => String(st.tempId) === String(active.id));
                    if (idx !== -1 && Math.abs(delta.x) >= 10 * PIXELS_PER_MINUTE) {
                      const shiftMinutes = Math.round(delta.x / (10 * PIXELS_PER_MINUTE)) * 10;
                      if (shiftMinutes !== 0) {
                        handleNudgeShowtime(idx, shiftMinutes);
                      }
                    }
                  }
                } else {
                  const idx = listToRender.findIndex(st => String(st.tempId) === String(active.id));
                  if (idx !== -1 && Math.abs(delta.x) >= 5 * PIXELS_PER_MINUTE) {
                    const shiftMinutes = Math.round(delta.x / (5 * PIXELS_PER_MINUTE)) * 5;
                    if (shiftMinutes !== 0) {
                      handleNudgeShowtime(idx, shiftMinutes);
                    }
                  }
                }
                setActiveId(null);
              }}
              onDragCancel={() => setActiveId(null)}
            >
              <div className="relative z-10">
                {rooms.filter(r => {
                  if (listToRender.length === 0) return true;
                  const firstStRoom = rooms.find(room => room.id === listToRender[0].room_id);
                  const targetCinemaId = firstStRoom?.cinemaId || firstStRoom?.cinema?.id;
                  if (targetCinemaId) {
                    return (r.cinemaId || r.cinema?.id) === targetCinemaId;
                  }
                  return true;
                }).map(room => {
                  const roomShowtimes = listToRender.filter(st => st.room_id === room.id);
                  const manualShowtimes = safeExistingShowtimes.filter(st => st.room_id === room.id);
                  return (
                    <DroppableRoomRow key={room.id} room={room}>
                      {manualShowtimes.map((st) => {
                        const pos = calculatePosition(st.startTime, st.endTime);
                        const stHour = new Date(st.startTime).getHours();
                        const isGolden = stHour >= 18 && stHour < 22;

                        const barColor = 'bg-[#5c647a]';
                        const textColor = 'text-[#5c647a]';
                        const gradient = 'repeating-linear-gradient(45deg, #f1f3f5, #f1f3f5 10px, #e9ecef 10px, #e9ecef 20px)';
                        const borderColor = 'border-[#5c647a]/20';

                        return (
                          <div
                            key={st.tempId}
                            className={`absolute top-4 h-[64px] rounded border ${borderColor} flex items-center p-2 shadow-sm overflow-hidden cursor-not-allowed z-0 pointer-events-none`}
                            style={{
                              ...pos,
                              minWidth: '40px',
                              backgroundImage: gradient
                            }}
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
                            <div className="absolute top-1 right-1">
                              <span className="material-symbols-outlined text-red-500 text-[16px] opacity-80">
                                lock
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 ml-2 flex flex-col justify-center">
                              <h4 className={`font-semibold text-[12px] ${textColor} line-clamp-1 leading-tight mb-1 pr-4`}>
                                {st.movieTitle}
                              </h4>
                              <p className={`text-[10px] ${textColor} font-mono font-bold flex gap-1 items-center`}>
                                <span>{safeFormatTime(st.startTime)}</span>
                                <span>-</span>
                                <span>{safeFormatTime(st.endTime)}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {roomShowtimes.map((st) => {
                        const movieObj = movies.find(m => String(m.id) === String(st.movie_id) || m.titleVn === st.movieTitle);

                        return (
                          <DraggableShowtime
                            key={st.tempId}
                            st={st}
                            id={st.tempId}
                            calculatePosition={calculatePosition}
                            movieObj={movieObj}
                            isDragged={activeId === st.tempId}
                            handleDeleteShowtime={handleDeleteShowtime}
                            isReadOnly={false}
                            isModified={isShowtimeModified(st)}
                          />
                        );
                      })}
                    </DroppableRoomRow>
                  );
                })}
              </div>
            </DndContext>
          </div>
        </div>
      </div>

      {listToRender.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-50 pointer-events-none rounded-xl">
          <span className="material-symbols-outlined text-5xl text-[#565e74] mb-2">event_busy</span>
          <p className="text-[#565e74] font-semibold text-sm">Không tạo được suất chiếu nào phù hợp</p>
        </div>
      )}

      {showReasoningConsole && aiEnhancedResult && (
        <AIReasoningConsole 
          result={aiEnhancedResult} 
          movies={movies} 
          onClose={() => setShowReasoningConsole(false)} 
        />
      )}
    </div>
  );
}
