import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { X, CheckCircle, Ticket, Calendar, Clock, DollarSign, User, Hash, Search, Phone, IdCard, Film, Tv, MapPin, Star, Sparkles, Users } from 'lucide-react'
import { motion } from 'motion/react'

const INITIAL_BOOKINGS = [
  {
    id: 'CM-1718556391',
    movie: 'Dune: Hanh Tinh Cat - Phan 2',
    screen: 'Phong chieu 3 (IMAX)',
    date: '17/06/2026',
    time: '18:30',
    seats: 'D4, D5',
    customerName: 'Nguyen Van Anh',
    phone: '0912345678',
    email: 'vananh@gmail.com',
    price: 120000,
    total: 240000,
    convertTickets: 0,
    scoreUsed: 0,
    memberId: 'MEM-889922',
    memberScore: 1500,
    idCard: '012345678901',
    status: 'Da thanh toan',
    checkedIn: false,
    checkInTime: null
  },
  {
    id: 'CM-9988112233',
    movie: 'Lat Mat 7: Mot Dieu Uoc',
    screen: 'Phong chieu 1 (Standard)',
    date: '17/06/2026',
    time: '20:15',
    seats: 'H12, H13, H14',
    customerName: 'Tran Thi Binh',
    phone: '0987654321',
    email: 'thibinh@gmail.com',
    price: 110000,
    total: 330000,
    convertTickets: 2,
    scoreUsed: 2000,
    memberId: 'MEM-445511',
    memberScore: 3500,
    idCard: '023456789012',
    status: 'Da thanh toan',
    checkedIn: false,
    checkInTime: null
  },
  {
    id: 'CM-5566778899',
    movie: 'Inside Out 2: Nhung Manh Ghep Cam Xuc',
    screen: 'Phong chieu 2 (3D)',
    date: '17/06/2026',
    time: '17:00',
    seats: 'C1, C2',
    customerName: 'Le Van Cuong',
    phone: '0933445566',
    email: 'vancuong@gmail.com',
    price: 90000,
    total: 180000,
    convertTickets: 1,
    scoreUsed: 1000,
    memberId: 'MEM-332211',
    memberScore: 500,
    idCard: '034567890123',
    status: 'Da thanh toan',
    checkedIn: true,
    checkInTime: '17/06/2026 - 16:48'
  },
]

const STATUS_META = {
  'Da thanh toan': { label: 'Da thanh toan', bg: 'bg-emerald-500', border: 'border-emerald-700', text: 'text-white' },
  'Cho thanh toan': { label: 'Cho thanh toan', bg: 'bg-amber-500', border: 'border-amber-700', text: 'text-white' },
  'Da huy': { label: 'Da huy', bg: 'bg-rose-500', border: 'border-rose-700', text: 'text-white' },
  'Da xac nhan': { label: 'Da xac nhan', bg: 'bg-sky-500', border: 'border-sky-700', text: 'text-white' },
}
const getStatusMeta = (s) => STATUS_META[s] || { label: s, bg: 'bg-slate-500', border: 'border-slate-700', text: 'text-white' }

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

