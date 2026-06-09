import { Film, Users, Ticket, Tag } from 'lucide-react'

const stats = [
  { label: 'Tổng phim', value: '24', icon: Film, color: 'text-red-400 bg-red-900/30' },
  { label: 'Nhân viên', value: '12', icon: Users, color: 'text-blue-400 bg-blue-900/30' },
  { label: 'Vé hôm nay', value: '148', icon: Ticket, color: 'text-green-400 bg-green-900/30' },
  { label: 'Khuyến mãi', value: '5', icon: Tag, color: 'text-yellow-400 bg-yellow-900/30' },
]

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-4xl text-white mb-8" style={{fontFamily:'Bebas Neue'}}>Dashboard</h1>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-xl text-white mb-4" style={{fontFamily:'Bebas Neue'}}>Doanh thu gần đây</h2>
        <p className="text-[var(--color-text-muted)] text-sm">Biểu đồ doanh thu sẽ hiển thị ở đây...</p>
      </div>
    </div>
  )
}
