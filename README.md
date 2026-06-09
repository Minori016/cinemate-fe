# 🎬 CineStar - Movie Theater Management

Frontend cho hệ thống quản lý rạp chiếu phim, xây dựng bằng **Vite + React**.

## Cấu trúc thư mục

```
src/
├── assets/            # Hình ảnh, fonts
├── components/
│   ├── common/        # Button, Input, Modal, Table, Badge
│   └── layout/        # Navbar, Sidebar, AdminLayout, UserLayout
├── contexts/          # AuthContext
├── hooks/             # Custom hooks
├── pages/
│   ├── auth/          # LoginPage, RegisterPage
│   ├── user/          # HomePage
│   ├── booking/       # ShowtimesPage, SeatSelectionPage
│   └── admin/
│       ├── movies/    # MovieListPage
│       ├── employees/ # EmployeeListPage
│       ├── cinemaRooms/
│       ├── tickets/   # TicketManagementPage
│       └── promotions/
├── routes/            # AppRoutes, ProtectedRoute
├── services/          # API services (axios)
└── utils/             # Helper functions
```

## Chạy project

```bash
cp .env.example .env
npm install
npm run dev
```

## Tech stack
- React 19 + Vite
- React Router DOM v7
- Tailwind CSS v4
- Axios
- Lucide React (icons)

## Vai trò người dùng
- **Member**: Đặt vé, quản lý tài khoản, xem lịch sử
- **Admin/Manager**: Quản lý phim, nhân viên, phòng chiếu, khuyến mãi, vé
