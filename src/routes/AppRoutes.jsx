import { Routes, Route, Navigate } from 'react-router-dom'
import UserLayout from '../components/layout/UserLayout'
import AdminLayout from '../components/layout/AdminLayout'
import ProtectedRoute from './ProtectedRoute'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'

import HomePage from '../pages/user/HomePage'
import ProfilePage from '../pages/user/ProfilePage'
import MoviesPage from '../pages/user/MoviesPage'
import CinemasPage from '../pages/user/CinemasPage'
import PromotionsPage from '../pages/user/PromotionsPage'
import AboutPage from '../pages/user/AboutPage'
import ShowtimesPage from '../pages/booking/ShowtimesPage'
import SeatSelectionPage from '../pages/booking/SeatSelectionPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MovieListPage from '../pages/admin/movies/MovieListPage'
import EmployeeListPage from '../pages/admin/employees/EmployeeListPage'
import MemberListPage from '../pages/admin/members/MemberListPage'
import TicketManagementPage from '../pages/admin/tickets/TicketManagementPage'

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
        <Route path="/showtimes" element={<ShowtimesPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/booking" element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="movies" element={<MovieListPage />} />
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="members" element={<MemberListPage />} />
        <Route path="tickets" element={<TicketManagementPage />} />
      </Route>

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
