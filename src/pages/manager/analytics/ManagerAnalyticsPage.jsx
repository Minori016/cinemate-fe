import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Users,
  DollarSign,
  Ticket,
  Percent,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  Download,
  Printer,
  FileSpreadsheet,
  Loader2,
  MapPin
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Mock Analytics Data
const MOCK_TIME_DATA = {
  day: [
    { label: 'Thứ 2', ticket: 1450000, concession: 450000, total: 1900000 },
    { label: 'Thứ 3', ticket: 1850000, concession: 550000, total: 2400000 },
    { label: 'Thứ 4', ticket: 2100000, concession: 680000, total: 2780000 },
    { label: 'Thứ 5', ticket: 2450000, concession: 800000, total: 3250000 },
    { label: 'Thứ 6', ticket: 4100000, concession: 1200000, total: 5300000 },
    { label: 'Thứ 7', ticket: 6500000, concession: 2100000, total: 8600000 },
    { label: 'Chủ Nhật', ticket: 7200000, concession: 2400000, total: 9600000 }
  ],
  week: [
    { label: 'Tuần 1', ticket: 15400000, concession: 4800000, total: 20200000 },
    { label: 'Tuần 2', ticket: 18200000, concession: 5200000, total: 23400000 },
    { label: 'Tuần 3', ticket: 22100000, concession: 6900000, total: 29000000 },
    { label: 'Tuần 4', ticket: 24800000, concession: 8100000, total: 32900000 }
  ],
  month: [
    { label: 'Thg 1', ticket: 62000000, concession: 18000000, total: 80000000 },
    { label: 'Thg 2', ticket: 75000000, concession: 22000000, total: 97000000 },
    { label: 'Thg 3', ticket: 89000000, concession: 26000000, total: 115000000 },
    { label: 'Thg 4', ticket: 92000000, concession: 28000000, total: 120000000 },
    { label: 'Thg 5', ticket: 105000000, concession: 32000000, total: 137000000 },
    { label: 'Thg 6', ticket: 120000000, concession: 38000000, total: 158000000 },
    { label: 'Thg 7', ticket: 115000000, concession: 34000000, total: 149000000 },
    { label: 'Thg 8', ticket: 98000000, concession: 29000000, total: 127000000 },
    { label: 'Thg 9', ticket: 87000000, concession: 25000000, total: 112000000 },
    { label: 'Thg 10', ticket: 94000000, concession: 28000000, total: 122000000 },
    { label: 'Thg 11', ticket: 108000000, concession: 31000000, total: 139000000 },
    { label: 'Thg 12', ticket: 135000000, concession: 42000000, total: 177000000 }
  ],
  quarter: [
    { label: 'Quý 1', ticket: 226000000, concession: 66000000, total: 292000000 },
    { label: 'Quý 2', ticket: 317000000, concession: 98000000, total: 415000000 },
    { label: 'Quý 3', ticket: 285000000, concession: 87000000, total: 372000000 },
    { label: 'Quý 4', ticket: 342000000, concession: 105000000, total: 447000000 }
  ],
  year: [
    { label: '2024', ticket: 980000000, concession: 310000000, total: 1290000000 },
    { label: '2025', ticket: 1150000000, concession: 350000000, total: 1500000000 },
    { label: '2026', ticket: 1270000000, concession: 386000000, total: 1656000000 }
  ]
}

const MOVIE_PERFORMANCE_DATA = [
  { name: 'Lật Mặt 7', revenue: 5600000, tickets: 51 },
  { name: 'Dune: Part 2', revenue: 4200000, tickets: 35 },
  { name: 'Inside Out 2', revenue: 2100000, tickets: 23 },
  { name: 'Furiosa', revenue: 1500000, tickets: 15 }
]

// Mock data cho các chi nhánh
const BRANCH_DATA = [
  {
    id: 'hungvuong',
    name: 'CineMate Hùng Vương Plaza',
    address: '123 Hùng Vương, Quận 5, TP.HCM',
    revenue: 45800000,
    tickets: 420,
    visitors: 850,
    occupancy: 78.5,
    concession: 14500000,
    growth: 12.5
  },
  {
    id: 'nguyentrai',
    name: 'CineMate Nguyễn Trãi',
    address: '456 Nguyễn Trãi, Quận 1, TP.HCM',
    revenue: 38500000,
    tickets: 345,
    visitors: 680,
    occupancy: 68.2,
    concession: 11800000,
    growth: 8.3
  },
  {
    id: 'tranhungdao',
    name: 'CineMate Trần Hưng Đạo',
    address: '789 Trần Hưng Đạo, Quận 1, TP.HCM',
    revenue: 28900000,
    tickets: 265,
    visitors: 520,
    occupancy: 62.4,
    concession: 8900000,
    growth: -2.1
  }
]

