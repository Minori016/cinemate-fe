# 🎬 CineMate - Movie Theater Management System

**Frontend Application** cho hệ thống quản lý rạp chiếu phim hiện đại, được xây dựng với React 18, Vite, và Tailwind CSS.

---

## ✨ Tính năng nổi bật

### 👤 Hệ thống phân quyền đa vai trò
| Role | Chức năng |
|------|-----------|
| **Member** | Đặt vé, quản lý tài khoản, xem lịch sử đặt vé |
| **Staff** | Check-in vé, bán bắp/nước tại quầy, xem tổng quan ca làm |
| **Manager** | Quản lý ca làm, thống kê doanh thu, counter checkout |
| **Admin** | Quản lý phim, nhân viên, phòng chiếu, lịch chiếu, vé, khuyến mãi |

### 🎨 UI/UX cao cấp
- **Smooth scrolling** với Lenis (1.5s duration)
- **Cinematic animations** với Framer Motion & GSAP
- **3D visual effects** với Three.js & React Three Fiber
- **Responsive design** cho mọi thiết bị
- **Dark theme** với màu đỏ đặc trưng Cinemate (#e50914)

---

## 🚀 Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React | 18.3.1 |
| **Build Tool** | Vite | 6.3.5 |
| **Router** | React Router DOM | 7.16.0 |
| **Styling** | Tailwind CSS | 4.1.12 |
| **Animation** | Framer Motion | 12.23.24 |
| | GSAP | 3.12.5 |
| **3D Graphics** | Three.js | 0.184.0 |
| | @react-three/fiber | 9.6.1 |
| | @react-three/drei | 10.7.7 |
| **Scroll** | Lenis | 1.3.23 |
| **HTTP Client** | Axios | 1.16.1 |
| **Icons** | Lucide React | 0.487.0 |
| **State Management** | React Context | Built-in |

---

## 📁 Cấu trúc dự án

```
movie-theater-front-end/
├── public/                          # Tài nguyên tĩnh
│   ├── favicon.png, .svg, .ico     # Icon và favicon
│   └── icons.svg                   # SVG icons bundle
├── src/
│   ├── components/                 # Reusable components
│   │   ├── common/                 # UI cơ bản (Button, Input, Modal, Table, Badge...)
│   │   └── layout/                 # Layout components (Navbar, Sidebar, Footer...)
│   ├── contexts/                   # React Context providers
│   │   └── AuthContext.jsx         # Authentication & user state
│   ├── hooks/                      # Custom React hooks
│   │   └── useLenisScroll.jsx      # Lenis scroll integration
│   ├── pages/                      # Page components by role
│   │   ├── admin/                  # Admin dashboard & management
│   │   │   ├── cinema-rooms/       # Quản lý phòng chiếu + seat layout builder
│   │   │   ├── employees/          # Quản lý nhân viên
│   │   │   ├── members/            # Quản lý thành viên
│   │   │   ├── movies/             # Quản lý phim (CRUD + poster upload)
│   │   │   ├── promotions/         # Quản lý khuyến mãi
│   │   │   ├── showtimes/          # Quản lý lịch chiếu
│   │   │   └── tickets/            # Quản lý vé
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── booking/                # Booking flow
│   │   │   ├── ShowtimesPage.jsx
│   │   │   └── SeatSelectionPage.jsx
│   │   ├── manager/                # Manager functions
│   │   │   ├── analytics/          # Doanh thu, thống kê
│   │   │   ├── CounterCheckoutPage.jsx
│   │   │   ├── shifts/             # Quản lý ca làm
│   │   │   └── showtimes/          # Quản lý lịch chiếu
│   │   ├── staff/                  # Staff functions
│   │   │   ├── checkin/            # Check-in vé
│   │   │   ├── concessions/        # Bán bắp/nước
│   │   │   └── overview/           # Tổng quan ca làm
│   │   └── user/                   # Customer-facing pages
│   │       ├── HomePage.jsx        # Trang chủ
│   │       ├── MoviesPage.jsx      # Danh sách phim
│   │       ├── MovieDetailPage.jsx # Chi tiết phim + trailer modal
│   │       ├── ProfilePage.jsx     # Trang cá nhân
│   │       ├── AboutPage.jsx       # Giới thiệu
│   │       ├── ContactPage.jsx     # Liên hệ
│   │       ├── FaqPage.jsx         # FAQ
│   │       ├── FeedbackPage.jsx    # Feedback
│   │       ├── CareersPage.jsx     # Tuyển dụng
│   │       ├── PromotionsPage.jsx  # Khuyến mãi
│   │       ├── TermsPage.jsx       # Điều khoản
│   │       └── PrivacyPage.jsx     # Chính sách bảo mật
│   ├── routes/                     # Routing configuration
│   │   ├── AppRoutes.jsx           # Main route definitions
│   │   └── ProtectedRoute.jsx      # Route guard by role
│   ├── services/                   # API service layer
│   │   ├── api.js                 # Axios instance + interceptors
│   │   ├── authService.js         # Authentication APIs
│   │   ├── movieService.js        # Movie APIs
│   │   ├── showtimeService.js     # Showtime APIs
│   │   ├── bookingService.js      # Booking APIs
│   │   ├── userService.js         # User APIs
│   │   ├── employeeService.js     # Employee APIs
│   │   ├── cinemaRoomService.js   # Cinema room APIs
│   │   ├── promotionService.js    # Promotion APIs
│   │   └── genreService.js        # Genre APIs
│   ├── style/                      # Styles & configuration
│   │   └── globals.css             # Global CSS + Tailwind imports
│   ├── App.jsx                     # Main application shell and providers
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── index.html                      # HTML template
├── package.json                    # Dependencies & scripts
├── tailwind.config.js              # Tailwind configuration
├── vite.config.js                  # Vite configuration with proxy
└── README.md                       # This file
```

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on `localhost:8080`

### Quick Start

1. **Clone repository**
```bash
git clone https://git.fsoft-academy.edu.vn/hcm26_cpl_js_java_02/group-05/movie-theater-front-end.git
cd movie-theater-front-end
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```
Edit `.env` if needed (default config works for local dev).

4. **Start development server**
```bash
npm run dev
```
Open browser at `http://localhost:5173` (or the port shown in terminal).

5. **Build for production**
```bash
npm run build
npm run preview  # Preview production build
```

---

## 🔧 Configuration

### Vite Proxy (CORS Workaround)
The project includes a Vite proxy to forward API requests:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Requests to `/api/*` are automatically proxied to backend

### Environment Variables
Create `.env` from `.env.example`:
```env
# API Configuration
VITE_API_URL=/api
```

---

## 🎯 Key Features Breakdown

### 1. Authentication & Authorization
- JWT token-based auth
- Role-based route protection (Admin, Manager, Staff, Member)
- Auto-logout on token expiry
- Public vs protected API endpoints

### 2. Movie Management (Admin)
- CRUD operations for movies
- Poster upload with multipart/form-data
- Genre and country associations
- Status management (active/inactive)

### 3. Cinema Room & Seat Management
- Visual seat layout builder
- Multiple seat types (Standard, VIP, Couple)
- Heatmap visualization for optimal seating
- Real-time preview of seat configuration

### 4. Booking System
- Date & time selection for showtimes
- Interactive seat map
- Real-time seat availability
- Price calculation based on seat type

### 5. Staff & Manager Features
- Ticket verification/check-in
- Concessions (popcorn & drinks) sales
- Shift management
- Sales analytics & reports
- Counter checkout

---

## 🎨 Design System

### Colors
```css
Primary Red: #e50914
Background: #0a0a0a (deep cinema black)
Surface: #141414
Surface Light: #1f1f1f
Text White: #ffffff
Text Muted: rgba(255,255,255,0.5)
```

### Typography
- **Headlines**: Montserrat (weights: 700-900)
- **Body**: Inter (weights: 400-500)
- **Tracking**: Tight for headlines (-0.03 to -0.05em)

### Spacing
- Consistent 8px grid system
- Generous white space for cinematic feel
- Section padding: `clamp(20px, 4vw, 80px)`

---

## 🏗️ Development Guidelines

### Code Style
- React functional components with hooks
- ESLint + Prettier configuration
- Consistent naming conventions

### Component Structure
```jsx
// Example component structure
export default function ComponentName({ prop1, prop2 }) {
  // State & refs
  const [state, setState] = useState()
  const ref = useRef()

  // Effects
  useEffect(() => { ... }, [])

  // Handlers
  const handleClick = useCallback(() => { ... }, [])

  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}
```

### API Integration
All API calls go through `src/services/api.js` with:
- Base URL configuration
- Request interceptors (auth token)
- Response interceptors (error handling, token cleanup)

---

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run tests with coverage
npm run test:coverage

# E2E tests (if configured)
npm run test:e2e
```

---

## 🚢 Deployment

### Build
```bash
npm run build
```
Output goes to `dist/` folder.

### Deploy to Netlify/Vercel
1. Connect Git repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables if needed

### Docker (optional)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📡 API Integration

The frontend connects to a Spring Boot backend:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/v1/auth/login` | Login |
| `POST /api/v1/auth/register` | Register |
| `GET /api/v1/movies` | List movies (with filters) |
| `GET /api/v1/movies/:id` | Movie details |
| `POST /api/v1/booking` | Create booking |
| `GET /api/v1/showtimes` | List showtimes |
| ... | ... | See API documentation |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Merge Request

---

## 📄 License

[Your License Here] - Add license file and update this section.

---

## 🙏 Acknowledgments

- **Design inspiration**: Netflix, Apple TV, luxury cinema websites
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/gsap/)
- **3D Graphics**: [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- **Smooth Scroll**: [Lenis](https://lenis.studiofreight.com/)

---

## 📞 Support

- Create an issue in the GitLab repository
- Contact the development team

---

**Made with ❤️ by CineMate Team**
