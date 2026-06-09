import { Routes, Route, Navigate } from 'react-router-dom'
import UserLayout from '../components/layout/UserLayout'
import AdminLayout from '../components/layout/AdminLayout'
import ProtectedRoute from './ProtectedRoute'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import HomePage from '../pages/user/HomePage'
import ShowtimesPage from '../pages/booking/ShowtimesPage'
import SeatSelectionPage from '../pages/booking/SeatSelectionPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MovieListPage from '../pages/admin/movies/MovieListPage'
import EmployeeListPage from '../pages/admin/employees/EmployeeListPage'
import TicketManagementPage from '../pages/admin/tickets/TicketManagementPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/showtimes" element={<ShowtimesPage />} />
        <Route path="/booking" element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="movies" element={<MovieListPage />} />
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="tickets" element={<TicketManagementPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