export default function TicketManagementPage() {
  const location = useLocation()
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [successBanner, setSuccessBanner] = useState(location.state?.successMessage || '')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [convertOption, setConvertOption] = useState('no')
  const [convertTicketsCount, setConvertTicketsCount] = useState(0)

  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const loadBookings = () => {
    const local = localStorage.getItem('staff_bookings_db')
    if (local) {
      const parsed = JSON.parse(local)
      const updated = parsed.map(b => ({
        ...b,
        memberScore: b.memberScore !== undefined ? b.memberScore : (
          b.memberId === 'MEM-889922' ? 1500 :
          b.memberId === 'MEM-445511' ? 3500 :
          b.memberId === 'MEM-332211' ? 500 : 0
        )
      }))
      setBookings(updated)
    } else {
      const initial = INITIAL_BOOKINGS.map(b => ({
        ...b,
        memberScore: b.memberId === 'MEM-889922' ? 1500 :
                     b.memberId === 'MEM-445511' ? 3500 :
                     b.memberId === 'MEM-332211' ? 500 : 0
      }))
      setBookings(initial)
      localStorage.setItem('staff_bookings_db', JSON.stringify(initial))
    }
  }

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking)
    setConvertOption(booking.convertTickets > 0 ? 'yes' : 'no')
    setConvertTicketsCount(booking.convertTickets || 0)
  }

  const handleFinalizeBooking = () => {
    if (!selectedBooking) return
    const scoreUsed = convertOption === 'yes' ? convertTicketsCount * 1000 : 0
    const convertTickets = convertOption === 'yes' ? convertTicketsCount : 0
    if (convertOption === 'yes' && selectedBooking.memberScore < scoreUsed) return

    const local = localStorage.getItem('staff_bookings_db')
    const currentList = local ? JSON.parse(local) : bookings

    const updatedBookings = currentList.map(b => {
      if (b.id === selectedBooking.id) {
        const updatedScore = b.memberScore - scoreUsed
        const singlePrice = b.price || 0
        const discountedTotal = Math.max(0, b.total - (convertTickets * singlePrice))
        return {
          ...b,
          status: 'Da xac nhan',
          convertTickets: convertTickets,
          scoreUsed: scoreUsed,
          memberScore: updatedScore,
          total: discountedTotal
        }
      }
      return b
    })

    setBookings(updatedBookings)
    localStorage.setItem('staff_bookings_db', JSON.stringify(updatedBookings))
    setSelectedBooking(null)
    setSuccessBanner('Xac nhan dat ve thanh cong!')
    setTimeout(() => setSuccessBanner(''), 4000)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings()
  }, [])

  useEffect(() => {
    const handleStorageChange = () => loadBookings()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const filtered = bookings.filter(b =>
    b.id?.toLowerCase().includes(search.toLowerCase()) ||
    b.memberId?.toLowerCase().includes(search.toLowerCase()) ||
    b.phone?.includes(search) ||
    b.idCard?.includes(search) ||
    b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.movie?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="text-left space-y-6">

      {successBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-700 text-emerald-900 text-sm font-bold flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center border-2 border-slate-900">
              <CheckCircle size={16} className="text-white" strokeWidth={3} />
            </div>
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-900 hover:bg-emerald-200 p-1.5 rounded-lg border-2 border-emerald-900 transition-all">
            <X size={14} strokeWidth={3} />
          </button>
        </motion.div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-sky-50 via-violet-50 to-rose-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Ticket size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> BOOKING CENTER
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {bookings.length} ve
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle size={10} strokeWidth={3} /> {bookings.filter(b => b.checkedIn).length} check-in
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly<br /><span className="text-red-600">dat ve</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Xem danh sach dat ve cua khach hang, doi chieu thong tin giao dich va kiem tra trang thai ve.
                </p>
              </div>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_LIST_HERE */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <Users size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-violet-50 gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Danh sach dat ve</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filtered.length} ket qua hien thi</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" strokeWidth={2.5} />
              <input
                placeholder="Tim theo ID, CCCD, SĐT..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-72 pl-10 pr-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-amber-50 transition-all shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] focus:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] focus:translate-x-[2px] focus:translate-y-[2px]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-sky-100 border-b-2 border-slate-900">
                <tr className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-900">
                  <th className="px-4 py-3 text-left">Booking ID</th>
                  <th className="px-4 py-3 text-left">CCCD</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Movie</th>
                  <th className="px-4 py-3 text-left">Showtime</th>
                  <th className="px-4 py-3 text-left">Trang thai</th>
                  <th className="px-4 py-3 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 bg-white">
                {filtered.map(b => {
                  const statusMeta = getStatusMeta(b.status)
                  return (
                    <tr key={b.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md border-2 border-slate-300">
                          {b.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono">
                          <IdCard size={12} className="text-slate-500" strokeWidth={2.5} />
                          {b.idCard}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Phone size={12} className="text-slate-500" strokeWidth={2.5} />
                          {b.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-10 bg-slate-900 rounded flex items-center justify-center shrink-0">
                            <Film size={14} className="text-amber-300" strokeWidth={2.5} />
                          </div>
                          <span className="text-xs font-black text-slate-900 line-clamp-2 max-w-[200px]" title={b.movie}>
                            {b.movie}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-black text-slate-700">
                            <Calendar size={10} strokeWidth={3} className="text-red-600" />
                            <span>{b.date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black text-red-600">
                            <Clock size={10} strokeWidth={3} />
                            <span>{b.time}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase border-2 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                            {statusMeta.label}
                          </span>
                          {b.checkedIn && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 border-2 border-violet-700 text-violet-900 rounded-md text-[9px] font-black uppercase">
                              <CheckCircle size={9} strokeWidth={3} /> Check-in
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSelectBooking(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                        >
                          <CheckCircle size={12} strokeWidth={3} /> Xac nhan
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center">
                <Search size={36} className="text-slate-400" strokeWidth={2} />
              </div>
              <p className="text-base font-black uppercase tracking-wider text-slate-700">Khong tim thay dat ve</p>
              <p className="text-xs font-bold text-slate-500">Hay thu voi tu khoa khac</p>
            </div>
          )}
        </div>
      </div>

      {/* PART_MODAL_HERE */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] max-h-[90vh] flex flex-col"
          >
            <TicketStrip count={18} />
            <div className="bg-gradient-to-br from-violet-50 to-rose-50 px-6 py-5 flex justify-between items-center border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <Ticket size={18} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Chi tiet dat ve</h4>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">{selectedBooking.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-9 h-9 bg-white hover:bg-rose-100 text-slate-900 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto bg-white">
              <div className="bg-amber-50 border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-900 border-2 border-slate-900 rounded-lg flex items-center justify-center shrink-0">
                    <Film size={18} className="text-amber-300" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-base font-black uppercase tracking-wider text-slate-900 leading-tight mb-1">{selectedBooking.movie}</h5>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-700 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Tv size={11} strokeWidth={2.5} className="text-red-600" /> {selectedBooking.screen}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} strokeWidth={2.5} className="text-red-600" /> {selectedBooking.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} strokeWidth={2.5} className="text-red-600" /> {selectedBooking.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50 border-2 border-slate-900 rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User size={11} className="text-sky-700" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">Khach hang</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-tight">{selectedBooking.customerName}</p>
                  <p className="text-[10px] font-bold text-slate-600 mt-0.5">{selectedBooking.email}</p>
                </div>
                <div className="bg-violet-50 border-2 border-slate-900 rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Phone size={11} className="text-violet-700" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-700">Lien lac</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-tight font-mono">{selectedBooking.phone}</p>
                  <p className="text-[10px] font-bold text-slate-600 mt-0.5 font-mono">CCCD: {selectedBooking.idCard}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border-2 border-slate-900 rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin size={11} className="text-emerald-700" strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Ghe da dat</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedBooking.seats?.split(',').map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border-2 border-slate-900 rounded-md text-xs font-black text-slate-900 font-mono shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50 border-2 border-slate-900 rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={11} className="text-rose-700" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Tong thanh toan</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600 line-through">
                      {selectedBooking.price?.toLocaleString('vi-VN')} VND/ghe
                    </p>
                    <p className="text-lg font-black text-red-600">
                      {selectedBooking.total?.toLocaleString('vi-VN')} VND
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white border-2 border-slate-900 rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={11} className="text-amber-300" strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Quy doi diem</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diem hien co</div>
                    <div className="text-lg font-black text-amber-300">{selectedBooking.memberScore || 0}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">So ve quy doi</div>
                    <input
                      type="number"
                      min={0}
                      value={convertTicketsCount}
                      onChange={e => setConvertTicketsCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded text-center py-1 text-sm font-black text-amber-300 focus:outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diem su dung</div>
                    <div className="text-lg font-black text-rose-400">{convertTicketsCount * 1000}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={3} /> Huy
              </button>
              <button
                onClick={handleFinalizeBooking}
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <CheckCircle size={14} strokeWidth={3} /> Xac nhan dat ve
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}