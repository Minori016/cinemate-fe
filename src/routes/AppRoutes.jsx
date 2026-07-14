import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import UserLayout from '../components/layout/UserLayout'
import AdminLayout from '../components/layout/AdminLayout'
import StaffLayout from '../components/layout/StaffLayout'
import ManagerLayout from '../components/layout/ManagerLayout'
import ProtectedRoute from './ProtectedRoute'



import AuthPage from '../pages/auth/AuthPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import FirstLoginPage from '../pages/auth/FirstLoginPage'

import HomePage from '../pages/user/HomePage'
import ProfilePage from '../pages/user/ProfilePage'
import MoviesPage from '../pages/user/MoviesPage'
import MovieDetailPage from '../pages/user/MovieDetailPage'
import CinemasPage from '../pages/user/CinemasPage'
import PromotionsPage from '../pages/user/PromotionsPage'
import AboutPage from '../pages/user/AboutPage'
import TermsPage from '../pages/user/TermsPage'
import PrivacyPage from '../pages/user/PrivacyPage'
import FaqPage from '../pages/user/FaqPage'
import ContactPage from '../pages/user/ContactPage'
import FeedbackPage from '../pages/user/FeedbackPage'
import CareersPage from '../pages/user/CareersPage'
import VideoIntro from '../components/intro/VideoIntro'
import ShowtimesPage from '../pages/booking/ShowtimesPage'
import SeatSelectionPage from '../pages/booking/SeatSelectionPage'
import CheckoutPage from '../pages/booking/CheckoutPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MovieListPage from '../pages/admin/movies/MovieListPage'
import MovieFormPage from '../pages/admin/movies/MovieFormPage'
import EmployeeListPage from '../pages/admin/employees/EmployeeListPage'
import EmployeeFormPage from '../pages/admin/employees/EmployeeFormPage'
import MemberListPage from '../pages/admin/members/MemberListPage'
import MemberFormPage from '../pages/admin/members/MemberFormPage'
import TicketManagementPage from '../pages/admin/tickets/TicketManagementPage'
import CinemaRoomListPage from '../pages/admin/cinema-rooms/CinemaRoomListPage'
import CinemaRoomDetailPage from '../pages/admin/cinema-rooms/CinemaRoomDetailPage'
import CinemaRoomFormPage from '../pages/admin/cinema-rooms/CinemaRoomFormPage'
import ShowtimeListPage from '../pages/admin/showtimes/ShowtimeListPage'
import ShowtimeFormPage from '../pages/admin/showtimes/ShowtimeFormPage'
import ShowtimeDetailPage from '../pages/admin/showtimes/ShowtimeDetailPage'
import AutoGeneratePage from '../pages/admin/showtimes/AutoGeneratePage'
import SystemConfigPage from '../pages/admin/price-config/SystemConfigPage'
import PromotionListPage from '../pages/admin/promotions/PromotionListPage'
import PromotionFormPage from '../pages/admin/promotions/PromotionFormPage'
import ConcessionListPage from '../pages/admin/concessions/ConcessionListPage'
import ConcessionFormPage from '../pages/admin/concessions/ConcessionFormPage'
import StaffOverviewPage from '../pages/staff/overview/StaffOverviewPage'
import StaffTicketVerifierPage from '../pages/staff/checkin/StaffTicketVerifierPage'
import StaffConcessionsPage from '../pages/staff/concessions/StaffConcessionsPage'
import StaffTicketingPage from '../pages/staff/ticketing/StaffTicketingPage'
import ManagerAnalyticsPage from '../pages/manager/analytics/ManagerAnalyticsPage'
import ManagerShowtimesPage from '../pages/manager/showtimes/ManagerShowtimesPage'
import ManagerShiftsPage from '../pages/manager/shifts/ManagerShiftsPage'
import CounterCheckoutPage from '../pages/manager/CounterCheckoutPage'

