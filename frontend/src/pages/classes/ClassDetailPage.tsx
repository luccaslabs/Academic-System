import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  School,
  Calendar,
  User,
  Users,
  Bell,
  FileCheck2,
  BookOpen,
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  Edit2,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { classesService } from '../../services/classes.service'
import { noticesService } from '../../services/notices.service'
import { assignmentsService } from '../../services/assignments.service'
import { calendarService } from '../../services/calendar.service'
import type {
  SchoolClassDetailResponse,
  NoticeResponse,
  AssignmentResponse,
  CalendarEventResponse,
} from '../../types/api'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { NoticeCard } from '../../components/cards/NoticeCard'
import { CalendarEventCard } from '../../components/cards/CalendarEventCard'
import { formatDateTime } from '../../utils/formatters'

export const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const classId = id || ''
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()

  const [classDetail, setClassDetail] = useState<SchoolClassDetailResponse | null>(null)
  const [notices, setNotices] = useState<NoticeResponse[]>([])
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Active Tab
  const [activeTab, setActiveTab] = useState<'students' | 'notices' | 'assignments' | 'calendar'>('students')

  // Passing Average State (Admin or Responsible Teacher)
  const isTeacherResponsible =
    user?.role === 'teacher' && classDetail?.teacher?.user_id === user?.id
  const canEditPassingAverage = user?.role === 'admin' || isTeacherResponsible
  const [isEditingAverage, setIsEditingAverage] = useState(false)
  const [passingAverageInput, setPassingAverageInput] = useState<string>('6.0')
  const [isSavingAverage, setIsSavingAverage] = useState(false)

  const fetchAllData = async () => {
    if (!classId) return
    setIsLoading(true)
    try {
      const [detailData, noticesData, assignmentsData, calendarData] = await Promise.all([
        classesService.getClass(classId),
        noticesService.getNotices().catch(() => []),
        assignmentsService.getAssignmentsByClass(classId).catch(() => []),
        calendarService.getEvents().catch(() => []),
      ])

      setClassDetail(detailData)
      setPassingAverageInput(
        detailData.passing_average !== undefined ? String(detailData.passing_average) : '6.0'
      )

      // Filter notices and calendar for this class
      setNotices(noticesData.filter((n) => n.class_id === classId))
      setAssignments(assignmentsData || [])
      setCalendarEvents(calendarData.filter((e) => e.class_id === classId))
    } catch (err) {
      showError(err, 'Erro ao carregar detalhes da turma')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [classId])

  const handleSavePassingAverage = async () => {
    const val = parseFloat(passingAverageInput)
    if (isNaN(val) || val < 0 || val > 10) {
      showError(null, 'A média mínima deve ser um número entre 0 e 10.')
      return
    }

    setIsSavingAverage(true)
    try {
      await classesService.updatePassingAverage(classId, val)
      showSuccess(`Média mínima de aprovação atualizada para ${val.toFixed(1)}!`)
      setIsEditingAverage(false)
      if (classDetail) {
        setClassDetail({ ...classDetail, passing_average: val })
      }
    } catch (err) {
      showError(err, 'Erro ao atualizar média da turma')
    } finally {
      setIsSavingAverage(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Carregando dados da turma..." className="py-20" />
  }

  if (!classDetail) {
    return (
      <EmptyState
        icon={<School className="w-8 h-8 text-slate-400" />}
        title="Turma não encontrada"
        description="A turma solicitada não existe ou você não possui permissão para acessá-la."
        actionText="Voltar para Turmas"
        onAction={() => window.history.back()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/classes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Turmas</span>
        </Link>
      </div>

      {/* Class Header Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary" size="md">
              <Calendar className="w-3.5 h-3.5 mr-1 inline" />
              Ano Letivo {classDetail.year}
            </Badge>
            {classDetail.discipline && (
              <Badge variant="purple" size="md">
                <BookOpen className="w-3.5 h-3.5 mr-1 inline" />
                {classDetail.discipline.name} ({classDetail.discipline.code})
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {classDetail.name}
          </h1>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              {classDetail.teacher ? (
                <>
                  <strong className="text-slate-700">Prof. {classDetail.teacher.user?.name || classDetail.teacher.registration}</strong>
                </>
              ) : (
                'Professor não atribuído'
              )}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <strong className="text-slate-700">{classDetail.students?.length || 0}</strong> alunos matriculados
            </span>
          </div>
        </div>

        {/* Passing Average Box / Editor */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start sm:items-end justify-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <span>Média Mínima para Dispensa</span>
          </div>

          {canEditPassingAverage && isEditingAverage ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={passingAverageInput}
                onChange={(e) => setPassingAverageInput(e.target.value)}
                className="w-24 text-center font-bold"
              />
              <Button
                size="sm"
                onClick={handleSavePassingAverage}
                isLoading={isSavingAverage}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPassingAverageInput(
                    classDetail.passing_average !== undefined
                      ? String(classDetail.passing_average)
                      : '6.0'
                  )
                  setIsEditingAverage(false)
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {(classDetail.passing_average ?? 6.0).toFixed(1)}
              </span>
              {canEditPassingAverage && (
                <button
                  type="button"
                  onClick={() => setIsEditingAverage(true)}
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
                  title="Editar média mínima de aprovação"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-1 border-b-2 text-sm font-bold transition whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'students'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alunos ({classDetail.students?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-1 border-b-2 text-sm font-bold transition whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'notices'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Avisos da Turma ({notices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-1 border-b-2 text-sm font-bold transition whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'assignments'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Atividades ({assignments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-1 border-b-2 text-sm font-bold transition whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'calendar'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendário ({calendarEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {/* 1. STUDENTS TAB */}
        {activeTab === 'students' && (
          <div>
            {!classDetail.students || classDetail.students.length === 0 ? (
              <EmptyState
                icon={<Users className="w-8 h-8 text-slate-400" />}
                title="Nenhum aluno matriculado"
                description="Não há estudantes matriculados nesta turma."
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-hidden rounded-3xl bg-white shadow-xs border border-slate-100">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-6">Aluno</th>
                        <th className="py-3.5 px-6">Nº de Matrícula</th>
                        <th className="py-3.5 px-6">E-mail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classDetail.students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            {student.user?.name || `Estudante #${student.registration}`}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-slate-600 font-bold">
                            {student.registration}
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            {student.user?.email || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="sm:hidden space-y-3">
                  {classDetail.students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1.5"
                    >
                      <p className="font-bold text-slate-900 text-sm">
                        {student.user?.name || `Estudante #${student.registration}`}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span>Matrícula:</span>
                        <span className="font-mono font-bold text-slate-700">{student.registration}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>E-mail:</span>
                        <span className="text-slate-700 truncate max-w-[180px]">{student.user?.email || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. NOTICES TAB */}
        {activeTab === 'notices' && (
          <div>
            {notices.length === 0 ? (
              <EmptyState
                icon={<Bell className="w-8 h-8 text-slate-400" />}
                title="Nenhum comunicado da turma"
                description="Não há avisos específicos postados para esta turma até o momento."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {notices.map((n) => (
                  <NoticeCard key={n.id} notice={n} classNameRef={classDetail.name} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div>
            {assignments.length === 0 ? (
              <EmptyState
                icon={<FileCheck2 className="w-8 h-8 text-slate-400" />}
                title="Nenhuma atividade cadastrada"
                description="Esta turma ainda não possui trabalhos ou entregas registradas."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-xs border border-slate-100"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant={a.accepts_submissions ? 'success' : 'default'}>
                          {a.accepts_submissions ? 'Aceita entregas' : 'Envios fechados'}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-2">{a.title}</h4>
                      {a.description && (
                        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                          {a.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span>Prazo de entrega: </span>
                      <strong className="text-slate-800">{formatDateTime(a.due_date)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div>
            {calendarEvents.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon className="w-8 h-8 text-slate-400" />}
                title="Nenhum evento agendado"
                description="Não há provas ou compromissos no calendário desta turma."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {calendarEvents.map((evt) => (
                  <CalendarEventCard key={evt.id} event={evt} classNameRef={classDetail.name} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
