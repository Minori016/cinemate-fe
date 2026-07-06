import React, { memo } from 'react';
import { format, parseISO } from 'date-fns';

const DragOverlayShowtime = memo(function DragOverlayShowtime({ st, calculatePosition, movieObj }) {
  const { width } = calculatePosition(st.startTime, st.durationMinutes)
  const isGoldenHour = st.goldenHour || st.isGoldenHour
  const isAnimation = movieObj?.genres?.some(g => g.name?.toLowerCase().includes('hoạt hình'))
  const isDubbed = isAnimation && st.language === 'Lồng tiếng'
  
  const barColor = isGoldenHour ? 'bg-[#ffb300]' : 'bg-[#4caf50]'
  const bgColor = isDubbed ? 'bg-[repeating-linear-gradient(-45deg,#fff,#fff_6px,#fff0f2_6px,#fff0f2_12px)]' : (isGoldenHour ? 'bg-[#fff8e1]' : 'bg-[#e8f5e9]')
  const borderColor = isGoldenHour ? 'border-[#ffe082]' : 'border-[#a5d6a7]'
  const textColor = isGoldenHour ? 'text-[#ff6f00]' : 'text-[#2e7d32]'
  
  return (
    <div
      className={`h-[64px] ${bgColor} border ${borderColor} border-2 rounded shadow-2xl flex items-center p-2 opacity-90 overflow-hidden ring-4 ring-[#b80035]/20 cursor-grabbing`}
      style={{ width }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
      
      <div className="flex-1 min-w-0 ml-2 flex flex-col justify-center">
        <h4 className={`font-semibold text-[12px] text-[#191c1e] line-clamp-1 leading-tight mb-1`}>
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
    </div>
  )
});

export default DragOverlayShowtime;