function RootRedirect() {
  const storage = import.meta.env.DEV ? sessionStorage : localStorage
  const introSeen = storage.getItem('cinemate_intro_seen')
  console.log('[RootRedirect] introSeen:', introSeen, '| storage:', import.meta.env.DEV ? 'sessionStorage' : 'localStorage')
  return introSeen === 'true'
    ? <Navigate to="/home" replace />
    : <Navigate to="/intro" replace />
}

export default function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.key}>

        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Intro — không navbar/footer */}
        <Route path="/intro" element={<VideoIntro onExplore={() => window.location.href = '/home'} />} />

        {/* Auth */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/first-login" element={<FirstLoginPage />} />

        {/* User Layout */}
        <Route element={<UserLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:movieId" element={<MovieDetailPage />} />
          <Route path="/showtimes" element={<ShowtimesPage />} />
          <Route path="/cinemas" element={<CinemasPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faqs" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Route>

        {/* Booking */}
        <Route path="/booking" element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/manager/booking/confirm" element={<ProtectedRoute><CounterCheckoutPage /></ProtectedRoute>} />

        {/* Staff */}
        <Route path="/staff" element={<ProtectedRoute role="STAFF"><StaffLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="dashboard" element={<Navigate to="/staff/overview" replace />} />
          <Route path="overview" element={<StaffOverviewPage />} />
          <Route path="ticketing" element={<StaffTicketingPage />} />
          <Route path="checkin" element={<StaffTicketVerifierPage />} />
          <Route path="concessions" element={<StaffConcessionsPage />} />
          <Route path="tickets" element={<TicketManagementPage />} />
        </Route>

        {/* Manager */}
        <Route path="/manager" element={<ProtectedRoute role="MANAGER"><ManagerLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="dashboard" element={<Navigate to="/manager/analytics" replace />} />
          <Route path="analytics" element={<ManagerAnalyticsPage />} />
          <Route path="showtimes" element={<ShowtimeListPage />} />
          <Route path="showtimes/add" element={<ShowtimeFormPage />} />
          <Route path="showtimes/:id" element={<ShowtimeDetailPage />} />
          <Route path="showtimes/auto-generate" element={<AutoGeneratePage />} />
          <Route path="shifts" element={<ManagerShiftsPage />} />
          <Route path="tickets" element={<TicketManagementPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="movies" element={<MovieListPage />} />
          <Route path="movies/add" element={<MovieFormPage />} />
          <Route path="movies/edit/:id" element={<MovieFormPage />} />
          <Route path="employees" element={<EmployeeListPage />} />
          <Route path="employees/add" element={<EmployeeFormPage />} />
          <Route path="employees/edit/:id" element={<EmployeeFormPage />} />
          <Route path="members" element={<MemberListPage />} />
          <Route path="members/add" element={<MemberFormPage />} />
          <Route path="members/edit/:id" element={<MemberFormPage />} />
          <Route path="tickets" element={<TicketManagementPage />} />
          <Route path="cinema-rooms" element={<CinemaRoomListPage />} />
          <Route path="cinema-rooms/add" element={<CinemaRoomFormPage />} />
          <Route path="cinema-rooms/:roomId" element={<CinemaRoomDetailPage />} />
          <Route path="showtimes" element={<ShowtimeListPage />} />
          <Route path="showtimes/add" element={<ShowtimeFormPage />} />
          <Route path="showtimes/:id" element={<ShowtimeDetailPage />} />
          <Route path="showtimes/auto-generate" element={<AutoGeneratePage />} />
          <Route path="system-configs" element={<SystemConfigPage />} />
          <Route path="promotions" element={<PromotionListPage />} />
          <Route path="promotions/add" element={<PromotionFormPage />} />
          <Route path="promotions/edit/:id" element={<PromotionFormPage />} />
          <Route path="concessions" element={<ConcessionListPage />} />
          <Route path="concessions/add" element={<ConcessionFormPage />} />
          <Route path="concessions/edit/:id" element={<ConcessionFormPage />} />
        </Route>

        {/* Wildcard */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  )
}