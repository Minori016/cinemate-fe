import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'

const ROWS = ['1','2','3','4','5','6','7','8','9','10']
const COLS_LEFT = ['A','B','C']
const COLS_RIGHT = ['D','E','F']
const VIP_ROWS = ['1','2','3']

export default function SeatSelectionPage() {
  const [params] = useSearchParams()
  const [selected, setSelected] = useState([])
  const navigate = useNavigate()

  const toggleSeat = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const allSeats = ROWS.flatMap(r => [...COLS_LEFT, ...COLS_RIGHT].map(c => ({
    id: `${r}${c}`, row: r, col: c,
    isVip: VIP_ROWS.includes(r) && ['D','E','F'].includes(c),
    isSold: Math.random() < 0.15,
  })))

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl text-white mb-6" style={{fontFamily:'Bebas Neue'}}>Chọn ghế ngồi</h1>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          {ROWS.map(row => (
            <div key={row} className="flex gap-1 items-center">
              {COLS_LEFT.map(col => {
                const seat = allSeats.find(s => s.id === `${row}${col}`)
                const isSelected = selected.includes(seat.id)
                return (
                  <button key={seat.id} disabled={seat.isSold}
                    onClick={() => toggleSeat(seat.id)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                      seat.isSold ? 'bg-gray-700 text-gray-600 cursor-not-allowed' :
                      isSelected ? 'bg-yellow-400 text-black' :
                      seat.isVip ? 'bg-blue-700 text-white hover:bg-blue-600' :
                      'bg-green-700 text-white hover:bg-green-600'
                    }`}>
                    {seat.id}
                  </button>
                )
              })}
              <div className="w-4" />
              {COLS_RIGHT.map(col => {
                const seat = allSeats.find(s => s.id === `${row}${col}`)
                const isSelected = selected.includes(seat.id)
                return (
                  <button key={seat.id} disabled={seat.isSold}
                    onClick={() => toggleSeat(seat.id)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                      seat.isSold ? 'bg-gray-700 text-gray-600 cursor-not-allowed' :
                      isSelected ? 'bg-yellow-400 text-black' :
                      seat.isVip ? 'bg-blue-700 text-white hover:bg-blue-600' :
                      'bg-green-700 text-white hover:bg-green-600'
                    }`}>
                    {seat.id}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="w-2/3 mx-auto h-1.5 bg-[var(--color-text-muted)] rounded mb-2" />
        <p className="text-center text-xs text-[var(--color-text-muted)] mb-4">Màn hình</p>
        <div className="flex justify-center gap-6 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-400 inline-block"/> Đang chọn</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-700 inline-block"/> Đã bán</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-700 inline-block"/> Ghế thường</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-700 inline-block"/> Ghế VIP</span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-[var(--color-text-muted)] text-sm">Đã chọn: <span className="text-white font-semibold">{selected.join(', ') || '—'}</span></p>
        <Button disabled={selected.length === 0} onClick={() => navigate(`/booking/confirm?seats=${selected.join(',')}&${params.toString()}`)}>
          Tiếp tục →
        </Button>
      </div>
    </div>
  )
}
