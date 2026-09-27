import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  School,
  Bell,
  Calendar,
  FileCheck2,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  ClipboardList,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadDot } from '../../hooks/useUnreadDot'
import { formatRole, getRoleBadgeClass } from '../../utils/formatters'

export interface SidebarProps {
  onCloseMobileMenu?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobileMenu }) => {
  const { user } = useAuth()
  const { summary } = useUnreadDot()
  const isAdmin = user?.role === 'admin'

  const mainNavLinks = [
    { to: '/dashboard', label: 'Painel Inicial', icon: LayoutDashboard },
    { to: '/classes', label: 'Turmas', icon: School },
    {
      to: '/notices',
      label: 'Mural de Avisos',
      icon: Bell,
      hasDot: summary.notice > 0,
      dotCount: summary.notice,
    },
    {
      to: '/calendar',
      label: 'Calendário',
      icon: Calendar,
      hasDot: summary.calendar_event > 0,
      dotCount: summary.calendar_event,
    },
    { to: '/assignments', label: 'Atividades', icon: FileCheck2 },
    { to: '/grades-attendance', label: 'Notas e Frequência', icon: GraduationCap },
  ]

  const adminNavLinks = [
    { to: '/admin/users', label: 'Usuários & Papéis', icon: Users },
    { to: '/admin/disciplines', label: 'Disciplinas', icon: BookOpen },
    { to: '/admin/teachers', label: 'Professores', icon: UserCheck },
    { to: '/admin/students', label: 'Alunos', icon: GraduationCap },
    { to: '/admin/enrollments', label: 'Matrículas', icon: ClipboardList },
  ]

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-200/80 bg-white p-4 select-none overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Logo and Brand Header */}
        <div className="flex items-center justify-between px-2 pt-2">
          <Link
            to="/dashboard"
            onClick={onCloseMobileMenu}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">
                Portal Acadêmico
              </span>
              <span className="text-[11px] font-medium text-slate-400 block">
                Gestão Escolar
              </span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          {onCloseMobileMenu && (
            <button
              type="button"
              onClick={onCloseMobileMenu}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 md:hidden transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar menu lateral"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation Items */}
        <nav className="flex flex-col gap-1">
          <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Menu Principal
          </p>
          {mainNavLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onCloseMobileMenu}
                className={linkClass}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </div>
                {link.hasDot && (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Admin Navigation Section */}
        {isAdmin && (
          <nav className="flex flex-col gap-1 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between px-3.5 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                Administração
              </p>
            </div>
            {adminNavLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onCloseMobileMenu}
                  className={linkClass}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                </NavLink>
              )
            })}
          </nav>
        )}
      </div>

      {/* User Role Card in Sidebar Footer */}
      <div className="pt-4 border-t border-slate-100 px-2 mt-4">
        <Link
          to="/profile"
          onClick={onCloseMobileMenu}
          className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 flex items-center gap-3 hover:bg-slate-100 transition block"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-brand-600 font-bold text-xs shadow-2xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeClass(
                user?.role || 'student'
              )}`}
            >
              {formatRole(user?.role || 'student')}
            </span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
