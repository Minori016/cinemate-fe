import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Users,
  Plus,
  DollarSign,
  Ticket,
  Percent,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  UserCheck,
  Download,
  Printer,
  FileSpreadsheet,
  Loader2
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

// Mock Movie List for Scheduler Form
const AVAILABLE_MOVIES = [
  'Lật Mặt 7: Một Điều Ước',
  'Dune: Hành Tinh Cát - Phần 2',
  'Inside Out 2: Những Mảnh Ghép Cảm Xúc',
  'Furiosa: Mad Max Saga'
]

const AVAILABLE_ROOMS = [
  'Phòng chiếu 1 (Standard)',
  'Phòng chiếu 2 (3D)',
  'Phòng chiếu 3 (IMAX)',
  'Phòng chiếu 4 (Dolby Atmos)'
]

// Seed Showtime Data
const INITIAL_SHOWTIMES = [
  { id: 101, movie: 'Dune: Hành Tinh Cát - Phần 2', room: 'Phòng chiếu 3 (IMAX)', date: '2026-06-18', time: '18:30', price: 120000 },
  { id: 102, movie: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc', room: 'Phòng chiếu 2 (3D)', date: '2026-06-18', time: '17:00', price: 90000 },
  { id: 103, movie: 'Lật Mặt 7: Một Điều Ước', room: 'Phòng chiếu 1 (Standard)', date: '2026-06-18', time: '20:15', price: 110000 }
]

// Seed Shift Staff Data
const INITIAL_SHIFTS = [
  { id: 201, name: 'Nguyễn Văn Hùng', role: 'Nhân viên soát vé', shift: 'Sáng (08:00 - 14:00)', room: 'Phòng chiếu 3 (IMAX)', status: 'Đã ra ca' },
  { id: 202, name: 'Trần Minh Tâm', role: 'Nhân viên bán vé', shift: 'Chiều (14:00 - 20:00)', room: 'Quầy bán vé trung tâm', status: 'Trực ca' },
  { id: 203, name: 'Lê Thị Hồng', role: 'Nhân viên soát vé', shift: 'Tối (18:00 - 23:00)', room: 'Phòng chiếu 1 (Standard)', status: 'Trực ca' },
  { id: 204, name: 'Phạm Quốc Bảo', role: 'Nhân viên bắp nước', shift: 'Tối (18:00 - 23:00)', room: 'Quầy bắp nước số 2', status: 'Vắng mặt' }
]

// Helper function for VND currency formatting
const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

// Custom tooltips for graphs
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
        <p className="text-purple-400 font-semibold">Doanh thu: {formatVND(payload[0].value)}</p>
        <p className="text-gray-400">Vé bán ước tính: {payload[0].payload.tickets} vé</p>
      </div>
    )
  }
  return null
}

