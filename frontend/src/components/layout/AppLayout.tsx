import React, { useState } from 'react'
import { Outlet, Navigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UnreadProvider } from '../../contexts/UnreadContext'
import { useUnreadDot } from '../../hooks/useUnreadDot'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { LayoutDashboard, School, Bell, Calendar, User } from 'lucide-react'

const BottomMobileNav: React.FC = () => {
  const { summary } = useUnreadDot()

  const mobileNavItems = [
    { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { to: '/classes', label: 'Turmas', icon: School },
    {
      to: '/notices',
      label: 'Avisos',
      icon: Bell,
      hasDot: summary.notice > 0,
    },
    {
      to: '/calendar',
      label: 'Agenda',
      icon: Calendar,
      hasDot: summary.calendar_event > 0,
    },
    { to: '/profile', label: 'Perfil', icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-2 safe-area-pb">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 w-full h-full py-1 text-[11px] font-medium transition ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.hasDot && (
                <span className="absolute -top-0.5 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span className="leading-tight">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

const LayoutContent: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Carregando portal acadêmico..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Auto-collapsible & auto-closing) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop with click to close */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Offcanvas sidebar drawer */}
          <div className="relative flex w-72 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl z-10 transform transition-transform duration-200">
            <Sidebar onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation for Quick Access */}
      <BottomMobileNav />
    </div>
  )
}

export const AppLayout: React.FC = () => {
  return (
    <UnreadProvider>
      <LayoutContent />
    </UnreadProvider>
  )
}