const BRANCH_COMPARISON_DATA = [
  { branch: 'Hùng Vương', revenue: 45800000, tickets: 420, concession: 14500000 },
  { branch: 'Nguyễn Trãi', revenue: 38500000, tickets: 345, concession: 11800000 },
  { branch: 'Trần Hưng Đạo', revenue: 28900000, tickets: 265, concession: 8900000 }
]

const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f121d] border border-white/10 p-3.5 rounded-xl shadow-xl text-xs space-y-1 text-left text-white">
        <p className="font-extrabold text-white mb-1">{label}</p>
        <p className="text-[#3b82f6] font-semibold">Doanh thu vé: {formatVND(payload[0].value)}</p>
        <p className="text-[#f59e0b] font-semibold">Doanh thu bắp nước: {formatVND(payload[1].value)}</p>
        <p className="text-white font-black border-t border-white/5 pt-1.5 mt-1">Tổng cộng: {formatVND(payload[2].value)}</p>
      </div>
    )
  }
  return null
}

const CustomTooltipMovie = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f121d] border border-white/10 p-3.5 rounded-xl shadow-xl text-xs space-y-1 text-left text-white">
        <p className="font-extrabold text-white mb-1">{label}</p>
        <p className="text-red-400 font-semibold">Doanh thu: {formatVND(payload[0].value)}</p>
        <p className="text-gray-400">Vé bán ước tính: {payload[0].payload.tickets} vé</p>
      </div>
    )
  }
  return null
}

