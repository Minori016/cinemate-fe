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
  Maximize2,
  Minimize2,
  AlertCircle,
  Paintbrush,
  MousePointer,
  Wrench,
  CheckCircle
} from 'lucide-react'

const getRowChar = (index) => String.fromCharCode(65 + index)

const TOOLS = [
  { id: 'SELECT', name: 'Chọn ghế', icon: MousePointer, activeClass: 'bg-blue-50 border-blue-300 text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.1)]' },
  { id: 'STANDARD', name: 'Standard', icon: Square, activeClass: 'bg-slate-100 border-slate-350 text-slate-700 shadow-sm' },
  { id: 'VIP', name: 'VIP', icon: Armchair, activeClass: 'bg-blue-50 border-blue-300 text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.1)]' },
  { id: 'COUPLE', name: 'Couple', icon: Sofa, activeClass: 'bg-red-500 border-red-650 text-white shadow-[0_0_8px_rgba(239,68,68,0.2)]' },
  { id: 'EMPTY', name: 'Lối đi / Xóa', icon: Eraser, activeClass: 'bg-slate-200 border-slate-400 text-slate-700 shadow-sm' }
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
  const [selectedTool, setSelectedTool] = useState('SELECT')
  const [gridData, setGridData] = useState([])
  const [sweetSpotMode, setSweetSpotMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [rowsInput, setRowsInput] = useState(initialRows.toString())
  const [colsInput, setColsInput] = useState(initialCols.toString())
  const [localError, setLocalError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Selection states
  const [selectedSeats, setSelectedSeats] = useState([])
  const [dragStart, setDragStart] = useState(null)
  const [isDraggingSelect, setIsDraggingSelect] = useState(false)

  // Clear selections when tool changes
  useEffect(() => {
    setSelectedSeats([])
  }, [selectedTool])

  useEffect(() => {
    setRowsInput(rows.toString())
    setLocalError('')
  }, [rows])

  useEffect(() => {
    setColsInput(cols.toString())
    setLocalError('')
  }, [cols])

  useEffect(() => {
    setLocalError('')
  }, [gridData])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDrawing(false)
      setIsDraggingSelect(false)
      setDragStart(null)
    }
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
              status: 'ACTIVE',
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
            newGrid[r][c].status = seat.status || 'ACTIVE'
            if (seat.type === 'COUPLE') {
              if (c + 1 < cols) {
                newGrid[r][c + 1].type = 'EMPTY'
                newGrid[r][c + 1].isSecondHalf = true
                newGrid[r][c + 1].status = seat.status || 'ACTIVE'
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
    if (selectedTool === 'SELECT') {
      const cellKey = `${r}-${c}`
      if (gridData[r]?.[c] && gridData[r][c].type !== 'EMPTY') {
        setSelectedSeats(prev => {
          if (prev.includes(cellKey)) {
            return prev.filter(k => k !== cellKey)
          } else {
            return [...prev, cellKey]
          }
        })
      }
      return
    }

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
          newGrid[r][c] = { ...currentCell, type: 'COUPLE', isSecondHalf: false, status: 'ACTIVE' }
          newGrid[r][c + 1] = { ...newGrid[r][c + 1], type: 'EMPTY', isSecondHalf: true, status: 'ACTIVE' }
        }
      } else {
        newGrid[r][c] = { ...currentCell, type: selectedTool, isSecondHalf: false, status: 'ACTIVE' }
      }

      return newGrid
    })
  }

  const handleCellMouseDown = (r, c, e) => {
    if (selectedTool === 'SELECT' || e.ctrlKey) {
      setIsDraggingSelect(true)
      setDragStart({ r, c })
      e.preventDefault() // prevent text selection
      
      const cellKey = `${r}-${c}`
      const isAlreadySelected = selectedSeats.includes(cellKey)
      if (e.ctrlKey) {
        if (isAlreadySelected) {
          setSelectedSeats(prev => prev.filter(k => k !== cellKey))
        } else {
          if (gridData[r]?.[c] && gridData[r][c].type !== 'EMPTY') {
            setSelectedSeats(prev => [...prev, cellKey])
          }
        }
      } else {
        if (gridData[r]?.[c] && gridData[r][c].type !== 'EMPTY') {
          setSelectedSeats([cellKey])
        } else {
          setSelectedSeats([])
        }
      }
      return
    }

    if (e.shiftKey) {
      setIsDrawing(true)
      e.preventDefault() // prevent text selection
    }
    handleCellClick(r, c)
  }

  const handleCellMouseEnter = (r, c, e) => {
    if (isDraggingSelect && dragStart) {
      const minR = Math.min(dragStart.r, r)
      const maxR = Math.max(dragStart.r, r)
      const minC = Math.min(dragStart.c, c)
      const maxC = Math.max(dragStart.c, c)
      
      const boxKeys = []
      for (let rowIdx = minR; rowIdx <= maxR; rowIdx++) {
        for (let colIdx = minC; colIdx <= maxC; colIdx++) {
          const cell = gridData[rowIdx]?.[colIdx]
          if (cell && cell.type !== 'EMPTY' && !cell.isSecondHalf) {
            boxKeys.push(`${rowIdx}-${colIdx}`)
          }
        }
      }

      if (e.ctrlKey) {
        setSelectedSeats(prev => {
          const union = new Set([...prev, ...boxKeys])
          return Array.from(union)
        })
      } else {
        setSelectedSeats(boxKeys)
      }
      return
    }

    if (isDrawing && e.shiftKey) {
      handleCellClick(r, c)
    }
  }

  const handleClearRow = (rowIdx) => {
    setConfirmDialog({
      title: 'Xác nhận bỏ chọn hàng',
      message: `Bạn có chắc chắn muốn bỏ chọn (đưa toàn bộ ghế về lối đi) cho Hàng ${getRowChar(rowIdx)}?`,
      onConfirm: () => {
        setGridData(prev => {
          const newGrid = prev.map((rowArr, rIdx) => {
            if (rIdx !== rowIdx) return rowArr
            return rowArr.map(cell => ({
              ...cell,
              type: 'EMPTY',
              isSecondHalf: false
            }))
          })
          
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cell = newGrid[r][c]
              if (cell.type === 'COUPLE') {
                if (c + 1 >= cols || newGrid[r][c + 1].type !== 'EMPTY' || !newGrid[r][c + 1].isSecondHalf) {
                  newGrid[r][c].type = 'EMPTY'
                  newGrid[r][c].isSecondHalf = false
                }
              } else if (cell.isSecondHalf) {
                if (c === 0 || newGrid[r][c - 1].type !== 'COUPLE') {
                  newGrid[r][c].type = 'EMPTY'
                  newGrid[r][c].isSecondHalf = false
                }
              }
            }
          }
          return newGrid
        })
        setConfirmDialog(null)
      }
    })
  }

  const handleClearCol = (colIdx) => {
    setConfirmDialog({
      title: 'Xác nhận bỏ chọn cột',
      message: `Bạn có chắc chắn muốn bỏ chọn (đưa toàn bộ ghế về lối đi) cho Cột ${colIdx + 1}?`,
      onConfirm: () => {
        setGridData(prev => {
          const newGrid = prev.map(rowArr => {
            return rowArr.map((cell, cIdx) => {
              if (cIdx !== colIdx) return cell
              return {
                ...cell,
                type: 'EMPTY',
                isSecondHalf: false
              }
            })
          })
          
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cell = newGrid[r][c]
              if (cell.type === 'COUPLE') {
                if (c + 1 >= cols || newGrid[r][c + 1].type !== 'EMPTY' || !newGrid[r][c + 1].isSecondHalf) {
                  newGrid[r][c].type = 'EMPTY'
                  newGrid[r][c].isSecondHalf = false
                }
              } else if (cell.isSecondHalf) {
                if (c === 0 || newGrid[r][c - 1].type !== 'COUPLE') {
                  newGrid[r][c].type = 'EMPTY'
                  newGrid[r][c].isSecondHalf = false
                }
              }
            }
          }
          return newGrid
        })
        setConfirmDialog(null)
      }
    })
  }

  const handleApplyToolToRow = (rowIdx) => {
    if (selectedTool === 'SELECT') {
      alert('Vui lòng chọn một công cụ thiết lập loại ghế (Standard, VIP, Couple, Lối đi) để áp dụng cho cả hàng.');
      return;
    }
    setGridData(prev => {
      const newGrid = prev.map(rowArr => rowArr.map(cell => ({ ...cell })))
      
      if (selectedTool === 'COUPLE') {
        for (let c = 0; c < cols; c += 2) {
          if (c + 1 < cols) {
            newGrid[rowIdx][c].type = 'COUPLE'
            newGrid[rowIdx][c].isSecondHalf = false
            newGrid[rowIdx][c].status = 'ACTIVE'
            newGrid[rowIdx][c + 1].type = 'EMPTY'
            newGrid[rowIdx][c + 1].isSecondHalf = true
            newGrid[rowIdx][c + 1].status = 'ACTIVE'
          } else {
            newGrid[rowIdx][c].type = 'EMPTY'
            newGrid[rowIdx][c].isSecondHalf = false
            newGrid[rowIdx][c].status = 'ACTIVE'
          }
        }
      } else {
        for (let c = 0; c < cols; c++) {
          newGrid[rowIdx][c].type = selectedTool
          newGrid[rowIdx][c].isSecondHalf = false
          newGrid[rowIdx][c].status = 'ACTIVE'
        }
      }
      return newGrid
    })
  }

  const handleApplyToolToCol = (colIdx) => {
    if (selectedTool === 'SELECT') {
      alert('Vui lòng chọn một công cụ thiết lập loại ghế (Standard, VIP, Couple, Lối đi) để áp dụng cho cả cột.');
      return;
    }
    if (selectedTool === 'COUPLE') {
      alert('Không thể áp dụng công cụ Ghế đôi (Couple) theo chiều dọc cột. Ghế đôi bắt buộc phải xếp theo hàng ngang.');
      return;
    }
    
    setGridData(prev => {
      const newGrid = prev.map(rowArr => rowArr.map(cell => ({ ...cell })))
      
      for (let r = 0; r < rows; r++) {
        newGrid[r][colIdx].type = selectedTool
        newGrid[r][colIdx].isSecondHalf = false
        newGrid[r][colIdx].status = 'ACTIVE'
      }
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = newGrid[r][c]
          if (cell.type === 'COUPLE') {
            if (c + 1 >= cols || newGrid[r][c + 1].type !== 'EMPTY' || !newGrid[r][c + 1].isSecondHalf) {
              newGrid[r][c].type = 'EMPTY'
              newGrid[r][c].isSecondHalf = false
            }
          } else if (cell.isSecondHalf) {
            if (c === 0 || newGrid[r][c - 1].type !== 'COUPLE') {
              newGrid[r][c].type = 'EMPTY'
              newGrid[r][c].isSecondHalf = false
            }
          }
        }
      }
      return newGrid
    })
  }

  const handleBatchStatusChange = (newStatus) => {
    setGridData(prev => {
      const newGrid = prev.map(rowArr => rowArr.map(cell => ({ ...cell })))
      selectedSeats.forEach(key => {
        const [rStr, cStr] = key.split('-')
        const r = parseInt(rStr, 10)
        const c = parseInt(cStr, 10)
        if (newGrid[r] && newGrid[r][c]) {
          newGrid[r][c].status = newStatus
          if (newGrid[r][c].type === 'COUPLE' && c + 1 < cols && newGrid[r][c + 1].isSecondHalf) {
            newGrid[r][c + 1].status = newStatus
          }
        }
      })
      return newGrid
    })
    setSelectedSeats([])
  }

  const handleSave = () => {
    const totalSeatsCount = stats.totalPhysical
    if (totalSeatsCount < 80 || totalSeatsCount > 250) {
      setLocalError(`Tổng số ghế phải từ 80 đến 250 ghế (hiện tại: ${totalSeatsCount} ghế).`)
      return
    }

    const finalSeats = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = gridData[r][c]
        if (cell && cell.type !== 'EMPTY' && !cell.isSecondHalf) {
          finalSeats.push({
            id: `${cell.rowName}${cell.colNum}`,
            row: cell.rowName,
            number: cell.colNum,
            type: cell.type,
            status: cell.status || 'ACTIVE'
          })
        }
      }
    }
    onSave({ rows, cols, seats: finalSeats })
  }

  const stats = useMemo(() => {
    let standard = 0
    let vip = 0
    let couple = 0
    let empty = 0
    let maintenance = 0
    
    gridData.forEach(row => {
      row.forEach(cell => {
        if (!cell.isSecondHalf) {
          if (cell.type === 'STANDARD') standard++
          if (cell.type === 'VIP') vip++
          if (cell.type === 'COUPLE') couple++
          if (cell.type === 'EMPTY') empty++
          if (cell.type !== 'EMPTY' && cell.status === 'MAINTENANCE') maintenance++
        }
      })
    })
    
    const totalPhysical = standard + vip + couple * 2
    const capacityTotal = rows * cols
    const fillRate = capacityTotal > 0 ? Math.round((totalPhysical / capacityTotal) * 100) : 0

    return { standard, vip, couple, empty, maintenance, totalPhysical, fillRate }
  }, [gridData, rows, cols])

  // Score-based sweet spot check
  const isSweetSpot = (r, c) => scoreGrid[r]?.[c] > 0.80

  return (
    <div className={`flex flex-col font-sans transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[100] bg-slate-50/95 backdrop-blur-md p-4 md:p-6 overflow-hidden' 
        : 'gap-6'
    }`}>
      
      {/* Top Action Bar (Sleek design toolbar) */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm gap-3">
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
                    flex items-center gap-2.5 px-4 h-10 rounded-xl transition-all duration-200 text-xs font-semibold border cursor-pointer
                    ${isSelected 
                      ? tool.activeClass 
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
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
              className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all duration-200 text-xs font-semibold cursor-pointer border ${
                sweetSpotMode 
                  ? 'text-amber-700 bg-amber-50 border border-amber-200 shadow-sm' 
                  : 'text-slate-600 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              <Wand2 size={15} className={sweetSpotMode ? 'text-amber-600 animate-pulse' : ''} />
              <span>Gợi ý vùng VIP</span>
            </button>
            
            <button
              onClick={() => {
                setConfirmDialog({
                  title: 'Xác nhận xóa lưới',
                  message: 'Bạn có chắc chắn muốn bỏ chọn toàn bộ ghế và đưa lưới về trạng thái trống?',
                  onConfirm: () => {
                    if (sweetSpotMode) setSweetSpotMode(false)
                    setGridData(prev => prev.map(row => row.map(cell => ({...cell, type: 'EMPTY', isSecondHalf: false}))))
                    setConfirmDialog(null)
                  }
                })
              }}
              title="Đặt lại sơ đồ về trống"
              className="flex items-center gap-2 px-3.5 h-10 rounded-xl transition-all duration-200 text-xs font-semibold text-slate-500 border border-slate-100 hover:border-red-200 hover:text-red-650 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Xóa lưới</span>
            </button>

            <div className="w-px h-8 bg-slate-100 mx-1" />

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}
              className={`flex items-center gap-2 px-3.5 h-10 rounded-xl transition-all duration-200 text-xs font-semibold border cursor-pointer ${
                isFullscreen 
                  ? 'text-blue-600 bg-blue-50 border-blue-200 shadow-sm' 
                  : 'text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>

            <div className="w-px h-8 bg-slate-100 mx-1" />

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-10 rounded-xl transition-all duration-200 bg-red-600 text-white font-bold text-xs shadow-md shadow-red-500/10 hover:bg-red-700 active:scale-[0.98] cursor-pointer border-none"
            >
              <Save size={15} />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>
      </div>

      {localError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-55 border border-red-200 rounded-xl text-red-600 text-xs font-bold leading-relaxed max-w-2xl animate-shake">
          <AlertCircle className="shrink-0 mt-0.5" size={14} />
          <span>{localError}</span>
        </div>
      )}

      <div className={`flex flex-col lg:flex-row bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden ${
        isFullscreen ? 'flex-1 min-h-0 mt-4' : 'min-h-[600px]'
      }`}>
      {/* Main Immersive Canvas Area */}
      <div className="flex-1 min-w-0 relative flex flex-col canvas-bg">
        
        {/* Scrollable Container for Grid (Horizontal Only) */}
        <div className="w-full overflow-x-auto pb-16 pt-8 custom-scrollbar text-center">
          
          <div className="inline-flex flex-col items-center px-16 select-none relative text-left">
            
            {/* Screen curve graphic */}
            <div 
              className="h-16 mb-12 relative flex flex-col items-center justify-start pointer-events-none transition-all duration-500"
              style={{ width: `${Math.max(420, cols * 48 + 40)}px` }}
            >
              <div className="w-4/5 h-8 screen-curve rounded-[100%] border-t-2 border-red-500/50"></div>
              <p className="text-[10px] text-red-500/50 font-bold uppercase tracking-[0.25em] mt-3">Màn Hình Chiếu</p>
            </div>

            {/* Grid Map with Sightline Guides */}
            <div className="relative p-6 md:p-8 border-[3px] border-slate-300 rounded-3xl bg-white shadow-xl ring-[10px] ring-slate-100/50">
              
              {/* Lối đi bên trái (Walkway) */}
              <div className="absolute left-3 md:left-5 top-8 bottom-8 w-14 border-x-2 border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center rounded-lg pointer-events-none z-0">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] opacity-80" style={{ writingMode: 'vertical-rl' }}>LỐI ĐI (WALKWAY)</span>
              </div>
              
              {/* Lối đi bên phải (Walkway) */}
              <div className="absolute right-3 md:right-5 top-8 bottom-8 w-14 border-x-2 border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center rounded-lg pointer-events-none z-0">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] opacity-80" style={{ writingMode: 'vertical-rl' }}>LỐI ĐI (WALKWAY)</span>
              </div>

              {/* Cửa vào (Entrance) - Góc trên phải */}
              <div className="absolute top-12 right-0 translate-x-full w-14 h-28 flex items-center justify-start z-20 pointer-events-none">
                 <div className="w-full h-full border-[3px] border-l-0 border-emerald-400 rounded-r-3xl bg-emerald-50/90 shadow-md flex items-center justify-center relative backdrop-blur-sm overflow-hidden">
                   <div className="absolute -left-0.5 top-0 bottom-0 w-1 bg-white" />
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1" style={{ writingMode: 'vertical-rl' }}>CỬA VÀO</span>
                 </div>
              </div>

              {/* Cửa ra (Exit) - Góc dưới phải */}
              <div className="absolute bottom-12 right-0 translate-x-full w-14 h-28 flex items-center justify-start z-20 pointer-events-none">
                 <div className="w-full h-full border-[3px] border-l-0 border-red-400 rounded-r-3xl bg-red-50/90 shadow-md flex items-center justify-center relative backdrop-blur-sm overflow-hidden">
                   <div className="absolute -left-0.5 top-0 bottom-0 w-1 bg-white" />
                   <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] ml-1" style={{ writingMode: 'vertical-rl' }}>CỬA RA</span>
                 </div>
              </div>
              {/* SVG Viewing Angle Overlay (MindYourDecisions Best Seat Algorithm) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-[30] overflow-visible" preserveAspectRatio="none">
                <line 
                  x1={`calc(50% - ${(Math.max(420, cols * 48 + 40) * 0.8) / 2}px)`} y1="-80" 
                  x2="50%" y2="66%" 
                  stroke="rgba(239, 68, 68, 0.45)" strokeWidth="1.5" className="laser-line" 
                />
                <line 
                  x1={`calc(50% + ${(Math.max(420, cols * 48 + 40) * 0.8) / 2}px)`} y1="-80" 
                  x2="50%" y2="66%" 
                  stroke="rgba(239, 68, 68, 0.45)" strokeWidth="1.5" className="laser-line" 
                />
                <circle cx="50%" cy="66%" r="6" fill="rgba(239, 68, 68, 0.4)" fillOpacity="0.25" className="animate-pulse" />
                <circle cx="50%" cy="66%" r="2" fill="rgba(239, 68, 68, 0.8)" />
                <text x="50%" y="66%" textAnchor="middle" dy="18" fill="rgba(239, 68, 68, 0.6)" fillOpacity="0.8" fontSize="9" fontWeight="800" fontFamily="monospace" className="tracking-widest">
                  OPTIMAL VIEWING ANGLE
                </text>
              </svg>

            <div className="flex flex-col pt-4 pb-8 relative z-[20]">
              {gridData.map((rowArr, rIndex) => (
                <div 
                  key={`row-${rIndex}`} 
                  className="flex items-center gap-4 group/row relative transition-all duration-300"
                  style={{ 
                    zIndex: rIndex,
                    marginTop: rIndex === 0 ? '0' : '-16px' 
                  }}
                >
                  {/* Left Row Label with Actions */}
                  <div className="w-16 flex items-center justify-end gap-1 shrink-0 select-none relative z-10">
                    <button
                      onClick={() => handleApplyToolToRow(rIndex)}
                      title={`Áp dụng công cụ đang chọn cho Hàng ${getRowChar(rIndex)}`}
                      className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded transition-all bg-transparent border-none cursor-pointer flex items-center justify-center"
                    >
                      <Paintbrush size={11} />
                    </button>
                    <button
                      onClick={() => handleClearRow(rIndex)}
                      title={`Bỏ chọn (xóa tất cả ghế) Hàng ${getRowChar(rIndex)}`}
                      className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-red-650 p-0.5 rounded transition-all bg-transparent border-none cursor-pointer flex items-center justify-center"
                    >
                      <Trash2 size={11} />
                    </button>
                    <span className="font-black text-slate-500 text-[11px] tracking-wider font-mono">
                      {getRowChar(rIndex)}
                    </span>
                  </div>

                  {/* Seat Row Platform (Bậc thang 2.5D) */}
                  <div className="flex gap-2 relative px-4 py-4 rounded-[28px] bg-[#f8fafc] border-t-4 border-white shadow-[0_-12px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/50 backdrop-blur-sm">
                    {/* Đường viền phản quang của bậc thang */}
                    <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent" />
                    
                    {rowArr.map((cell, cIndex) => {
                      if (cell.isSecondHalf) return null

                      const isCouple = cell.type === 'COUPLE'
                      const score = scoreGrid[rIndex]?.[cIndex] ?? 0
                      const sweetSpotHint = selectedTool === 'VIP' && score > 0.80 && cell.type !== 'VIP'
                      const heatmap = sweetSpotMode ? getHeatmapStyle(score) : null

                      const isSelected = selectedSeats.includes(`${rIndex}-${cIndex}`)
                      const isMaintenance = cell.status === 'MAINTENANCE'

                      let seatStyle = ''
                      if (cell.type === 'STANDARD') {
                        seatStyle = isMaintenance 
                          ? 'bg-amber-50/40 border-2 border-amber-500 text-amber-600 shadow-sm font-semibold' 
                          : 'bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shadow-sm'
                      } else if (cell.type === 'VIP') {
                        seatStyle = isMaintenance 
                          ? 'bg-amber-50/40 border-2 border-amber-500 text-amber-600 shadow-sm font-semibold' 
                          : 'bg-blue-50 border border-blue-200 text-blue-500 hover:bg-blue-100/70 shadow-[0_0_8px_rgba(59,130,246,0.05)]'
                      } else if (cell.type === 'COUPLE') {
                        seatStyle = isMaintenance 
                          ? 'bg-amber-50/40 border-2 border-amber-500 text-amber-600 shadow-sm font-semibold' 
                          : 'bg-red-500 border border-red-600 text-white hover:bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                      } else {
                        // Empty / Walkway
                        seatStyle = 'border border-dashed border-slate-100 bg-transparent text-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors'
                      }

                      return (
                        <motion.div
                          key={`${cell.rowIdx}-${cell.colIdx}`}
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
                            ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 bg-emerald-500/20 scale-[1.02] z-30' : ''}
                          `}
                          style={heatmap ? { 
                            boxShadow: `inset 0 0 0 1.5px ${heatmap.border}`, 
                            backgroundColor: cell.type === 'EMPTY' ? heatmap.bg : undefined 
                          } : undefined}
                        >
                          {isCouple && (
                            <>
                              {/* Cushion Divider visual styling */}
                              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20 z-10" />
                              <div className="absolute top-[2px] left-1/2 w-1.5 h-1.5 bg-white/30 -translate-x-1/2 rounded-full border border-black/5 z-10" />
                            </>
                          )}
                          
                          {isCouple ? (
                            isMaintenance ? (
                              <div className="relative z-20 flex w-full items-center justify-between px-2.5">
                                <span className="text-[9px] font-extrabold uppercase tracking-tighter whitespace-nowrap">
                                  {cell.id}
                                </span>
                                <Wrench size={10} className="text-amber-500 shrink-0 mx-1" />
                                <span className="text-[9px] font-extrabold uppercase tracking-tighter whitespace-nowrap">
                                  {cell.rowName}{cell.colNum + 1}
                                </span>
                              </div>
                            ) : (
                              <div className="relative z-20 flex w-full justify-between px-2.5">
                                <span className="text-[9px] font-extrabold uppercase tracking-tighter whitespace-nowrap">
                                  {cell.id}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase tracking-tighter whitespace-nowrap">
                                  {cell.rowName}{cell.colNum + 1}
                                </span>
                              </div>
                            )
                          ) : (
                            isMaintenance ? (
                              <div className="flex flex-col items-center justify-center leading-none">
                                <span className="text-[8px] font-extrabold uppercase tracking-tighter opacity-80">{cell.id}</span>
                                <Wrench size={9} className="text-amber-500 mt-0.5" />
                              </div>
                            ) : (
                              <span className="text-[9px] font-extrabold uppercase tracking-tighter relative z-20">
                                {cell.type === 'EMPTY' ? '' : cell.id}
                              </span>
                            )
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Right Row Label */}
                  <div className="w-16 text-left font-black text-slate-500 text-[11px] tracking-wider font-mono shrink-0 select-none pl-1.5 relative z-10">
                    {getRowChar(rIndex)}
                  </div>
                </div>
              ))}
              
              {/* Bottom Col Labels */}
              <div className="flex items-center gap-4 mt-6">
                <div className="w-16" />
                <div className="flex gap-2">
                  {Array.from({ length: cols }).map((_, i) => (
                    <div key={`col-lbl-${i}`} className="w-10 flex flex-col items-center gap-1 group/col shrink-0">
                      <span className="font-bold text-slate-500 text-[9px] font-mono select-none">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-0.5 h-4">
                        <button
                          onClick={() => handleApplyToolToCol(i)}
                          title={`Áp dụng công cụ đang chọn cho Cột ${i + 1}`}
                          className="opacity-0 group-hover/col:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded transition-all bg-transparent border-none cursor-pointer flex items-center justify-center"
                        >
                          <Paintbrush size={10} />
                        </button>
                        <button
                          onClick={() => handleClearCol(i)}
                          title={`Bỏ chọn (xóa tất cả ghế) Cột ${i + 1}`}
                          className="opacity-0 group-hover/col:opacity-100 text-slate-400 hover:text-red-650 p-0.5 rounded transition-all bg-transparent border-none cursor-pointer flex items-center justify-center"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-16" />
              </div>

            </div>

            </div>

            {/* Legend / Chú thích (Clean layout) */}
            <div className="mt-14 w-full max-w-[800px] border-t border-slate-200 pt-6">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Chú thích loại ghế</div>
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-slate-50 border border-slate-200" />
                  <span className="text-xs text-slate-600 font-semibold">Standard (Thường)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200" />
                  <span className="text-xs text-slate-600 font-semibold">VIP (Cao cấp)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-5 rounded bg-red-500 border border-red-600" />
                  <span className="text-xs text-slate-600 font-semibold">Couple (Ghế đôi)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-amber-50/40 border-2 border-amber-500 flex items-center justify-center text-amber-500">
                    <Wrench size={10} />
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">Bảo trì (MAINTENANCE)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-dashed border-slate-200 bg-transparent" />
                  <span className="text-xs text-slate-500 font-medium">Lối đi / Hàng trống</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating panel for batch seat selection actions */}
        {selectedSeats.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-5 py-3 bg-white border border-slate-200/80 shadow-2xl rounded-2xl backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600 border border-blue-100 font-mono">
                {selectedSeats.length}
              </span>
              <span className="text-xs font-bold text-slate-700">ghế đang chọn</span>
            </div>
            
            <div className="h-6 w-px bg-slate-200" />
            
            <div className="flex gap-2">
              <button
                onClick={() => handleBatchStatusChange('ACTIVE')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-bold cursor-pointer font-sans"
              >
                <CheckCircle size={14} className="text-emerald-500" />
                <span>Hoạt động</span>
              </button>
              
              <button
                onClick={() => handleBatchStatusChange('MAINTENANCE')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-xs font-bold cursor-pointer font-sans"
              >
                <Wrench size={14} className="text-amber-500" />
                <span>Bảo trì</span>
              </button>
            </div>
            
            <div className="h-6 w-px bg-slate-200" />
            
            <button
              onClick={() => setSelectedSeats([])}
              className="text-xs font-bold text-slate-400 hover:text-slate-650 transition-colors cursor-pointer font-sans"
            >
              Hủy
            </button>
          </div>
        )}

      </div>

      {/* Right Panel: Statistics & Grid Setup */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-150 bg-white p-6 flex flex-col z-10 overflow-y-auto custom-scrollbar">
        
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 pb-3 border-b border-slate-100 font-mono">
          CHI TIẾT SƠ ĐỒ
        </h2>

        {/* Stats Section */}
        <div className="space-y-3.5 mb-8">
          <div className="flex justify-between items-end pb-3 border-b border-slate-100 mb-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng số ghế (Total)</span>
            <span className="text-3xl font-extrabold text-slate-900 font-mono leading-none">{stats.totalPhysical}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-xl border border-slate-150 bg-slate-50 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-350 shadow-sm" />
              <span className="text-xs text-slate-600 font-semibold">Ghế Standard</span>
            </div>
            <span className="font-bold text-slate-800 text-sm font-mono">{stats.standard}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl border border-blue-150 bg-blue-50/50 text-blue-700 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded bg-blue-200 border border-blue-350 shadow-sm" />
              <span className="text-xs text-blue-600 font-semibold">Ghế VIP</span>
            </div>
            <span className="font-bold text-blue-800 text-sm font-mono">{stats.vip}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl border border-red-150 bg-red-50 text-red-700 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-3.5 rounded bg-red-200 border border-red-350 shadow-sm" />
              <span className="text-xs text-red-650 font-semibold">Ghế Đôi</span>
            </div>
            <span className="font-bold text-red-800 text-sm font-mono">{stats.couple}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl border border-amber-150 bg-amber-50/50 text-amber-700 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-350 shadow-sm flex items-center justify-center text-amber-600">
                <Wrench size={8} />
              </div>
              <span className="text-xs text-amber-650 font-semibold">Ghế Bảo trì</span>
            </div>
            <span className="font-bold text-amber-800 text-sm font-mono">{stats.maintenance}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl border border-dashed border-slate-200 bg-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded border border-dashed border-slate-250 bg-transparent" />
              <span className="text-xs text-slate-500 font-semibold">Lối đi / Blocked</span>
            </div>
            <span className="font-bold text-slate-600 text-sm font-mono">{stats.empty}</span>
          </div>

          {sweetSpotMode && (
            <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
                <Wand2 size={12} className="text-amber-600" />
                Bản đồ nhiệt gợi ý
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm border border-amber-300 bg-amber-100" />
                  <span className="text-slate-600 font-medium">VIP Zone (Sweet Spot)</span>
                  <span className="text-amber-700 ml-auto font-bold">&gt;80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm border border-blue-200 bg-blue-100/50" />
                  <span className="text-slate-600 font-medium">Premium</span>
                  <span className="text-blue-600 ml-auto font-bold">55-80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm border border-slate-200 bg-slate-100" />
                  <span className="text-slate-600 font-medium">Standard</span>
                  <span className="text-slate-500 ml-auto font-bold">35-55%</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tỷ lệ lấp đầy (Capacity)</span>
              <span className="text-sm font-bold text-red-655 font-mono">{stats.fillRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all duration-500 rounded-full" 
                style={{ width: `${stats.fillRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Grid Dimensions */}
        <div className="rounded-2xl p-4 mt-auto border border-slate-200 bg-slate-50 shadow-sm">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <Maximize2 size={14} className="text-red-500" />
            CẤU HÌNH LƯỚI
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">SỐ HÀNG NGANG (ROWS)</label>
                <input 
                  type="number" 
                  min={MIN_ROWS} 
                  max={MAX_ROWS}
                  value={rowsInput} 
                  onChange={(e) => {
                    const valStr = e.target.value
                    setRowsInput(valStr)
                    const val = parseInt(valStr, 10)
                    if (!isNaN(val) && val >= MIN_ROWS && val <= MAX_ROWS) {
                      setRows(val)
                    }
                  }}
                  onBlur={() => {
                    setRowsInput(rows.toString())
                  }}
                  className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center text-xs font-bold text-red-650 focus:outline-none focus:border-red-500 font-mono bg-white"
                />
              </div>
              <input 
                type="range" min={MIN_ROWS} max={MAX_ROWS} 
                value={rows} onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">SỐ CỘT (COLS)</label>
                <input 
                  type="number" 
                  min={MIN_COLS} 
                  max={MAX_COLS}
                  value={colsInput} 
                  onChange={(e) => {
                    const valStr = e.target.value
                    setColsInput(valStr)
                    const val = parseInt(valStr, 10)
                    if (!isNaN(val) && val >= MIN_COLS && val <= MAX_COLS) {
                      setCols(val)
                    }
                  }}
                  onBlur={() => {
                    setColsInput(cols.toString())
                  }}
                  className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center text-xs font-bold text-red-650 focus:outline-none focus:border-red-500 font-mono bg-white"
                />
              </div>
              <input 
                type="range" min={MIN_COLS} max={MAX_COLS} 
                value={cols} onChange={(e) => setCols(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>
          
          <div className="mt-4 pt-2">
            <button 
              onClick={onCancel}
              className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer active:scale-[0.98]"
            >
              Thoát cấu hình
            </button>
          </div>
        </div>

      </div>


      {confirmDialog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.45)', 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-left">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">
              {confirmDialog.title}
            </h4>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-750 cursor-pointer shadow-md shadow-red-500/10 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for premium interactive animations */}
      <style>{`
        .canvas-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
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
          background: rgba(30, 41, 59, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.4);
        }
        .screen-curve {
          background: linear-gradient(to bottom, rgba(229, 9, 20, 0.3) 0%, transparent 100%);
          box-shadow: 0 15px 35px rgba(229, 9, 20, 0.15);
          transform: perspective(200px) rotateX(-5deg);
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
      `}</style>
    </div>
    </div>
  )
}
