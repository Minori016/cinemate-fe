import { Film, Award, Shield, Users } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen py-10 px-4 md:px-8 max-w-5xl mx-auto" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page Title */}
      <div className="text-center mb-16">
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Về Chúng Tôi
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          CineMate — Nơi cảm xúc điện ảnh thăng hoa cùng hệ thống phòng chiếu hiện đại và dịch vụ đẳng cấp.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
        <div>
          <h2 className="text-2xl text-white font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Tầm Nhìn Của CineMate
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed mb-4">
            Được thành lập với mục tiêu đem lại trải nghiệm giải trí chất lượng cao nhất cho khán giả Việt Nam, CineMate không ngừng mở rộng hệ thống rạp chiếu chuẩn quốc tế tích hợp công nghệ trình chiếu IMAX, Dolby Atmos chân thực.
          </p>
          <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
            Chúng tôi tin rằng, mỗi lần ghé thăm CineMate không chỉ đơn thuần là việc xem một bộ phim, mà đó là hành trình khám phá những câu chuyện tuyệt vời qua màn ảnh rộng cùng bắp nước thơm ngon nhất.
          </p>
        </div>
        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600"
            alt="Theater vision"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="border-t border-white/5 pt-12">
        <h2 className="text-2xl text-white font-bold text-center mb-10" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Giá Trị Cốt Lõi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Film, title: 'Trình Chiếu Đỉnh Cao', desc: 'Trải nghiệm máy chiếu laser sắc nét cùng màn hình cực đại sống động.' },
            { icon: Award, title: 'Dịch Vụ Hạng Nhất', desc: 'Đội ngũ nhân viên thân thiện, chu đáo luôn sẵn sàng phục vụ quý khách.' },
            { icon: Shield, title: 'Chuẩn Quốc Tế', desc: 'Không gian phòng chiếu sang trọng, sạch sẽ và an toàn tuyệt đối.' },
            { icon: Users, title: 'Cộng Đồng Hội Viên', desc: 'Nhận vô vàn quyền lợi đặc biệt dành riêng cho thành viên CineMate.' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-white/5 flex flex-col items-center text-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)' }}
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 mb-4">
                <item.icon size={22} />
              </div>
              <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
              <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
