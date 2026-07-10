import React, { memo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';

const DraggableShowtime = memo(function DraggableShowtime({
  st,
  id,
  calculatePosition,
  movieObj,
  isDragged,
  handleDeleteShowtime
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, transform } = useDraggable({
    id: id?.toString() || crypto.randomUUID(),
    data: { id, st, movieObj }
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: id?.toString() || crypto.randomUUID(),
    data: { id }
  });

  // Combine refs
  const setNodeRef = (node) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const safeFormatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const parsed = parseISO(isoString);
      if (isNaN(parsed.getTime())) return '--:--';
      return format(parsed, 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const pos = calculatePosition(st?.startTime, st?.endTime) || { left: 0, width: 0 };
  const left = pos.left;
  const width = pos.width;
  
  const isGoldenHour = st?.goldenHour || st?.isGoldenHour;
  
  // Safely check genres to avoid TypeError if genres is a string or undefined
  const isAnimation = Array.isArray(movieObj?.genres) 
    ? movieObj.genres.some(g => g?.name?.toLowerCase().includes('hoạt hình')) 
    : false;
    
  const isDubbed = isAnimation && st?.language === 'Lồng tiếng';

  // Distinct Preview Colors
  const barColor = isGoldenHour ? 'bg-[#ffb300]' : 'bg-[#4caf50]'
  const bgColor = isDubbed ? 'bg-[repeating-linear-gradient(-45deg,#fff,#fff_6px,#fff0f2_6px,#fff0f2_12px)]' : (isGoldenHour ? 'bg-[#fff8e1]' : 'bg-[#e8f5e9]')
  const borderColor = isGoldenHour ? 'border-[#ffe082]' : 'border-[#a5d6a7]'
  const textColor = isGoldenHour ? 'text-[#ff6f00]' : 'text-[#2e7d32]'

  // Apply transform if dragging
  const style = {
    left,
    width,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragged ? 50 : (isOver ? 40 : 10),
    transition: transform ? 'none' : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)'
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute top-4 h-[64px] ${bgColor} border ${isOver ? 'border-[#b80035] border-2 shadow-[0_0_0_4px_rgba(184,0,53,0.1)] scale-105' : borderColor} rounded flex items-center p-2 cursor-grab active:cursor-grabbing transition-colors transition-shadow group overflow-hidden ${isDragged ? 'shadow-2xl scale-105 ring-2 ring-[#b80035]/30 opacity-95' : 'shadow-sm hover:shadow-md'}`}
      style={style}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />

      <div className="flex-1 min-w-0 ml-2 flex flex-col justify-center pointer-events-none">
        <h4 className={`font-semibold text-[12px] text-[#191c1e] line-clamp-1 leading-tight mb-1`} title={st.movieTitle}>
          {st.movieTitle}
        </h4>
        <div className="flex gap-1.5 items-center mb-0.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isGoldenHour ? 'bg-[#ffe082] text-[#ff6f00]' : 'bg-[#c8e6c9] text-[#2e7d32]'}`}>
            {st.format}
          </span>
        </div>
        <p className={`text-[10px] ${textColor} font-mono font-bold flex gap-1 items-center`}>
          <span>{safeFormatTime(st.startTime)}</span>
          <span>-</span>
          <span>{safeFormatTime(st.endTime)}</span>
        </p>
      </div>

      {/* Delete & Shift Up Button */}
      <div className="absolute right-0 top-0 bottom-0 bg-white/80 px-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteShowtime(id);
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
          title="Xóa & Lùi giờ"
          className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors bg-white shadow-sm"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
});

export default DraggableShowtime;