function ExportModal({ isOpen, onClose, activeFilters, currentGranularity, displayMetrics, chartData, triggerToast }) {
  const [format, setFormat] = useState('excel') // 'excel' or 'pdf'
  const [isExporting, setIsExporting] = useState(false)
  const [exportStep, setExportStep] = useState('')

  if (!isOpen) return null

  // Detailed breakdowns for ticket sales by category (AC-03)
  const categoryBreakdown = {
    adult: { name: 'Người lớn (Adult)', share: 0.60, ticketPrice: 100000 },
    child: { name: 'Trẻ em (Child)', share: 0.25, ticketPrice: 70000 },
    senior: { name: 'Cao tuổi (Senior)', share: 0.15, ticketPrice: 75000 }
  }

  // Active filters label resolution
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
    // Computes ticket sales breakdown
    const totalTickets = displayMetrics.tickets
    const adultQty = Math.round(totalTickets * categoryBreakdown.adult.share)
    const childQty = Math.round(totalTickets * categoryBreakdown.child.share)
    const seniorQty = totalTickets - (adultQty + childQty)

    const adultRev = adultQty * categoryBreakdown.adult.ticketPrice
    const childRev = childQty * categoryBreakdown.child.ticketPrice
    const seniorRev = seniorQty * categoryBreakdown.senior.ticketPrice
    const computedTicketRev = adultRev + childRev + seniorRev

    // Overall Revenue matches dashboard display, and concessions is the difference
    const totalRevenue = displayMetrics.revenue
    const concessionRev = Math.max(0, totalRevenue - computedTicketRev)

    // Construct CSV content (using BOM \uFEFF for proper Excel display in Vietnamese)
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
    // Open a new printable tab window styled beautifully to match dashboard aesthetics
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

    // Build the visual dashboard template for print
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
        <!-- Control Bar for user convenience before/during print -->
        <div class="no-print mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
          <div>
            <p class="text-sm font-semibold">Bản in xem trước (Print Preview Dashboard)</p>
            <p class="text-xs text-gray-400">Trang này được tối ưu hóa cho in ấn hoặc xuất PDF từ trình duyệt.</p>
          </div>
          <button onclick="window.print()" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer">
            🖨️ Tiến hành In / Xuất PDF
          </button>
        </div>

        <div class="max-w-5xl mx-auto space-y-8">
          <!-- Report Header -->
          <div class="flex justify-between items-center border-b border-white/10 pb-6">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-3xl">📊</span>
                <div>
                  <h1 class="text-2xl font-black font-montserrat tracking-wider">
                    <span class="text-white">CINE</span><span class="text-purple-500">MATE</span>
                  </h1>
                  <p class="text-[10px] tracking-widest text-gray-400 font-bold uppercase">Báo cáo hiệu suất rạp phim</p>
                </div>
              </div>
            </div>
            <div class="text-right text-xs text-gray-400 space-y-1">
              <p>Ngày tạo: <span class="text-white font-semibold">${new Date().toLocaleString('vi-VN')}</span></p>
              <p>Chu kỳ dữ liệu: <span class="text-purple-400 font-bold uppercase">${currentGranularity}</span></p>
            </div>
          </div>

          <!-- Active Filters Info -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl text-xs">
            <div>
              <p class="text-gray-400">Phim chiếu:</p>
              <p class="font-bold text-purple-300 mt-0.5">${filterLabels.movieLabel}</p>
            </div>
            <div>
              <p class="text-gray-400">Thời gian biểu:</p>
              <p class="font-bold text-purple-300 mt-0.5">${filterLabels.dateLabel}</p>
            </div>
            <div>
              <p class="text-gray-400">Khung giờ:</p>
              <p class="font-bold text-purple-300 mt-0.5">${filterLabels.timeLabel}</p>
            </div>
            <div>
              <p class="text-gray-400">Chi nhánh:</p>
              <p class="font-bold text-purple-300 mt-0.5">${filterLabels.locationLabel}</p>
            </div>
          </div>

          <!-- KPI Cards Grid (Matching Dashboard Aesthetics) -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu tổng cộng</p>
              <p class="text-xl font-extrabold text-white mt-2 font-mono text-purple-400">${formatVND(totalRev)}</p>
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

          <!-- Two Column Visual Sections (AC-02 Formatting Preservation) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left: Revenue Category Breakdowns (AC-03) -->
            <div class="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
              <h3 class="text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-3 font-montserrat">
                📊 Phân Rã Cơ Cấu Doanh Thu
              </h3>
              
              <!-- Source Shares -->
              <div class="space-y-4">
                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span>Doanh thu vé phim</span>
                    <span class="text-purple-400">${formatVND(ticketRev)} (${((ticketRev / totalRev) * 100).toFixed(1)}%)</span>
                  </div>
                  <div class="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-purple-500 rounded-full" style="width: ${((ticketRev / totalRev) * 100)}%"></div>
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

              <!-- Ticket Category Shares -->
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

            <!-- Right: Trend Visualization Represented by CSS Bar-Graph -->
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

          <!-- Tabular Data Representation -->
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
                      <td class="py-3 font-mono font-bold text-right text-purple-300">${formatVND(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Report Footer -->
          <div class="text-center text-[10px] text-gray-500 pt-8 border-t border-white/5">
            <p>© ${new Date().getFullYear()} CineMate. Tài liệu nội bộ rạp chiếu phim. Bảo mật cấp độ quản lý.</p>
          </div>
        </div>

        <script>
          // Auto trigger print when page opens
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
        
        {/* Header */}
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

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {isExporting ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-sm font-bold text-white transition-all duration-300">{exportStep}</p>
              <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          ) : (
            <>
              {/* Active Filters Display */}
              <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-2xl space-y-2.5">
                <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Bộ lọc báo cáo đang áp dụng (AC-03)</p>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-gray-300">
                  <p>● Phim: <strong className="text-white">{filterLabels.movieLabel}</strong></p>
                  <p>● Thời gian: <strong className="text-white">{filterLabels.dateLabel}</strong></p>
                  <p>● Khung giờ: <strong className="text-white">{filterLabels.timeLabel}</strong></p>
                  <p>● Chi nhánh: <strong className="text-white">{filterLabels.locationLabel}</strong></p>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Định dạng file xuất (AC-01)</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormat('excel')}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                      format === 'excel'
                        ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-md'
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
                        ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-md'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Printer size={28} />
                    <span className="text-xs font-bold">PDF / Print Layout</span>
                    <span className="text-[9px] text-gray-400">Giữ nguyên định dạng trực quan (AC-02)</span>
                  </button>
                </div>
              </div>

              {/* Breakdown Preview (AC-03 requirement detail visibility) */}
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

              {/* Submit Buttons */}
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
                  className="flex-1 py-3.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-[rgba(147,51,234,0.25)] transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
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

export default function ManagerDashboardPage() {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'analytics'

  const [toast, setToast] = useState(null)

  // Local database states persisted
  const [showtimes, setShowtimes] = useState(() => {
    const saved = localStorage.getItem('manager_showtimes_db')
    return saved ? JSON.parse(saved) : INITIAL_SHOWTIMES
  })

  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem('manager_shifts_db')
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS
  })

  useEffect(() => {
    localStorage.setItem('manager_showtimes_db', JSON.stringify(showtimes))
  }, [showtimes])

  useEffect(() => {
    localStorage.setItem('manager_shifts_db', JSON.stringify(shifts))
  }, [shifts])

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up`}
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(147,51,234,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(147,51,234,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#a855f7' : '#ef4444',
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

      {/* Analytics tab */}
      {activeTab === 'analytics' && <AnalyticsSection triggerToast={triggerToast} />}

      {/* Showtime manager tab */}
      {activeTab === 'showtimes' && (
        <ShowtimeSection
          showtimes={showtimes}
          setShowtimes={setShowtimes}
          triggerToast={triggerToast}
        />
      )}

      {/* Shift staff tab */}
      {activeTab === 'shifts' && (
        <ShiftSection
          shifts={shifts}
          setShifts={setShifts}
          triggerToast={triggerToast}
        />
      )}
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: MANAGER OVERVIEW & ANALYTICS (RECHARTS)
// ──────────────────────────────────────────────────────────────────────────
function AnalyticsSection({ triggerToast }) {
  // Granularity & Filter States
  const [timeGranularity, setTimeGranularity] = useState('day') // 'day', 'week', 'month', 'quarter', 'year'
  const [filterMovie, setFilterMovie] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [filterTime, setFilterTime] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Real-time auto-refresh states (5 minutes = 300 seconds) (AC-03)
  const [timeLeft, setTimeLeft] = useState(300)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [realtimeSales, setRealtimeSales] = useState({ tickets: 0, revenue: 0 })

  const handleForceRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      // Simulate real-time purchases arriving
      const newTickets = Math.floor(Math.random() * 3) + 1
      const newRevenue = newTickets * 110000
      setRealtimeSales(prev => ({
        tickets: prev.tickets + newTickets,
        revenue: prev.revenue + newRevenue
      }))
      setTimeLeft(300)
      setIsRefreshing(false)
      if (triggerToast) {
        triggerToast(`[Thời gian thực] Phát hiện giao dịch mới tại CineMate! +${newTickets} vé vừa bán ra!`, 'success')
      }
    }, 800)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Trigger automatic refresh
          const newTickets = Math.floor(Math.random() * 2) + 1
          const newRevenue = newTickets * 110000
          setRealtimeSales(p => ({
            tickets: p.tickets + newTickets,
            revenue: p.revenue + newRevenue
          }))
          if (triggerToast) {
            triggerToast(`[Thời gian thực] Dữ liệu tự động cập nhật! (+${newTickets} vé mới)`, 'success')
          }
          return 300
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [triggerToast])

  // Compute scale multiplier based on selected filters (AC-02)
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
    return Math.max(scale, 0.02) // ensure we don't scale to zero
  }

  const scale = getScale()
  const displayRevenue = Math.round(75800000 * scale) + realtimeSales.revenue
  const displayTickets = Math.round(920 * scale) + realtimeSales.tickets
  const displayVisitors = Math.round(1480 * scale) + Math.round(realtimeSales.tickets * 1.3)

  // Occupancy rate details adjusted based on filters
  let displayOccupancy = 74.5
  if (filterTime === 'morning') displayOccupancy = 42.8
  else if (filterTime === 'afternoon') displayOccupancy = 68.2
  else if (filterTime === 'evening') displayOccupancy = 88.5
  
  if (filterLocation === 'hungvuong') displayOccupancy += 4.5
  if (filterLocation === 'tranhungdao') displayOccupancy -= 8.2
  
  if (filterMovie === 'latmat') displayOccupancy = 85.4
  else if (filterMovie === 'furiosa') displayOccupancy = 35.6
  
  const finalOccupancy = Math.min(Math.max(displayOccupancy, 12.5), 98.4).toFixed(1)

  // Prepare scale-adapted time trend data (AC-02)
  const rawChartData = MOCK_TIME_DATA[timeGranularity] || MOCK_TIME_DATA.day
  const chartData = rawChartData.map((item) => ({
    label: item.label,
    ticket: Math.round(item.ticket * scale),
    concession: Math.round(item.concession * scale),
    total: Math.round(item.total * scale)
  }))

  // Formatter for countdown
  const formatTimeCountdown = (secs) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-8">
      {/* Header with real-time countdown banner (AC-03) */}
      <motion.div
        className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl text-left"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase text-purple-400" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
            className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer border-none outline-none"
            title="Làm mới ngay dữ liệu"
          >
            <Clock className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </motion.div>

      {/* Filter Control Bar (AC-02) */}
      <motion.div
        className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg text-left"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
      >
        <h4 className="text-xs uppercase font-extrabold text-white tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-purple-400">filter_alt</span>
          Bộ lọc thống kê nâng cao (Advanced Filters)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Movie Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Phim chiếu</label>
            <select
              value={filterMovie}
              onChange={(e) => setFilterMovie(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-purple-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả phim</option>
              <option value="latmat">Lật Mặt 7: Một Điều Ước</option>
              <option value="dune">Dune: Hành Tinh Cát - Phần 2</option>
              <option value="insideout">Inside Out 2</option>
              <option value="furiosa">Furiosa: Mad Max Saga</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Thời gian</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-purple-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả ngày</option>
              <option value="today">Hôm nay (Today)</option>
              <option value="yesterday">Hôm qua (Yesterday)</option>
              <option value="last7days">7 ngày qua</option>
            </select>
          </div>

          {/* Time Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Khung giờ chiếu</label>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-purple-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả khung giờ</option>
              <option value="morning">Ca Sáng (08:00 - 12:00)</option>
              <option value="afternoon">Ca Chiều (12:00 - 18:00)</option>
              <option value="evening">Ca Tối (18:00 - 23:00)</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Chi nhánh Rạp</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-purple-500 cursor-pointer font-medium"
            >
              <option value="all">Tất cả chi nhánh</option>
              <option value="hungvuong">CineMate Hùng Vương Plaza</option>
              <option value="nguyentrai">CineMate Nguyễn Trãi</option>
              <option value="tranhungdao">CineMate Trần Hưng Đạo</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Metrics Row (AC-02) */}
      <motion.div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.15
            }
          }
        }}
      >
        {/* Metric 1: Revenue */}
        <motion.div
          className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md text-left"
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
          }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Doanh thu bán vé</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{formatVND(displayRevenue)}</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +14.2% <span className="text-[var(--color-text-muted)] font-normal">so với chu kỳ trước</span>
          </span>
        </motion.div>

        {/* Metric 2: Ticket Sales */}
        <motion.div
          className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md text-left"
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
          }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tổng số lượng vé</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <Ticket size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{displayTickets} vé</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +8.7% <span className="text-[var(--color-text-muted)] font-normal">so với chu kỳ trước</span>
          </span>
        </motion.div>

        {/* Metric 3: Visitors */}
        <motion.div
          className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md text-left"
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
          }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Số lượng lượt khách</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <Users size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{displayVisitors} khách</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +12.3% <span className="text-[var(--color-text-muted)] font-normal">doanh số combo</span>
          </span>
        </motion.div>

        {/* Metric 4: Occupancy */}
        <motion.div
          className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md text-left"
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
          }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tỷ lệ lấp đầy</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <Percent size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{finalOccupancy}%</p>
          <span className="text-[10px] text-yellow-500 font-bold mt-1.5 flex items-center gap-1">
            ● Ổn định <span className="text-[var(--color-text-muted)] font-normal">hiệu suất phòng</span>
          </span>
        </motion.div>
      </motion.div>

      {/* Recharts Graphs Section */}
      <motion.div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300 ${isRefreshing ? 'blur-[1px] opacity-75' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        {/* Main Chart: Revenue Trend (AC-02 & Day/Week/Month/Quarter/Year selection) */}
        <motion.div
          className="lg:col-span-2 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-6 text-left"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat' }}>
                📈 Xu Hướng Doanh Thu Phân Tích
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Biểu đồ biểu diễn tổng doanh số bao gồm vé và dịch vụ đi kèm.</p>
            </div>

            {/* Granularity Selector Buttons (Day, Week, Month, Quarter, Year) */}
            <div className="flex bg-[#121414] p-1 rounded-xl border border-white/5 self-start sm:self-auto shrink-0 select-none">
              <button
                onClick={() => setTimeGranularity('day')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'day' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Ngày
              </button>
              <button
                onClick={() => setTimeGranularity('week')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'week' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setTimeGranularity('month')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'month' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Tháng
              </button>
              <button
                onClick={() => setTimeGranularity('quarter')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'quarter' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                }`}
              >
                Quý
              </button>
              <button
                onClick={() => setTimeGranularity('year')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border-none outline-none cursor-pointer ${
                  timeGranularity === 'year' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
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
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                <XAxis dataKey="label" stroke="#7e8494" fontSize={11} tickLine={false} />
                <YAxis stroke="#7e8494" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ticket" name="Doanh thu vé" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="concession" name="Doanh thu bắp nước" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="total" name="Tổng doanh số" stroke="#a855f7" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Side Chart: Movie Ranking (AC-02) */}
        <motion.div
          className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-4 text-left"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
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
                <Bar dataKey="revenue" name="Doanh thu" fill="#a855f7" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
      {/* Export Options Modal (AC-01, AC-02, AC-03) */}
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
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: MANAGER SHOWTIME SCHEDULER
// ──────────────────────────────────────────────────────────────────────────
function ShowtimeSection({ showtimes, setShowtimes, triggerToast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    movie: AVAILABLE_MOVIES[0],
    room: AVAILABLE_ROOMS[0],
    date: '2026-06-18',
    time: '19:00',
    price: 90000
  })

  const handleCreateShowtime = (e) => {
    e.preventDefault()
    if (!form.time || !form.date || form.price <= 0) {
      triggerToast('Vui lòng điền đầy đủ và đúng thông tin!', 'error')
      return
    }

    const newShow = {
      id: Date.now(),
      movie: form.movie,
      room: form.room,
      date: form.date,
      time: form.time,
      price: parseInt(form.price, 10)
    }

    setShowtimes([newShow, ...showtimes])
    setModalOpen(false)
    triggerToast(`Đã lên lịch chiếu thành công phim: ${form.movie}`)
  }

  const handleDeleteShowtime = (id, movieTitle) => {
    setShowtimes(showtimes.filter((st) => st.id !== id))
    triggerToast(`Đã xóa suất chiếu của phim ${movieTitle}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="flex justify-between items-start"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Quản lý lịch chiếu phim
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Lập kế hoạch, lên lịch giờ chiếu cho các phim đang và sắp chiếu tại các phòng chiếu.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-[rgba(147,51,234,0.25)] text-sm"
        >
          <Plus size={16} /> Lên lịch suất chiếu
        </button>
      </motion.div>

      {/* Showtimes Table List */}
      <motion.div
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-lg"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              <th className="px-6 py-4">Phim / Movie</th>
              <th className="px-6 py-4">Phòng chiếu</th>
              <th className="px-6 py-4">Ngày chiếu</th>
              <th className="px-6 py-4">Giờ chiếu</th>
              <th className="px-6 py-4">Đơn giá vé</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {showtimes.length > 0 ? (
              showtimes.map((st) => (
                <tr key={st.id} className="hover:bg-white/2s transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-extrabold text-white">{st.movie}</p>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] font-semibold">{st.room}</td>
                  <td className="px-6 py-4 font-medium">{st.date}</td>
                  <td className="px-6 py-4 text-[var(--color-primary-container)] font-bold">{st.time}</td>
                  <td className="px-6 py-4 font-bold font-mono">{formatVND(st.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteShowtime(st.id, st.movie)}
                      className="text-red-400 hover:text-red-500 font-semibold transition-colors"
                    >
                      Xóa lịch
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-10 text-[var(--color-text-muted)] font-semibold">
                  Chưa có lịch chiếu nào được lên kế hoạch. Ấn "Lên lịch suất chiếu" để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Scheduler Form Modal */}
      {modalOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="bg-[#0f121d] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center bg-white/5">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white" style={{ fontFamily: 'Montserrat' }}>
                🗓️ Lên lịch suất chiếu mới
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-white bg-transparent border-none outline-none cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="p-6 space-y-4">
              {/* Select Movie */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Chọn phim</label>
                <select
                  value={form.movie}
                  onChange={(e) => setForm({ ...form, movie: e.target.value })}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500 cursor-pointer"
                >
                  {AVAILABLE_MOVIES.map((mv) => (
                    <option key={mv} value={mv}>{mv}</option>
                  ))}
                </select>
              </div>

              {/* Select Room */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Phòng chiếu</label>
                <select
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500 cursor-pointer"
                >
                  {AVAILABLE_ROOMS.map((rm) => (
                    <option key={rm} value={rm}>{rm}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Ngày chiếu</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500 cursor-pointer"
                  />
                </div>

                {/* Time Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Giờ chiếu</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Base Ticket Price */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Đơn giá vé (VND)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 120000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  min="30000"
                  step="5000"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer border-none"
                >
                  Xác nhận lên lịch
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: STAFF SHIFT ATTENDANCE & ROOM ALLOCATION
// ──────────────────────────────────────────────────────────────────────────
function ShiftSection({ shifts, setShifts, triggerToast }) {

  const handleStatusToggle = (id, name, currentStatus) => {
    const nextStatus = currentStatus === 'Trực ca' ? 'Đã ra ca' : currentStatus === 'Đã ra ca' ? 'Vắng mặt' : 'Trực ca'

    const updated = shifts.map((sf) => {
      if (sf.id === id) {
        return { ...sf, status: nextStatus }
      }
      return sf
    })

    setShifts(updated)
    triggerToast(`Đã thay đổi trạng thái ca trực của ${name} thành: ${nextStatus}`)
  }

  const handleRoomAllocation = (id, name, room) => {
    const updated = shifts.map((sf) => {
      if (sf.id === id) {
        return { ...sf, room }
      }
      return sf
    })

    setShifts(updated)
    triggerToast(`Đã phân công ${name} vận hành tại: ${room}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Quản lý ca trực & Điểm danh nhân viên
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Điểm danh nhân sự đầu ca, phân bổ phòng chiếu và khu vực làm việc của các nhân sự trong ca làm việc.
        </p>
      </motion.div>

      {/* Shifts Table */}
      <motion.div
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-lg"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              <th className="px-6 py-4">Nhân viên / Employee</th>
              <th className="px-6 py-4">Vai trò hoạt động</th>
              <th className="px-6 py-4">Thời gian ca trực</th>
              <th className="px-6 py-4">Khu vực phân bổ</th>
              <th className="px-6 py-4">Trạng thái ca trực</th>
              <th className="px-6 py-4 text-right">Hành động nhanh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {shifts.map((sf) => (
              <tr key={sf.id} className="hover:bg-white/2s transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-white/5">
                      {sf.name[0]}
                    </div>
                    <span className="font-extrabold text-white">{sf.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-semibold text-gray-300 uppercase">
                    {sf.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--color-text-muted)] font-semibold flex items-center gap-1.5 mt-2">
                  <Clock size={12} /> {sf.shift}
                </td>
                <td className="px-6 py-4">
                  {/* Select Dropdown to Alloc Room */}
                  <select
                    value={sf.room}
                    onChange={(e) => handleRoomAllocation(sf.id, sf.name, e.target.value)}
                    className="bg-color-mix(in srgb, var(--color-surface-container) 70%, transparent) border border-[var(--color-border)] rounded-lg py-1.5 px-3 outline-none text-[11px] text-white focus:border-purple-500 font-medium cursor-pointer"
                  >
                    <option value="Quầy bán vé trung tâm">Quầy bán vé trung tâm</option>
                    <option value="Quầy bắp nước số 1">Quầy bắp nước số 1</option>
                    <option value="Quầy bắp nước số 2">Quầy bắp nước số 2</option>
                    <option value="Phòng chiếu 1 (Standard)">Phòng chiếu 1 (Standard)</option>
                    <option value="Phòng chiếu 2 (3D)">Phòng chiếu 2 (3D)</option>
                    <option value="Phòng chiếu 3 (IMAX)">Phòng chiếu 3 (IMAX)</option>
                    <option value="Phòng chiếu 4 (Dolby Atmos)">Phòng chiếu 4 (Dolby Atmos)</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sf.status === 'Trực ca'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : sf.status === 'Đã ra ca'
                        ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {sf.status === 'Trực ca' && <UserCheck size={10} />}
                    {sf.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleStatusToggle(sf.id, sf.name, sf.status)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-white/5 transition-all text-[10px]"
                  >
                    Đổi trạng thái
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
