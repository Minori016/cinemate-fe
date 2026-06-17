import { Routes, Route, Navigate } from 'react-router-dom'
import UserLayout from '../components/layout/UserLayout'
import AdminLayout from '../components/layout/AdminLayout'
import StaffLayout from '../components/layout/StaffLayout'
import ManagerLayout from '../components/layout/ManagerLayout'
import ProtectedRoute from './ProtectedRoute'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'

import HomePage from '../pages/user/HomePage'
import ProfilePage from '../pages/user/ProfilePage'
import MoviesPage from '../pages/user/MoviesPage'
import MovieDetailPage from '../pages/user/MovieDetailPage'
import CinemasPage from '../pages/user/CinemasPage'
import PromotionsPage from '../pages/user/PromotionsPage'
import AboutPage from '../pages/user/AboutPage'
import ShowtimesPage from '../pages/booking/ShowtimesPage'
import SeatSelectionPage from '../pages/booking/SeatSelectionPage'
import BookingConfirmationPage from '../pages/booking/BookingConfirmationPage'
import PaymentPage from '../pages/booking/PaymentPage'
import BookingSuccessPage from '../pages/booking/BookingSuccessPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MovieListPage from '../pages/admin/movies/MovieListPage'
import EmployeeListPage from '../pages/admin/employees/EmployeeListPage'
import MemberListPage from '../pages/admin/members/MemberListPage'
import TicketManagementPage from '../pages/admin/tickets/TicketManagementPage'
import CinemaRoomListPage from '../pages/admin/cinema-rooms/CinemaRoomListPage'
import CinemaRoomDetailPage from '../pages/admin/cinema-rooms/CinemaRoomDetailPage'
import StaffDashboardPage from '../pages/staff/StaffDashboardPage'
import ManagerDashboardPage from '../pages/manager/ManagerDashboardPage'
import CounterCheckoutPage from '../pages/manager/CounterCheckoutPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public: Đưa các trang không cần login lên đầu */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* User Layout: Để "/" làm trang chủ chính thức tại đây */}
      <Route element={<UserLayout />}>
        <Route index element={<HomePage />} /> {/* Sử dụng index cho trang chủ của layout */}
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:movieId" element={<MovieDetailPage />} />
        <Route path="/showtimes" element={<ShowtimesPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>

      {/* Booking Layout: Tách biệt khỏi UserLayout để hiển thị Header giao dịch rút gọn */}
      <Route path="/booking" element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>} />
      <Route path="/booking/confirm" element={<ProtectedRoute><BookingConfirmationPage /></ProtectedRoute>} />
      <Route path="/booking/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
      <Route path="/booking/success" element={<ProtectedRoute><BookingSuccessPage /></ProtectedRoute>} />
      <Route path="/manager/booking/confirm" element={<ProtectedRoute><CounterCheckoutPage /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<ProtectedRoute role="STAFF"><StaffLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboardPage />} />
        <Route path="tickets" element={<TicketManagementPage />} />
      </Route>

      {/* Manager */}
      <Route path="/manager" element={<ProtectedRoute role="MANAGER"><ManagerLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboardPage />} />
        <Route path="tickets" element={<TicketManagementPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="movies" element={<MovieListPage />} />
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="members" element={<MemberListPage />} />
        <Route path="tickets" element={<TicketManagementPage />} />
        <Route path="cinema-rooms" element={<CinemaRoomListPage />} />
        <Route path="cinema-rooms/:roomId" element={<CinemaRoomDetailPage />} />
      </Route>

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
