import React, { useMemo, useState } from 'react';
import { X, Brain, CheckCircle, Warning, MagnifyingGlass, Lightning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIReasoningConsole({ result, movies, onClose }) {
  const [selectedMovieId, setSelectedMovieId] = useState('ALL');

  const { originalList, enhancedList, aiPreferences, sessionFillRates } = result;

  const assignedMoviesForDropdown = useMemo(() => {
    const uniqueIds = new Set();
    const resultMovies = [];
    enhancedList?.forEach(st => {
      const mId = String(st.movie_id);
      if (mId && mId !== 'null' && mId !== 'undefined' && !uniqueIds.has(mId)) {
        uniqueIds.add(mId);
        const movieObj = movies.find(m => String(m.id) === mId);
        if (movieObj) {
          resultMovies.push(movieObj);
        }
      }
    });
    return resultMovies;
  }, [enhancedList, movies]);

  const sessionData = useMemo(() => {
    if (!aiPreferences || !aiPreferences.sessionPrefs) return [];

      const sortedAndFiltered = originalList.map((origSt, index) => {
      const alias = `S${index}`;
      const backendSessionId = `session_tmp_${index}`;
      const tempId = origSt.tempId || backendSessionId;
      
      const prefs = aiPreferences.sessionPrefs[backendSessionId] || []; // Array of movie UUIDs
      const fillRate = sessionFillRates ? sessionFillRates[alias] : null;

      // Find actual assigned in enhancedList
      const assignedSt = enhancedList.find(st => st.tempId === tempId);
      const assignedMovieId = assignedSt ? String(assignedSt.movie_id) : null;

      // Map preferred movies to actual movie objects
      const preferredMovies = prefs.map(mId => movies.find(m => String(m.id) === String(mId)));
      const assignedMovie = movies.find(m => String(m.id) === assignedMovieId);

      // Determine match index (0-indexed)
      const matchIndex = prefs.findIndex(mId => String(mId) === assignedMovieId);
      
      let reason = '';
      if (matchIndex === 0) {
        reason = 'Ghép cặp thành công với lựa chọn tối ưu nhất (Top 1) theo đề xuất của AI.';
      } else if (matchIndex > 0) {
        const top1Movie = preferredMovies[0]?.titleVn || 'Phim ưu tiên';
        reason = `Phim "${top1Movie}" (Top 1) đã hết hạn ngạch hoặc nhường cho suất chiếu ưu tiên cao hơn. Chuyển xuống lựa chọn Top ${matchIndex + 1}.`;
      } else {
        reason = 'Không thể ghép cặp với bất kỳ lựa chọn nào trong danh sách ưu tiên. Sử dụng thuật toán dự phòng (Fallback).';
      }

      return {
        origSt,
        alias,
        tempId,
        fillRate,
        preferredMovies,
        assignedMovie,
        matchIndex,
        reason,
        isOptimal: matchIndex === 0,
        isFilteredOut: selectedMovieId !== 'ALL' && String(assignedMovie?.id) !== selectedMovieId
      };
    }).sort((a, b) => {
      const timeA = new Date(a.origSt.startTime).getTime() || 0;
      const timeB = new Date(b.origSt.startTime).getTime() || 0;
      return timeA - timeB;
    });

    return sortedAndFiltered;
  }, [originalList, enhancedList, aiPreferences, sessionFillRates, movies, selectedMovieId]);

  const TIMELINE_START_HOUR = 8;
  const TIMELINE_END_HOUR = 24;
  const PIXELS_PER_MINUTE = 3; // Reduced slightly to make it denser
  const TIMELINE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
  const TIMELINE_WIDTH = TIMELINE_HOURS * 60 * PIXELS_PER_MINUTE;

  const timeMarkers = useMemo(() => {
    const markers = [];
    for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h += 2) {
      markers.push(h);
    }
    return markers;
  }, []);

  const getTimelineStyle = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return { left: 0, width: 340, position: 'absolute' };
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { left: 0, width: 340, position: 'absolute' };
    
    const startHours = start.getHours();
    const startMinutes = start.getMinutes();
    const totalStartMinutes = (startHours * 60 + startMinutes) - (TIMELINE_START_HOUR * 60);
    
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    
    return {
      left: `${Math.max(0, totalStartMinutes) * PIXELS_PER_MINUTE}px`,
      width: `${Math.max(250, durationMinutes * PIXELS_PER_MINUTE)}px`, // min-width 250px so text doesn't squish
      position: 'absolute'
    };
  };

  const groupedByRoomAndDate = useMemo(() => {
    const grouped = {};
    sessionData.forEach(item => {
      const roomName = item.origSt.roomName || 'Unknown Room';
      const dateObj = new Date(item.origSt.startTime);
      const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Unknown Date';
      const dateTimestamp = !isNaN(dateObj.getTime()) ? new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime() : 0;
      
      const groupKey = `${roomName}|${dateStr}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          roomName,
          dateStr,
          dateTimestamp,
          sessions: []
        };
      }
      grouped[groupKey].sessions.push(item);
    });
    
    return Object.values(grouped).sort((a, b) => {
      const roomCmp = a.roomName.localeCompare(b.roomName, undefined, { numeric: true, sensitivity: 'base' });
      if (roomCmp !== 0) return roomCmp;
      return a.dateTimestamp - b.dateTimestamp;
    });
  }, [sessionData]);

  const safeFormatTime = (isoString) => {
    if (!isoString) return '--:--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-6xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header - Dashboard Theme */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Brain size={24} weight="duotone" className="text-[#b80035]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none mb-1">AI Reasoning Console</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse"></span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status: Stable Match Achieved</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <select 
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] w-64 transition-all cursor-pointer appearance-none truncate"
              >
                <option value="ALL">Tất cả phim</option>
                {assignedMoviesForDropdown?.map(m => (
                  <option key={m.id} value={m.id}>{m.titleVn}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content Body - CALENDAR/SCHEDULE STREAM */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          
          {!aiPreferences ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
              <Warning size={48} weight="duotone" className="mb-4 opacity-30" />
              <p className="font-semibold text-sm uppercase tracking-wider text-gray-500">No preference data found</p>
            </div>
          ) : groupedByRoomAndDate.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
              <p className="font-semibold text-sm uppercase tracking-wider text-gray-500">Không tìm thấy kết quả</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {groupedByRoomAndDate.map((group, roomIndex) => (
                <div key={`${group.roomName}-${group.dateStr}`} className="flex flex-col">
                  {/* Room Title & Date */}
                  <div className="flex items-center gap-3 mb-3 sticky left-0">
                    <div className="w-1.5 h-6 bg-[#b80035] rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">{group.roomName}</h3>
                    <div className="px-2.5 py-0.5 bg-slate-100 rounded text-sm font-semibold text-slate-700 border border-slate-200">
                      {group.dateStr}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                      {group.sessions.length} Suất
                    </span>
                  </div>

                  {/* Horizontal Scrollable Timeline Container */}
                  <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div 
                      className="relative min-h-[420px]" 
                      style={{ width: `${TIMELINE_WIDTH}px` }}
                    >
                      {/* Background Time Markers */}
                      <div className="absolute inset-0 pointer-events-none">
                        {timeMarkers.map(hour => {
                          const leftPos = (hour - TIMELINE_START_HOUR) * 60 * PIXELS_PER_MINUTE;
                          return (
                            <div 
                              key={hour} 
                              className="absolute top-0 bottom-0 border-l border-dashed border-slate-200"
                              style={{ left: `${leftPos}px` }}
                            >
                              <span className="absolute -top-6 -left-3 text-xs font-mono font-bold text-slate-400 bg-white px-1">
                                {hour.toString().padStart(2, '0')}:00
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Sessions */}
                      <AnimatePresence>
                        {group.sessions.map((item, i) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ 
                              opacity: item.isFilteredOut ? 0.3 : 1, 
                              scale: 1,
                              filter: item.isFilteredOut ? 'grayscale(100%)' : 'grayscale(0%)'
                            }}
                            transition={{ delay: (roomIndex * 0.1) + ((i % 10) * 0.05), type: "spring", stiffness: 250, damping: 20 }}
                            key={item.tempId} 
                            style={{ 
                              ...getTimelineStyle(item.origSt.startTime, item.origSt.endTime),
                              zIndex: item.isFilteredOut ? 10 : 20
                            }}
                            className={`bg-white border ${item.isFilteredOut ? 'border-slate-200' : 'border-slate-300 hover:border-[#b80035] hover:shadow-lg'} rounded-2xl p-4 shadow-sm transition-all flex flex-col top-8`}
                          >
                          {/* Session Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                <Lightning size={14} className="text-[#b80035]" />
                                {safeFormatTime(item.origSt.startTime)} - {safeFormatTime(item.origSt.endTime)}
                              </div>
                              <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
                                Khối {item.alias}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {item.origSt?.pastFillRate != null && (
                                <div className="flex flex-col items-end bg-gray-50 px-2 py-1 rounded-md border border-gray-200" title="Tỉ lệ lấp đầy trong quá khứ">
                                  <span className="text-[10px] uppercase font-bold text-gray-500">Past Fill</span>
                                  <span className="text-sm font-bold text-gray-700">{(item.origSt.pastFillRate * 100).toFixed(3)}%</span>
                                </div>
                              )}
                              {item.fillRate != null && (
                                <div className="flex flex-col items-end bg-green-50 px-2 py-1 rounded-md border border-green-100" title="Fill Rate Dự đoán">
                                  <span className="text-[10px] uppercase font-bold text-green-700">Predict</span>
                                  <span className="text-sm font-bold text-green-600">~{item.fillRate}%</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-px w-full bg-gray-100 my-2"></div>

                          {/* Content Section */}
                          <div className="flex-1 space-y-3 mt-1">
                            
                            {/* Assigned Movie */}
                            <div className={`rounded-lg p-2.5 border flex items-center gap-3 ${
                              item.isOptimal 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-orange-50 border-orange-200 text-orange-800'
                            }`}>
                              <div className="shrink-0">
                                {item.isOptimal ? <CheckCircle size={20} weight="fill" className="text-green-500" /> : <Warning size={20} weight="fill" className="text-orange-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-bold uppercase mb-0.5 ${item.isOptimal ? 'text-green-700' : 'text-orange-700'}`}>Phim Thực Tế</p>
                                <p className="text-sm font-semibold truncate">
                                  {item.assignedMovie?.titleVn || 'Không có'}
                                </p>
                              </div>
                              {!item.isOptimal && (
                                <div className="shrink-0 bg-white/50 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                                  {item.matchIndex > 0 ? `TOP ${item.matchIndex + 1}` : 'FALL'}
                                </div>
                              )}
                            </div>

                            {/* Preferred Movies Wishlist */}
                            <div>
                              <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                                Danh sách AI Đề xuất
                              </h4>
                              <div className="flex flex-col gap-1.5">
                                {item.preferredMovies.map((pm, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`text-xs px-2 py-1 rounded-md border flex items-center gap-2 ${
                                      idx === item.matchIndex 
                                        ? 'bg-[#b80035]/10 border-[#b80035]/20 text-[#b80035] font-semibold' 
                                        : 'bg-gray-50 border-gray-100 text-gray-600'
                                    }`}
                                  >
                                    <span className={`w-5 text-center font-bold text-[10px] ${idx === item.matchIndex ? 'text-[#b80035]' : 'text-gray-400'}`}>#{idx + 1}</span>
                                    <span className="truncate">{pm?.titleVn || 'Không rõ'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Reasoning */}
                            <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                              {item.reason}
                            </div>

                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
