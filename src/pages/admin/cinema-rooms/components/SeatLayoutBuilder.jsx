import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { 
  Square, 
  Armchair, 
  Sofa, 
  Eraser, 
  Save,
  Wand2,
  Trash2,
  Maximize2
} from 'lucide-react'

const getRowChar = (index) => String.fromCharCode(65 + index)

const TOOLS = [
  { id: 'STANDARD', name: 'Standard', icon: Square, colorClass: 'border-purple-600 bg-purple-600 text-white' },
  { id: 'VIP', name: 'VIP', icon: Armchair, colorClass: 'border-red-600 bg-red-600 text-white' },
  { id: 'COUPLE', name: 'Couple', icon: Sofa, colorClass: 'border-pink-500 bg-pink-500 text-white' },
  { id: 'EMPTY', name: 'Lối đi / Xóa', icon: Eraser, colorClass: 'border-dashed border-gray-300 bg-transparent text-gray-400 opacity-70' }
]

export default function SeatLayoutBuilder({ initialSeats = [], onSave, onCancel }) {
  const MAX_ROWS = 26
  const MAX_COLS = 50
  const MIN_ROWS = 5
  const MIN_COLS = 5

  let initialRows = 10
  let initialCols = 12

  if (initialSeats && initialSeats.length > 0) {
    let maxRowIdx = 0
    let maxColNum = 0
    initialSeats.forEach(seat => {
      const rowIdx = seat.row.charCodeAt(0) - 65
      if (rowIdx > maxRowIdx) maxRowIdx = rowIdx
      if (seat.number > maxColNum) maxColNum = seat.number
      if (seat.type === 'COUPLE') {
        if (seat.number + 1 > maxColNum) maxColNum = seat.number + 1
      }
    })
    initialRows = Math.min(Math.max(maxRowIdx + 1, MIN_ROWS), MAX_ROWS)
    initialCols = Math.min(Math.max(maxColNum, MIN_COLS), MAX_COLS)
  }

  const [rows, setRows] = useState(initialRows)
  const [cols, setCols] = useState(initialCols)
  const [selectedTool, setSelectedTool] = useState('STANDARD')
  const [gridData, setGridData] = useState([])
  const [sweetSpotMode, setSweetSpotMode] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDrawing(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  // Gaussian scoring algorithm based on SMPTE/THX cinema standards
  const getSeatScore = (r, c, rCount, cCount) => {
    // 1. Distance score — THX Two-Thirds Rule: ideal row is at 66% depth from screen
    const idealRow = rCount * 0.66
    const sigmaRow = rCount * 0.20
    const distScore = Math.exp(-Math.pow(r - idealRow, 2) / (2 * sigmaRow * sigmaRow))

    // 2. Centering score — SMPTE: center column is optimal for symmetrical viewing angle
    const idealCol = (cCount - 1) / 2
    const sigmaCol = cCount * 0.25
    const centerScore = Math.exp(-Math.pow(c - idealCol, 2) / (2 * sigmaCol * sigmaCol))

    // 3. Front penalty — SMPTE: vertical viewing angle > 35° causes neck strain
    const frontRatio = r / rCount
    const frontPenalty = frontRatio < 0.15 ? 0.25 : frontRatio < 0.25 ? 0.6 : 1.0

    // Weighted combination: distance 50%, centering 35%, vertical comfort 15%
    return (0.50 * distScore + 0.35 * centerScore + 0.15 * frontPenalty)
  }

  // Pre-compute score grid for performance (memoized)
  const scoreGrid = useMemo(() => {
    const grid = []
    for (let r = 0; r < rows; r++) {
      const rowScores = []
      for (let c = 0; c < cols; c++) {
        rowScores.push(getSeatScore(r, c, rows, cols))
      }
      grid.push(rowScores)
    }
    return grid
  }, [rows, cols])

  // Get heatmap color based on score
  const getHeatmapStyle = (score) => {
    if (score > 0.80) return { bg: 'rgba(234, 179, 8, 0.18)', border: 'rgba(234, 179, 8, 0.35)' }   // Gold — VIP zone
    if (score > 0.55) return { bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.20)' }  // Blue — Premium
    if (score > 0.35) return { bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.15)' } // Gray — Standard
    return { bg: 'transparent', border: 'transparent' }                                               // Economy
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGridData(prevGrid => {
      const isResize = prevGrid.length !== rows || (prevGrid.length > 0 && prevGrid[0].length !== cols)
      const isInitial = prevGrid.length === 0

      if (!isResize && !isInitial && !sweetSpotMode) {
        return prevGrid
      }

      const newGrid = []
      for (let r = 0; r < rows; r++) {
        const rowArr = []
        for (let c = 0; c < cols; c++) {
          if (prevGrid[r] && prevGrid[r][c]) {
            rowArr.push({ ...prevGrid[r][c] })
          } else {
            rowArr.push({
              rowIdx: r,
              colIdx: c,
              rowName: getRowChar(r),
              colNum: c + 1,
              id: `${getRowChar(r)}${c + 1}`,
              type: 'EMPTY',
              isSecondHalf: false
            })
          }
        }
        newGrid.push(rowArr)
      }

      if (isInitial && initialSeats.length > 0) {
        initialSeats.forEach(seat => {
          const r = seat.row.charCodeAt(0) - 65
          const c = seat.number - 1
          if (r < rows && c < cols) {
            newGrid[r][c].type = seat.type
            if (seat.type === 'COUPLE') {
              if (c + 1 < cols) {
                newGrid[r][c + 1].type = 'EMPTY'
                newGrid[r][c + 1].isSecondHalf = true
              }
            }
          }
        })
      }

      if (sweetSpotMode) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const score = getSeatScore(r, c, rows, cols)
            
            if (score > 0.80) {
               const cell = newGrid[r][c]
               if (cell.isSecondHalf) {
                 newGrid[r][c - 1] = { ...newGrid[r][c - 1], type: 'EMPTY' }
               }
               if (cell.type === 'COUPLE' && c + 1 < cols) {
                 newGrid[r][c + 1] = { ...newGrid[r][c + 1], isSecondHalf: false }
               }
               newGrid[r][c] = { ...cell, type: 'VIP', isSecondHalf: false }
            } else {
               if (newGrid[r][c].type === 'VIP') {
                 newGrid[r][c] = { ...newGrid[r][c], type: 'STANDARD' }
               }
            }
          }
        }
      }

      return newGrid
    })
  }, [rows, cols, initialSeats, sweetSpotMode])

  const handleCellClick = (r, c) => {
    if (sweetSpotMode) setSweetSpotMode(false)
    setGridData(prev => {
      const cell = prev[r][c]

      // Fast path optimization for dragging
      if (cell.type === selectedTool) {
        if (selectedTool !== 'COUPLE') return prev;
        if (selectedTool === 'COUPLE' && c + 1 < cols && prev[r][c + 1]?.isSecondHalf) return prev;
      }

      const newGrid = [...prev]
      newGrid[r] = [...newGrid[r]]
      const currentCell = newGrid[r][c]

      if (currentCell.isSecondHalf) {
        newGrid[r][c - 1] = { ...newGrid[r][c - 1], type: 'EMPTY' }
      }

      if (currentCell.type === 'COUPLE' && c + 1 < cols) {
        newGrid[r][c + 1] = { ...newGrid[r][c + 1], isSecondHalf: false }
      }

      if (selectedTool === 'COUPLE') {
        if (c + 1 < cols) {
          if (newGrid[r][c + 1].type === 'COUPLE' && c + 2 < cols) {
            newGrid[r] = [...newGrid[r]]
            newGrid[r][c + 2] = { ...newGrid[r][c + 2], isSecondHalf: false }
          }
          newGrid[r][c] = { ...currentCell, type: 'COUPLE', isSecondHalf: false }
          newGrid[r][c + 1] = { ...newGrid[r][c + 1], type: 'EMPTY', isSecondHalf: true }
        }
      } else {
        newGrid[r][c] = { ...currentCell, type: selectedTool, isSecondHalf: false }
      }

      return newGrid
    })
  }

  const handleCellMouseDown = (r, c, e) => {
    if (e.shiftKey) {
      setIsDrawing(true)
      e.preventDefault() // prevent text selection
    }
    handleCellClick(r, c)
  }

  const handleCellMouseEnter = (r, c, e) => {
    if (isDrawing && e.shiftKey) {
      handleCellClick(r, c)
    }
  }



  const handleSave = () => {
    const finalSeats = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = gridData[r][c]
        if (cell && cell.type !== 'EMPTY' && !cell.isSecondHalf) {
          finalSeats.push({
            id: `${cell.rowName}${cell.colNum}`,
            row: cell.rowName,
            number: cell.colNum,
            type: cell.type
          })
        }
      }
    }
    onSave(finalSeats)
  }

  const stats = useMemo(() => {
    let standard = 0
    let vip = 0
    let couple = 0
    let empty = 0
    
    gridData.forEach(row => {
      row.forEach(cell => {
        if (!cell.isSecondHalf) {
          if (cell.type === 'STANDARD') standard++
          if (cell.type === 'VIP') vip++
          if (cell.type === 'COUPLE') couple++
          if (cell.type === 'EMPTY') empty++
        }
      })
    })
    
    const totalPhysical = standard + vip + couple * 2
    const capacityTotal = rows * cols
    const fillRate = capacityTotal > 0 ? Math.round((totalPhysical / capacityTotal) * 100) : 0

    return { standard, vip, couple, empty, totalPhysical, fillRate }
  }, [gridData, rows, cols])

  // Score-based sweet spot check
  const isSweetSpot = (r, c) => scoreGrid[r]?.[c] > 0.80

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Top Action Bar (Sleek design toolbar) */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="px-3 border-r border-slate-100 mr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bộ công cụ</span>
          </div>
          
          <div className="flex gap-2">
            {TOOLS.map(tool => {
              const isSelected = selectedTool === tool.id
              const ToolIcon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  title={tool.name}
                  className={`
                    flex items-center gap-2.5 px-4 h-10 rounded-xl transition-all duration-200 text-xs font-semibold
                    ${isSelected 
                      ? 'bg-slate-900 shadow-md shadow-slate-900/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                  style={isSelected ? { color: '#ffffff' } : undefined}
                >
                  <ToolIcon size={15} />
                  <span className="hidden sm:inline">{tool.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setSweetSpotMode(!sweetSpotMode)}
              title="Tự động tính toán & gợi ý vùng ghế VIP trung tâm tốt nhất"
              className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all duration-200 text-xs font-semibold ${sweetSpotMode ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-slate-600 border border-slate-100 hover:bg-slate-50'}`}
            >
              <Wand2 size={15} className={sweetSpotMode ? 'text-amber-600 animate-pulse' : ''} />
              <span>Gợi ý vùng VIP</span>
            </button>
            
            <button
              onClick={() => {
                if(window.confirm('Bạn có chắc muốn xóa toàn bộ lưới ghế?')) {
                  if (sweetSpotMode) setSweetSpotMode(false)
                  setGridData(prev => prev.map(row => row.map(cell => ({...cell, type: 'EMPTY', isSecondHalf: false}))))
                }
              }}
              title="Đặt lại sơ đồ về trống"
              className="flex items-center gap-2 px-3 h-10 rounded-xl transition-all duration-200 text-xs font-semibold text-slate-500 border border-slate-100 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Xóa lưới</span>
            </button>

            <div className="w-px h-8 bg-slate-100 mx-1" />

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-10 rounded-xl transition-all duration-200 bg-[var(--color-primary)] text-white font-bold text-xs shadow-md shadow-red-500/10 hover:bg-red-700 hover:scale-[1.02]"
            >
              <Save size={15} />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[600px] bg-[#0c0d14] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
      {/* Main Immersive Canvas Area */}
      <div className="flex-1 relative flex flex-col canvas-bg">
        
        {/* Scrollable Container for Grid (Horizontal Only) */}
        <div className="w-full overflow-x-auto pb-16 pt-8 custom-scrollbar">
          
          <div className="min-w-max flex flex-col items-center px-16 select-none">
            
            {/* 3D Curved Projector Screen */}
            <div 
              className="h-24 mb-24 relative flex justify-center pointer-events-none transition-all duration-500"
              style={{ width: `${Math.max(420, cols * 48 + 40)}px` }}
            >
              {/* Glow Behind */}
              <div className="absolute top-0 w-[80%] h-full bg-red-600/20 opacity-70 blur-[40px] rounded-[100%] screen-glow" />
              {/* Screen Surface */}
              <div 
                className="w-4/5 h-16 bg-gradient-to-b from-red-950/20 to-red-900/10 border border-red-500/30 rounded-b-[40px] shadow-[0_15px_30px_rgba(239,68,68,0.15)] flex items-center justify-center"
              >
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-[0.6em] text-shadow-glow">
                  MÀN HÌNH CHIẾU
                </span>
              </div>
            </div>

            {/* Grid Map with Sightline Guides */}
            <div className="relative">
              {/* SVG Viewing Angle Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <line x1="5%" y1="0" x2="50%" y2="100%" stroke="url(#lineGrad)" strokeWidth="1" className="laser-line" />
                <line x1="95%" y1="0" x2="50%" y2="100%" stroke="url(#lineGrad)" strokeWidth="1" className="laser-line" />
                <circle cx="50%" cy="66%" r="6" fill="var(--color-primary)" fillOpacity="0.15" />
                <text x="50%" y="66%" textAnchor="middle" dy="16" fill="var(--color-primary)" fillOpacity="0.3" fontSize="8" fontWeight="700" fontFamily="monospace">THX SWEET SPOT</text>
              </svg>

            <div className="flex flex-col gap-4 relative z-[1]">
              {gridData.map((rowArr, rIndex) => (
                <div key={`row-${rIndex}`} className="flex items-center gap-4">
                  {/* Left Row Label */}
                  <div className="w-5 text-right font-black text-slate-500 text-[11px] tracking-wider font-mono">
                    {getRowChar(rIndex)}
                  </div>

                  {/* Seat Row */}
                  <div className="flex gap-2">
                    {rowArr.map((cell, cIndex) => {
                      if (cell.isSecondHalf) return null

                      const isCouple = cell.type === 'COUPLE'
                      const score = scoreGrid[rIndex]?.[cIndex] ?? 0
                      const sweetSpotHint = selectedTool === 'VIP' && score > 0.80 && cell.type !== 'VIP'
                      const heatmap = sweetSpotMode ? getHeatmapStyle(score) : null

                      let seatStyle = ''
                      if (cell.type === 'STANDARD') {
                        seatStyle = 'bg-[#1e293b]/40 border border-slate-700/50 text-slate-400 hover:bg-[#1e293b]/70 hover:text-white shadow-sm'
                      } else if (cell.type === 'VIP') {
                        seatStyle = 'bg-emerald-950/20 border border-emerald-500/80 text-emerald-400 hover:bg-emerald-900/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      } else if (cell.type === 'COUPLE') {
                        seatStyle = 'bg-rose-950/20 border border-pink-500/80 text-pink-400 hover:bg-rose-900/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      } else {
                        // Empty / Walkway
                        seatStyle = 'border border-dashed border-slate-800/80 bg-transparent text-slate-700/60 hover:bg-slate-900/50 hover:border-slate-700 transition-colors'
                      }

                      return (
                        <motion.div
                          key={cell.id}
                          whileHover={{ scale: cell.type !== 'EMPTY' ? 1.08 : 1, zIndex: 10 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCellClick(rIndex, cIndex)}
                          onMouseDown={(e) => handleCellMouseDown(rIndex, cIndex, e)}
                          onMouseEnter={(e) => handleCellMouseEnter(rIndex, cIndex, e)}
                          className={`
                            relative flex flex-col items-center justify-center rounded-t-lg rounded-b-md transition-all cursor-pointer shrink-0
                            h-10 ${isCouple ? 'w-[88px]' : 'w-10'}
                            ${seatStyle}
                            ${sweetSpotHint ? 'ring-2 ring-amber-500 ring-offset-1' : ''}
                          `}
                          style={heatmap ? { 
                            boxShadow: `inset 0 0 0 1.5px ${heatmap.border}`, 
                            backgroundColor: cell.type === 'EMPTY' ? heatmap.bg : undefined 
                          } : undefined}
                        >
                          {isCouple && (
                            <>
                              {/* Cushion Divider visual styling */}
                              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-pink-500/30 z-10" />
                              <div className="absolute top-[2px] left-1/2 w-1.5 h-1.5 bg-pink-500/40 -translate-x-1/2 rounded-full border border-black/5 z-10" />
                            </>
                          )}
                          
                          {isCouple ? (
                            <div className="relative z-20 flex w-full justify-between px-2.5">
                              <span className="text-[9px] font-extrabold uppercase tracking-tighter">
                                {cell.id}
                              </span>
                              <span className="text-[9px] font-extrabold uppercase tracking-tighter">
                                {cell.rowName}{cell.colNum + 1}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-extrabold uppercase tracking-tighter relative z-20">
                              {cell.id}
                            </span>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Right Row Label */}
                  <div className="w-5 text-left font-black text-slate-500 text-[11px] tracking-wider font-mono">
                    {getRowChar(rIndex)}
                  </div>
                </div>
              ))}
              
              {/* Bottom Col Labels */}
              <div className="flex items-center gap-4 mt-4">
                <div className="w-5" />
                <div className="flex gap-2">
                  {Array.from({ length: cols }).map((_, i) => (
                    <div key={`col-lbl-${i}`} className="w-10 text-center font-bold text-slate-500 text-[9px] shrink-0 font-mono">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="w-5" />
              </div>

            </div>

            </div> {/* Close sightline wrapper */}

            {/* Legend / Chú thích (Clean layout) */}
            <div className="mt-14 w-full max-w-[800px] border-t border-slate-800/80 pt-6">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Chú thích loại ghế</div>
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-[#1e293b]/40 border border-slate-700/50" />
                  <span className="text-xs text-slate-400 font-semibold">Standard (Thường)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-950/20 border border-emerald-500/80" />
                  <span className="text-xs text-slate-400 font-semibold">VIP (Cao cấp)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-5 rounded bg-rose-950/20 border border-pink-500/80" />
                  <span className="text-xs text-slate-400 font-semibold">Couple (Ghế đôi)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-dashed border-slate-800 bg-transparent" />
                  <span className="text-xs text-slate-500 font-medium">Lối đi / Hàng trống</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Panel: Statistics & Grid Setup */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#0e0f14] p-6 flex flex-col z-10">
        
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-3 border-b border-slate-800/60 font-mono">
          CHI TIẾT SƠ ĐỒ
        </h2>

        {/* Stats Section */}
        <div className="space-y-3.5 mb-8">
          <div className="flex justify-between items-end pb-3 border-b border-slate-800/80 mb-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng số ghế (Total)</span>
            <span className="text-3xl font-extrabold text-blue-500 font-mono leading-none">{stats.totalPhysical}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-xl border border-slate-800/60 bg-slate-900/30">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded bg-[#1e293b]/60 border border-slate-700/50 shadow-sm" />
              <span className="text-xs text-slate-400 font-semibold">Ghế Standard</span>
            </div>
            <span className="font-bold text-slate-300 text-sm font-mono">{stats.standard}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500 shadow-sm" />
              <span className="text-xs text-emerald-400 font-semibold">Ghế VIP</span>
            </div>
            <span className="font-bold text-emerald-400 text-sm font-mono">{stats.vip}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl border border-pink-500/20 bg-rose-950/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-3.5 rounded bg-pink-500/20 border border-pink-500 shadow-sm" />
              <span className="text-xs text-pink-400 font-semibold">Ghế Đôi</span>
            </div>
            <span className="font-bold text-pink-400 text-sm font-mono">{stats.couple}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl border border-dashed border-slate-800 bg-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded border border-dashed border-slate-700 bg-transparent" />
              <span className="text-xs text-slate-500 font-semibold">Lối đi / Blocked</span>
            </div>
            <span className="font-bold text-slate-500 text-sm font-mono">{stats.empty}</span>
          </div>

          {sweetSpotMode && (
            <div className="mt-4 p-4 rounded-xl border border-amber-950/40 bg-amber-950/10">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
                <Wand2 size={12} className="text-amber-500" />
                Bản đồ nhiệt gợi ý
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm border border-amber-500/40 bg-amber-950/30" />
                  <span className="text-slate-400 font-medium">VIP Zone (Sweet Spot)</span>
                  <span className="text-amber-500 ml-auto font-bold">&gt;80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm border border-blue-500/40 bg-blue-950/30" />
                  <span className="text-slate-400 font-medium">Premium</span>
                  <span className="text-blue-400 ml-auto font-bold">55-80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm border border-slate-700/40 bg-slate-900/30" />
                  <span className="text-slate-400 font-medium">Standard</span>
                  <span className="text-slate-500 ml-auto font-bold">35-55%</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tỷ lệ lấp đầy (Capacity)</span>
              <span className="text-sm font-bold text-red-500 font-mono">{stats.fillRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-500 rounded-full" 
                style={{ width: `${stats.fillRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Grid Dimensions */}
        <div className="rounded-2xl p-4 mt-auto border border-slate-800/60 bg-slate-900/30">
          <h3 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <Maximize2 size={14} className="text-red-500" />
            CẤU HÌNH LƯỚI
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">SỐ HÀNG NGANG (ROWS)</label>
                <span className="text-xs font-bold text-red-500 font-mono">{rows}</span>
              </div>
              <input 
                type="range" min={MIN_ROWS} max={MAX_ROWS} 
                value={rows} onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">SỐ CỘT (COLS)</label>
                <span className="text-xs font-bold text-red-500 font-mono">{cols}</span>
              </div>
              <input 
                type="range" min={MIN_COLS} max={MAX_COLS} 
                value={cols} onChange={(e) => setCols(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>
          
          <div className="mt-4 pt-2">
            <button 
              onClick={onCancel}
              className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl transition-all hover:bg-slate-800 hover:text-white shadow-sm"
            >
              Thoát cấu hình
            </button>
          </div>
        </div>

      </div>

      {/* Styles for premium interactive animations */}
      <style>{`
        .canvas-bg {
          background-color: #0c0d14;
          background-image: radial-gradient(#1e293b 1.2px, transparent 1.2px);
          background-size: 24px 24px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(30, 41, 59, 0.8);
        }
        @keyframes glowBreathing {
          0%, 100% { opacity: 0.5; filter: blur(35px); }
          50% { opacity: 0.7; filter: blur(45px); }
        }
        .screen-glow {
          animation: glowBreathing 4s ease-in-out infinite;
        }
        @keyframes laserSweep {
          to {
            stroke-dashoffset: -20;
          }
        }
        .laser-line {
          stroke-dasharray: 5, 5;
          animation: laserSweep 2s linear infinite;
        }
        input[type="range"]::-webkit-slider-thumb {
          background: var(--color-primary);
        }
        .text-shadow-glow {
          text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        }
      `}</style>
    </div>
    </div>
  )
}
