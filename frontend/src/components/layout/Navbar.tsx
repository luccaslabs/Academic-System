import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Check,
  LogOut,
  User as UserIcon,
  Menu,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { notificationsService } from '../../services/notifications.service'
import type { NotificationResponse } from '../../types/api'
import { formatRole, getRoleBadgeClass, formatDateTime } from '../../utils/formatters'
import { GlobalSearchModal } from './GlobalSearchModal'

export interface NavbarProps {
  onOpenMobileMenu?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getNotifications()
      setNotifications(data || [])
    } catch {
      // fail silently on background polling/fetch
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      showSuccess('Notificação marcada como lida.')
    } catch (err) {
      showError(err, 'Erro ao atualizar notificação')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      showSuccess('Você saiu da sua conta.')
      navigate('/login')
    } catch (err) {
      showError(err, 'Erro ao realizar logout')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
        {/* Left Side: Mobile Menu Button & Search Shortcut */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl md:hidden transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs sm:text-sm text-slate-400 bg-slate-100/80 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition border border-slate-200/60 w-40 sm:w-64 cursor-pointer min-h-[44px]"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Buscar...</span>
            <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-400 shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Side: Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen(!isNotifOpen)
                setIsUserMenuOpen(false)
              }}
              className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Menu */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-2xl bg-white shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800">Notificações</h4>
                  {unreadCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                      {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Nenhuma notificação encontrada.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/80 transition ${
                          !notif.read ? 'bg-brand-50/30' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-slate-800 leading-snug font-medium">
                            {notif.message}
                          </p>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {formatDateTime(notif.created_at)}
                          </span>
                        </div>
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-100/60 rounded-lg transition shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen)
                setIsNotifOpen(false)
              }}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left min-h-[44px]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 font-semibold text-white text-xs shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name}
                </p>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeClass(
                    user?.role || 'student'
                  )}`}
                >
                  {formatRole(user?.role || 'student')}
                </span>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeClass(
                        user?.role || 'student'
                      )}`}
                    >
                      {formatRole(user?.role || 'student')}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition min-h-[44px]"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Meu Perfil</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