// Branch Performance Card Component
function BranchCard({ branch, index }) {
  const isTopPerformer = index === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
        index === 0
          ? 'bg-gradient-to-br from-red-600/10 to-red-900/5 border-red-500/30 shadow-md'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTopPerformer ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400'}`}>
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight" style={{ fontFamily: 'Montserrat' }}>
              {branch.name}
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{branch.address}</p>
          </div>
        </div>
        {isTopPerformer && (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-full">
            Top Performer
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Doanh thu</p>
          <p className="text-lg font-black text-white font-mono">{formatVND(branch.revenue)}</p>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-bold ${branch.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {branch.growth >= 0 ? '▲' : '▼'} {Math.abs(branch.growth)}%
            </span>
            <span className="text-[9px] text-gray-500">so tháng trước</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Vé bán</p>
          <p className="text-lg font-black text-white font-mono">{branch.tickets.toLocaleString()}</p>
          <div className="flex items-center gap-1">
            <DollarSign size={12} className="text-red-400" />
            <span className="text-[10px] text-gray-500">avg {(branch.revenue / branch.tickets).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Lượt khách</p>
          <p className="text-lg font-black text-white font-mono">{branch.visitors.toLocaleString()}</p>
          <div className="flex items-center gap-1">
            <Users size={12} className="text-blue-400" />
            <span className="text-[10px] text-gray-500">tổng khách</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tỷ lệ lấp đầy</p>
          <p className={`text-lg font-black font-mono ${branch.occupancy >= 75 ? 'text-green-400' : branch.occupancy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {branch.occupancy}%
          </p>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${branch.occupancy >= 75 ? 'bg-green-500' : branch.occupancy >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${branch.occupancy}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Branch Comparison Chart Component
function BranchComparisonChart({ data }) {
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" horizontal={false} />
          <XAxis
            type="number"
            stroke="#7e8494"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v / 1000000}M`}
          />
          <YAxis
            dataKey="branch"
            type="category"
            stroke="#7e8494"
            fontSize={12}
            width={80}
            tickLine={false}
            tick={{ fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f121d',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '12px'
            }}
            formatter={(value) => [formatVND(value), 'Doanh thu']}
            labelStyle={{ color: '#fff', fontWeight: 700 }}
          />
          <Legend
            iconSize={10}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          <Bar
            dataKey="revenue"
            name="Doanh thu"
            fill="#e50914"
            radius={[0, 8, 8, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ExportModal({ isOpen, onClose, activeFilters, currentGranularity, displayMetrics, chartData, triggerToast }) {
  const [format, setFormat] = useState('excel') // 'excel' or 'pdf'
  const [isExporting, setIsExporting] = useState(false)
  const [exportStep, setExportStep] = useState('')

  if (!isOpen) return null

  const categoryBreakdown = {
    adult: { name: 'Người lớn (Adult)', share: 0.60, ticketPrice: 100000 },
    child: { name: 'Trẻ em (Child)', share: 0.25, ticketPrice: 70000 },
    senior: { name: 'Cao tuổi (Senior)', share: 0.15, ticketPrice: 75000 }
  }

  const getFilterLabels = () => {
    const movieLabel = activeFilters.movie === 'all' ? 'Tất cả phim' : 
                       activeFilters.movie === 'latmat' ? 'Lật Mặt 7: Một Điều Ước' :
                       activeFilters.movie === 'dune' ? 'Dune: Hành Tinh Cát - Phần 2' :
                       activeFilters.movie === 'insideout' ? 'Inside Out 2' : 'Furiosa: Mad Max Saga'

    const dateLabel = activeFilters.date === 'all' ? 'Tất cả ngày' :
                     activeFilters.date === 'today' ? 'Hôm nay' :
                     activeFilters.date === 'yesterday' ? 'Hôm qua' : '7 ngày qua'

    const timeLabel = activeFilters.time === 'all' ? 'Tất cả khung giờ' :
                     activeFilters.time === 'morning' ? 'Sáng (08:00 - 12:00)' :
                     activeFilters.time === 'afternoon' ? 'Chiều (12:00 - 18:00)' : 'Tối (18:00 - 23:00)'

    const locationLabel = activeFilters.location === 'all' ? 'Tất cả chi nhánh' :
                         activeFilters.location === 'hungvuong' ? 'CineMate Hùng Vương Plaza' :
                         activeFilters.location === 'nguyentrai' ? 'CineMate Nguyễn Trãi' : 'CineMate Trần Hưng Đạo'

    return { movieLabel, dateLabel, timeLabel, locationLabel }
  }

  const filterLabels = getFilterLabels()

  const handleExport = () => {
    setIsExporting(true)
    setExportStep('Đang tổng hợp dữ liệu rạp phim...')

    setTimeout(() => {
      setExportStep('Đang kết xuất biểu đồ & phân rã doanh số...')
      setTimeout(() => {
        setExportStep('Đang tạo tệp báo cáo...')
        setTimeout(() => {
          setIsExporting(false)
          onClose()

          if (format === 'excel') {
            generateExcelExport()
          } else {
            generatePdfExport()
          }
        }, 800)
      }, 800)
    }, 700)
  }

  const generateExcelExport = () => {
    const totalTickets = displayMetrics.tickets
    const adultQty = Math.round(totalTickets * categoryBreakdown.adult.share)
    const childQty = Math.round(totalTickets * categoryBreakdown.child.share)
    const seniorQty = totalTickets - (adultQty + childQty)

    const adultRev = adultQty * categoryBreakdown.adult.ticketPrice
    const childRev = childQty * categoryBreakdown.child.ticketPrice
    const seniorRev = seniorQty * categoryBreakdown.senior.ticketPrice
    const computedTicketRev = adultRev + childRev + seniorRev

    const totalRevenue = displayMetrics.revenue
    const concessionRev = Math.max(0, totalRevenue - computedTicketRev)

    let csv = '\uFEFF'
    csv += 'BÁO CÁO DOANH THU & HIỆU SUẤT HOẠT ĐỘNG CINEMATE\n'
    csv += `Ngày kết xuất:;${new Date().toLocaleString('vi-VN')}\n`
    csv += `Chu kỳ biểu đồ:;${currentGranularity.toUpperCase()}\n\n`

    csv += 'BỘ LỌC ĐANG ÁP DỤNG:\n'
    csv += `Phim chiếu:;${filterLabels.movieLabel}\n`
    csv += `Thời gian:;${filterLabels.dateLabel}\n`
    csv += `Khung giờ:;${filterLabels.timeLabel}\n`
    csv += `Chi nhánh Rạp:;${filterLabels.locationLabel}\n\n`

    csv += 'CHỈ SỐ KEY METRICS:\n'
    csv += `Doanh thu tổng cộng;Số lượng vé bán;Số lượng khách;Tỷ lệ lấp đầy phòng\n`
    csv += `"${formatVND(totalRevenue)}";"${totalTickets} vé";"${displayMetrics.visitors} khách";"${displayMetrics.occupancy}%"\n\n`

    csv += 'CHI TIẾT DOANH THU THEO NGUỒN (REVENUE SOURCES):\n'
    csv += `Nguồn doanh thu;Số tiền;Tỷ lệ đóng góp\n`
    csv += `Bán vé phim;"${formatVND(computedTicketRev)}";${((computedTicketRev / totalRevenue) * 100).toFixed(1)}%\n`
    csv += `Bán bắp nước (Concessions);"${formatVND(concessionRev)}";${((concessionRev / totalRevenue) * 100).toFixed(1)}%\n`
    csv += `Tổng cộng;"${formatVND(totalRevenue)}";100%\n\n`

    csv += 'CHI TIẾT VÉ PHIM THEO PHÂN KHÚC KHÁCH HÀNG (AC-03):\n'
    csv += `Hạng vé;Số lượng vé bán;Đơn giá trung bình;Doanh thu ước tính\n`
    csv += `Người lớn (Adult);${adultQty};"${formatVND(categoryBreakdown.adult.ticketPrice)}";"${formatVND(adultRev)}"\n`
    csv += `Trẻ em (Child);${childQty};"${formatVND(categoryBreakdown.child.ticketPrice)}";"${formatVND(childRev)}"\n`
    csv += `Cao tuổi (Senior);${seniorQty};"${formatVND(categoryBreakdown.senior.ticketPrice)}";"${formatVND(seniorRev)}"\n`
    csv += `Tổng cộng;${totalTickets};;"${formatVND(computedTicketRev)}"\n\n`

    csv += `DỮ LIỆU XU HƯỚNG THEO CHU KỲ (${currentGranularity.toUpperCase()}):\n`
    csv += `Thời gian;Doanh thu vé;Doanh thu bắp nước;Tổng doanh thu\n`
    chartData.forEach(item => {
      csv += `${item.label};"${formatVND(item.ticket)}";"${formatVND(item.concession)}";"${formatVND(item.total)}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `CineMate_Report_${currentGranularity}_${activeFilters.movie}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    triggerToast('Đã xuất file báo cáo Excel (.csv) thành công!')
  }

  const generatePdfExport = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      triggerToast('Không thể mở cửa sổ in. Vui lòng tắt trình chặn popup!', 'error')
      return
    }

    const totalTickets = displayMetrics.tickets
    const adultQty = Math.round(totalTickets * categoryBreakdown.adult.share)
    const childQty = Math.round(totalTickets * categoryBreakdown.child.share)
    const seniorQty = totalTickets - (adultQty + childQty)

    const adultRev = adultQty * categoryBreakdown.adult.ticketPrice
    const childRev = childQty * categoryBreakdown.child.ticketPrice
    const seniorRev = seniorQty * categoryBreakdown.senior.ticketPrice
    const ticketRev = adultRev + childRev + seniorRev
    const totalRev = displayMetrics.revenue
    const concessionRev = Math.max(0, totalRev - ticketRev)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CineMate Manager Report - ${currentGranularity.toUpperCase()}</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Outfit', 'sans-serif'],
                  montserrat: ['Montserrat', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          @media print {
            body {
              background-color: #0b0f19 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none;
            }
            .page-break {
              page-break-before: always;
            }
          }
          body {
            background-color: #0b0f19;
            color: #f3f4f6;
          }
        </style>
      </head>
      <body class="p-8 font-sans antialiased text-white">
        <div class="no-print mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
          <div>
            <p class="text-sm font-semibold">Bản in xem trước (Print Preview Dashboard)</p>
            <p class="text-xs text-gray-400">Trang này được tối ưu hóa cho in ấn hoặc xuất PDF từ trình duyệt.</p>
          </div>
          <button onclick="window.print()" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer">
            🖨️ Tiến hành In / Xuất PDF
          </button>
        </div>

        <div class="max-w-5xl mx-auto space-y-8">
          <div class="flex justify-between items-center border-b border-white/10 pb-6">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-3xl">📊</span>
                <div>
                  <h1 class="text-2xl font-black font-montserrat tracking-wider">
                    <span class="text-white">CINE</span><span class="text-red-500">MATE</span>
                  </h1>
                  <p class="text-[10px] tracking-widest text-gray-400 font-bold uppercase">Báo cáo hiệu suất rạp phim</p>
                </div>
              </div>
            </div>
            <div class="text-right text-xs text-gray-400 space-y-1">
              <p>Ngày tạo: <span class="text-white font-semibold">${new Date().toLocaleString('vi-VN')}</span></p>
              <p>Chu kỳ dữ liệu: <span class="text-red-400 font-bold uppercase">${currentGranularity}</span></p>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl text-xs">
            <div>
              <p class="text-gray-400">Phim chiếu:</p>
              <p class="font-bold text-red-300 mt-0.5">${filterLabels.movieLabel}</p>
            </div>
            <div>
              <p class="text-gray-400">Thời gian biểu:</p>
              <p class="font-bold text-red-300 mt-0.5">${filterLabels.dateLabel}</p>
            </div>
            <div>
              <p class="text-gray-400">Khung giờ:</p>
              <p class="font-bold text-red-300 mt-0.5">${filterLabels.timeLabel}</p>
            </div>
            <div>
              <p class="text-gray-400">Chi nhánh:</p>
              <p class="font-bold text-red-300 mt-0.5">${filterLabels.locationLabel}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu tổng cộng</p>
              <p class="text-xl font-extrabold text-white mt-2 font-mono text-red-400">${formatVND(totalRev)}</p>
            </div>
            <div class="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tổng số lượng vé</p>
              <p class="text-xl font-extrabold text-white mt-2 font-mono">${totalTickets} vé</p>
            </div>
            <div class="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lượt khách ghé thăm</p>
              <p class="text-xl font-extrabold text-white mt-2 font-mono">${displayMetrics.visitors} khách</p>
            </div>
            <div class="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tỷ lệ lấp đầy rạp</p>
              <p class="text-xl font-extrabold text-white mt-2 font-mono text-yellow-500">${displayMetrics.occupancy}%</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
              <h3 class="text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-3 font-montserrat">
                📊 Phân Rã Cơ Cấu Doanh Thu
              </h3>
              
              <div class="space-y-4">
                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span>Doanh thu vé phim</span>
                    <span class="text-red-400">${formatVND(ticketRev)} (${((ticketRev / totalRev) * 100).toFixed(1)}%)</span>
                  </div>
                  <div class="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-red-500 rounded-full" style="width: ${((ticketRev / totalRev) * 100)}%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span>Doanh thu dịch vụ (Concessions)</span>
                    <span class="text-yellow-500">${formatVND(concessionRev)} (${((concessionRev / totalRev) * 100).toFixed(1)}%)</span>
                  </div>
                  <div class="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-500 rounded-full" style="width: ${((concessionRev / totalRev) * 100)}%"></div>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-white/5 space-y-4">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Chi tiết theo phân khúc vé:</p>
                
                <div class="space-y-3 text-xs">
                  <div>
                    <div class="flex justify-between text-gray-300 font-medium mb-1">
                      <span>Người lớn (60%):</span>
                      <span>${adultQty} vé - ${formatVND(adultRev)}</span>
                    </div>
                    <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500" style="width: 60%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-gray-300 font-medium mb-1">
                      <span>Trẻ em (25%):</span>
                      <span>${childQty} vé - ${formatVND(childRev)}</span>
                    </div>
                    <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500" style="width: 25%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-gray-300 font-medium mb-1">
                      <span>Cao tuổi (15%):</span>
                      <span>${seniorQty} vé - ${formatVND(seniorRev)}</span>
                    </div>
                    <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div class="h-full bg-pink-500" style="width: 15%"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
              <h3 class="text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-3 font-montserrat">
                📈 Xu Hướng Doanh Số (${currentGranularity.toUpperCase()})
              </h3>

              <div class="flex flex-col gap-4">
                ${chartData.map(item => {
                  const maxTotal = Math.max(...chartData.map(d => d.total))
                  const percentage = maxTotal > 0 ? (item.total / maxTotal * 100).toFixed(0) : 0
                  return `
                    <div class="text-xs space-y-1">
                      <div class="flex justify-between font-semibold">
                        <span class="text-gray-300">${item.label}</span>
                        <span>${formatVND(item.total)}</span>
                      </div>
                      <div class="w-full h-4 bg-white/5 rounded-md overflow-hidden flex text-white font-mono text-[9px] text-center">
                        <div class="h-full bg-blue-500" style="width: ${(item.ticket / item.total * percentage)}%"></div>
                        <div class="h-full bg-yellow-500" style="width: ${(item.concession / item.total * percentage)}%"></div>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>

              <div class="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-wider pt-2">
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-blue-500 rounded"></span>Doanh thu Vé</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-yellow-500 rounded"></span>Doanh thu Bắp nước</span>
              </div>
            </div>
          </div>

          <div class="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider font-montserrat">
              📋 Chi Tiết Chỉ Số Chu Kỳ Báo Cáo
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-white/10 text-gray-400 font-bold">
                    <th class="py-2">Mốc chu kỳ</th>
                    <th class="py-2">Doanh thu vé</th>
                    <th class="py-2">Doanh thu bắp nước</th>
                    <th class="py-2 text-right">Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  ${chartData.map(item => `
                    <tr>
                      <td class="py-3 font-semibold text-white">${item.label}</td>
                      <td class="py-3 font-mono">${formatVND(item.ticket)}</td>
                      <td class="py-3 font-mono">${formatVND(item.concession)}</td>
                      <td class="py-3 font-mono font-bold text-right text-red-300">${formatVND(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="text-center text-[10px] text-gray-500 pt-8 border-t border-white/5">
            <p>© ${new Date().getFullYear()} CineMate. Tài liệu nội bộ rạp chiếu phim. Bảo mật cấp độ quản lý.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
    triggerToast('Đã mở bản in xem trước PDF thành công!')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f121d] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in flex flex-col text-left">
        
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📥</span>
            <h4 className="font-extrabold uppercase tracking-wider text-sm text-white" style={{ fontFamily: 'Montserrat' }}>
              Xuất báo cáo doanh thu & dữ liệu
            </h4>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isExporting ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
              <p className="text-sm font-bold text-white transition-all duration-300">{exportStep}</p>
              <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-2xl space-y-2.5">
                <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Bộ lọc báo cáo đang áp dụng (AC-03)</p>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-gray-300">
                  <p>● Phim: <strong className="text-white">{filterLabels.movieLabel}</strong></p>
                  <p>● Thời gian: <strong className="text-white">{filterLabels.dateLabel}</strong></p>
                  <p>● Khung giờ: <strong className="text-white">{filterLabels.timeLabel}</strong></p>
                  <p>● Chi nhánh: <strong className="text-white">{filterLabels.locationLabel}</strong></p>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Định dạng file xuất (AC-01)</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormat('excel')}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                      format === 'excel'
                        ? 'bg-red-600/10 border-red-500 text-red-400 shadow-md'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <FileSpreadsheet size={28} />
                    <span className="text-xs font-bold">Excel (.csv)</span>
                    <span className="text-[9px] text-gray-400">Thống kê chi tiết & bảng tính</span>
                  </button>

                  <button
                    onClick={() => setFormat('pdf')}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                      format === 'pdf'
                        ? 'bg-red-600/10 border-red-500 text-red-400 shadow-md'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Printer size={28} />
                    <span className="text-xs font-bold">PDF / Print Layout</span>
                    <span className="text-[9px] text-gray-400">Giữ nguyên định dạng trực quan (AC-02)</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cấu trúc phân rã báo cáo mặc định</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-gray-400">Hạng mục vé (Ticket Type):</p>
                    <p className="font-semibold text-white">Người lớn (60%), Trẻ em (25%), Cao tuổi (15%)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400">Cơ cấu doanh thu (Sources):</p>
                    <p className="font-semibold text-white">Vé xem phim (70%), Bắp nước (30%)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-white/5 transition-all cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 py-3.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-[rgba(229,9,20,0.25)] transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Download size={14} /> Xác nhận xuất file
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ManagerAnalyticsPage() {
  const [toast, setToast] = useState(null)
  
  // Granularity & Filter States
  const [timeGranularity, setTimeGranularity] = useState('day') // 'day', 'week', 'month', 'quarter', 'year'
  const [filterMovie, setFilterMovie] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [filterTime, setFilterTime] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Real-time auto-refresh states (5 minutes = 300 seconds)
  const [timeLeft, setTimeLeft] = useState(300)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [realtimeSales, setRealtimeSales] = useState({ tickets: 0, revenue: 0 })

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleForceRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const newTickets = Math.floor(Math.random() * 3) + 1
      const newRevenue = newTickets * 110000
      setRealtimeSales(prev => ({
        tickets: prev.tickets + newTickets,
        revenue: prev.revenue + newRevenue
      }))
      setTimeLeft(300)
      setIsRefreshing(false)
      triggerToast(`[Thời gian thực] Phát hiện giao dịch mới tại CineMate! +${newTickets} vé vừa bán ra!`, 'success')
    }, 800)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const newTickets = Math.floor(Math.random() * 2) + 1
          const newRevenue = newTickets * 110000
          setRealtimeSales(p => ({
            tickets: p.tickets + newTickets,
            revenue: p.revenue + newRevenue
          }))
          triggerToast(`[Thời gian thực] Dữ liệu tự động cập nhật! (+${newTickets} vé mới)`, 'success')
          return 300
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getScale = () => {
    let scale = 1.0
    if (filterMovie !== 'all') {
      const movieScales = { latmat: 0.45, dune: 0.35, insideout: 0.15, furiosa: 0.05 }
      scale *= (movieScales[filterMovie] || 1.0)
    }
    if (filterDate !== 'all') {
      const dateScales = { today: 0.15, yesterday: 0.12, last7days: 0.85 }
      scale *= (dateScales[filterDate] || 1.0)
    }
    if (filterTime !== 'all') {
      const timeScales = { morning: 0.25, afternoon: 0.4, evening: 0.65 }
      scale *= (timeScales[filterTime] || 1.0)
    }
    if (filterLocation !== 'all') {
      const locationScales = { hungvuong: 0.45, nguyentrai: 0.35, tranhungdao: 0.2 }
      scale *= (locationScales[filterLocation] || 1.0)
    }
    return Math.max(scale, 0.02)
  }

  const scale = getScale()
  const displayRevenue = Math.round(75800000 * scale) + realtimeSales.revenue
  const displayTickets = Math.round(920 * scale) + realtimeSales.tickets
  const displayVisitors = Math.round(1480 * scale) + Math.round(realtimeSales.tickets * 1.3)

  let displayOccupancy = 74.5
  if (filterTime === 'morning') displayOccupancy = 42.8
  else if (filterTime === 'afternoon') displayOccupancy = 68.2
  else if (filterTime === 'evening') displayOccupancy = 88.5
  
  if (filterLocation === 'hungvuong') displayOccupancy += 4.5
  if (filterLocation === 'tranhungdao') displayOccupancy -= 8.2
  
  if (filterMovie === 'latmat') displayOccupancy = 85.4
  else if (filterMovie === 'furiosa') displayOccupancy = 35.6
  
  const finalOccupancy = Math.min(Math.max(displayOccupancy, 12.5), 98.4).toFixed(1)

  const rawChartData = MOCK_TIME_DATA[timeGranularity] || MOCK_TIME_DATA.day
  const chartData = rawChartData.map((item) => ({
    label: item.label,
    ticket: Math.round(item.ticket * scale),
    concession: Math.round(item.concession * scale),
    total: Math.round(item.total * scale)
  }))

  // Filter branches based on filterLocation
  const filteredBranches = filterLocation === 'all'
    ? BRANCH_DATA
    : BRANCH_DATA.filter(b => b.id === filterLocation)

  const filteredBranchComparison = BRANCH_COMPARISON_DATA.filter(b => {
    if (filterLocation === 'all') return true
    const branchIdMap = { hungvuong: 'Hùng Vương', nguyentrai: 'Nguyễn Trãi', tranhungdao: 'Trần Hưng Đạo' }
    return b.branch === branchIdMap[filterLocation]
  })

  const formatTimeCountdown = (secs) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      className="space-y-8 text-left"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(229,9,20,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(229,9,20,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#e50914' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="shrink-0" size={20} />
          ) : (
            <AlertCircle className="shrink-0" size={20} />
          )}
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase text-red-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Báo cáo doanh thu & Thống kê
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Báo cáo dữ liệu kinh doanh rạp phim, doanh số bán vé và tình hình quầy bắp nước theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto shrink-0 select-none">
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
              Đang trực tuyến (Online)
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Cập nhật tự động sau: <strong className="font-mono text-white text-xs">{formatTimeCountdown(timeLeft)}</strong>
            </span>
          </div>

          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer border-none outline-none"
            title="Làm mới ngay dữ liệu"
          >
            <Clock className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
        <h4 className="text-xs uppercase font-extrabold text-white tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-red-500">filter_alt</span>
          Bộ lọc thống kê nâng cao (Advanced Filters)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Phim chiếu</label>
            <select
              value={filterMovie}
              onChange={(e) => setFilterMovie(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả phim</option>
              <option value="latmat">Lật Mặt 7: Một Điều Ước</option>
              <option value="dune">Dune: Hành Tinh Cát - Phần 2</option>
              <option value="insideout">Inside Out 2</option>
              <option value="furiosa">Furiosa: Mad Max Saga</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Thời gian</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả ngày</option>
              <option value="today">Hôm nay (Today)</option>
              <option value="yesterday">Hôm qua (Yesterday)</option>
              <option value="last7days">7 ngày qua</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Khung giờ chiếu</label>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả khung giờ</option>
              <option value="morning">Ca Sáng (08:00 - 12:00)</option>
              <option value="afternoon">Ca Chiều (12:00 - 18:00)</option>
              <option value="evening">Ca Tối (18:00 - 23:00)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Chi nhánh Rạp</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả chi nhánh</option>
              <option value="hungvuong">CineMate Hùng Vương Plaza</option>
              <option value="nguyentrai">CineMate Nguyễn Trãi</option>
              <option value="tranhungdao">CineMate Trần Hưng Đạo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Doanh thu bán vé</p>
            <span className="p-2 rounded-lg bg-red-600/10 text-red-400 border border-red-500/10">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{formatVND(displayRevenue)}</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +14.2% <span className="text-[var(--color-text-muted)] font-normal">so với chu kỳ trước</span>
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tổng số lượng vé</p>
            <span className="p-2 rounded-lg bg-red-600/10 text-red-400 border border-red-500/10">
              <Ticket size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{displayTickets} vé</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +8.7% <span className="text-[var(--color-text-muted)] font-normal">so với chu kỳ trước</span>
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Số lượng lượt khách</p>
            <span className="p-2 rounded-lg bg-red-600/10 text-red-400 border border-red-500/10">
              <Users size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{displayVisitors} khách</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +12.3% <span className="text-[var(--color-text-muted)] font-normal">doanh số combo</span>
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tỷ lệ lấp đầy</p>
            <span className="p-2 rounded-lg bg-red-600/10 text-red-400 border border-red-500/10">
              <Percent size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{finalOccupancy}%</p>
          <span className="text-[10px] text-yellow-500 font-bold mt-1.5 flex items-center gap-1">
            ● Ổn định <span className="text-[var(--color-text-muted)] font-normal">hiệu suất phòng</span>
          </span>
        </div>
      </div>

      {/* Branch Revenue Section */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight uppercase text-white" style={{ fontFamily: 'Montserrat' }}>
              📍 Doanh Thu Theo Chi Nhánh
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              So sánh hiệu suất kinh doanh giữa các rạp chiếu phim trong hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setExportModalOpen(true)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Download size={14} />
              Xuất báo cáo chi nhánh
            </button>
          </div>
        </div>

        {/* Branch Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch, index) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              index={index}
            />
          ))}
        </div>

        {/* Branch Comparison Chart */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat' }}>
                📊 So Sánh Doanh Thu Chi Nhánh
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Biểu đồ cột so sánh tổng doanh thu giữa các chi nhánh.</p>
            </div>
          </div>

          <BranchComparisonChart data={filteredBranchComparison} />
        </div>
      </div>

      {/* Graphs Section */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300 ${isRefreshing ? 'blur-[1px] opacity-75' : ''}`}>
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat' }}>
                📈 Xu Hướng Doanh Thu Phân Tích
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Biểu đồ biểu diễn tổng doanh số bao gồm vé và dịch vụ đi kèm.</p>
            </div>

            <div className="flex bg-[#121414] p-1 rounded-xl border border-white/5 self-start sm:self-auto shrink-0 select-none">
              <button
                onClick={() => setTimeGranularity('day')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'day' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Ngày
              </button>
              <button
                onClick={() => setTimeGranularity('week')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'week' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setTimeGranularity('month')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'month' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Tháng
              </button>
              <button
                onClick={() => setTimeGranularity('quarter')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'quarter' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Quý
              </button>
              <button
                onClick={() => setTimeGranularity('year')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'year' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Năm
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e50914" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e50914" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                <XAxis dataKey="label" stroke="#7e8494" fontSize={11} tickLine={false} />
                <YAxis stroke="#7e8494" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ticket" name="Doanh thu vé" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="concession" name="Doanh thu bắp nước" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="total" name="Tổng doanh số" stroke="#e50914" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat' }}>
            🎬 Xếp Hạng Doanh Thu Theo Phim
          </h3>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={MOVIE_PERFORMANCE_DATA} margin={{ top: 10, right: 5, left: 5, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" horizontal={false} />
                <XAxis type="number" stroke="#7e8494" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <YAxis dataKey="name" type="category" stroke="#7e8494" fontSize={11} width={80} tickLine={false} />
                <Tooltip content={<CustomTooltipMovie />} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#e50914" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        activeFilters={{
          movie: filterMovie,
          date: filterDate,
          time: filterTime,
          location: filterLocation
        }}
        currentGranularity={timeGranularity}
        displayMetrics={{
          revenue: displayRevenue,
          tickets: displayTickets,
          visitors: displayVisitors,
          occupancy: finalOccupancy
        }}
        chartData={chartData}
        triggerToast={triggerToast}
      />
    </motion.div>
  )
}
