import type { EventType, UserRole } from '../types/api'

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

export function formatRole(role: UserRole | string): string {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'teacher':
      return 'Professor'
    case 'student':
      return 'Aluno'
    default:
      return role
  }
}

export function getRoleBadgeClass(role: UserRole | string): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'teacher':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'student':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function formatEventType(type: EventType | string): string {
  switch (type) {
    case 'exam':
      return 'Prova'
    case 'assignment':
      return 'Atividade'
    case 'event':
      return 'Evento'
    default:
      return type
  }
}

export function getEventTypeBadgeClass(type: EventType | string): string {
  switch (type) {
    case 'exam':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'assignment':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'event':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function formatGrade(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-'
  return Number(val).toFixed(1).replace('.', ',')
}
