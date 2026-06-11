import { useState, useEffect } from 'react'
import { bookingService } from '../../../services/bookingService'
import Table from '../../../components/common/Table'
import Badge from '../../../components/common/Badge'

const statusMap = {
  0: { label: 'Chờ lấy vé', variant: 'warning' },
  1: { label: 'Đã xác nhận', variant: 'success' },
  2: { label: 'Đã hủy', variant: 'danger' },
}

export default function TicketManagementPage() {
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { bookingService.getAll().then(r => setBookings(r.data)).catch(() => {}) }, [])

  const filtered = bookings.filter(b =>
    b.bookingId?.includes(search) || b.memberId?.includes(search) || b.phoneNumber?.includes(search)
  )

  const columns = [
    { key: 'bookingId', label: 'Mã đặt vé' },
    { key: 'memberId', label: 'Mã thành viên' },
    { key: 'fullName', label: 'Họ tên' },
    { key: 'movie', label: 'Phim' },
    { key: 'scheduleShowTime', label: 'Giờ chiếu' },
    { key: 'seat', label: 'Ghế' },
    { key: 'status', label: 'Trạng thái', render: r => {
      const s = statusMap[r.status] || statusMap[0]
      return <Badge variant={s.variant}>{s.label}</Badge>
    }},
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 
            className="text-4xl text-white font-bold tracking-wider uppercase" 
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý đặt vé
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Theo dõi, tra cứu lịch sử và quản lý trạng thái đặt vé của khách hàng tại rạp.
          </p>
        </div>
        <input 
          placeholder="Tìm theo mã đặt, mã thành viên, SĐT..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 w-80 transition-colors shadow-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </div>
      <Table columns={columns} data={filtered} />
    </div>
  )
}
