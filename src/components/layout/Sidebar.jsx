import { NavLink, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../contexts/AuthContext'
import logoImg from '../../assets/Cinematelogo.png'

const ROLE_LABELS = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
  MEMBER: 'Member',
}

const ROLE_BADGE_CLASSES = {
  ADMIN: 'role-badge-admin',
  MANAGER: 'role-badge-manager',
  STAFF: 'role-badge-staff',
  MEMBER: 'role-badge-member',
}

export default function Sidebar({ navItems, homeLink = '/', workspaceLabel = 'Workspace' }) {
  const { user, logout } = useAuth()

  return (
    <aside
      className="w-[260px] min-h-screen flex flex-col fixed left-0 top-0 z-40"
      style={{
        background: 'var(--color-sidebar)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--color-sidebar-border)',
        paddingTop: '40px',
      }}
    >
      {/* Brand Header */}
      <div className="px-6 pb-5 mb-2" style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <h1
              className="text-lg font-black tracking-wider leading-none"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span className="text-[var(--color-sidebar-foreground)]">CINE</span>
              <span className="text-[#e50914]">MATE</span>
            </h1>
            <p
              className="text-[9px] uppercase tracking-[0.2em] font-bold mt-1 text-[var(--color-text-muted)]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {workspaceLabel}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, active }) => {
          const currentPath = window.location.pathname
          // Check if link should be active: either exact match, or it is a subpath of the current path
          const isCustomActive = to === '/' || to === '/admin' || to === '/manager'
            ? currentPath === to
            : currentPath.startsWith(to)

          return (
            <NavLink
              key={to}
              to={to}
              className={() =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isCustomActive ? 'text-[var(--color-sidebar-foreground)] font-semibold' : 'text-[var(--color-sidebar-foreground)]/60 hover:text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)]'
                }`
              }
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {() => (
                <>
                  {isCustomActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'rgba(229,9,20,0.08)',
                        border: '1px solid rgba(229,9,20,0.15)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon
                      size={18}
                      style={{
                        color: isCustomActive ? 'var(--color-sidebar-primary)' : 'var(--color-sidebar-foreground)',
                        opacity: isCustomActive ? 1 : 0.4,
                        transition: 'color 0.2s ease, opacity 0.2s ease',
                      }}
                    />
                    {label}
                  </span>
                  {isCustomActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{
                        background: '#e50914',
                        boxShadow: '0 0 10px rgba(229,9,20,0.5)',
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          )
        })}

        <div className="my-3 mx-4 h-px" style={{ background: 'var(--color-sidebar-border)' }} />

        {/* Home Link */}
        <Link
          to={homeLink}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-sidebar-foreground)]/60 hover:text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] transition-all duration-200"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-sidebar-foreground)', opacity: 0.4 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Quay lại Trang chủ
        </Link>
      </nav>

      {/* User Profile & Logout */}
      <div
        className="p-4 mx-3 mb-4 rounded-2xl"
        style={{
          background: 'var(--color-sidebar-accent)',
          border: '1px solid var(--color-sidebar-border)',
        }}
      >
        <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #e50914, #8b0000)',
              border: '2px solid var(--color-sidebar-border)',
              fontFamily: 'Montserrat, sans-serif',
              color: '#fff',
            }}
          >
            {user?.email?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-[var(--color-sidebar-foreground)] truncate"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {user?.email ? user.email.split('@')[0] : user?.username}
            </p>
            {(() => {
              const role = user?.roles?.[0] || 'MEMBER'
              const badgeClass = ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.MEMBER
              const badgeLabel = ROLE_LABELS[role] || ROLE_LABELS.MEMBER
              return (
                <span className={`${badgeClass} border text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 inline-flex items-center`}>
                  {badgeLabel}
                </span>
              )
            })()}
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full text-xs font-semibold rounded-xl transition-all duration-200 hover:bg-red-500/10"
          style={{
            color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.15)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Đăng xuất hệ thống
        </button>
      </div>
    </aside>
  )
}
