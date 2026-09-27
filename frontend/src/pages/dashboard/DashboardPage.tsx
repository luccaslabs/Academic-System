import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Bell,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { dashboardService } from '../../services/dashboard.service'
import type {
  AdminDashboard,
  TeacherDashboard,
  StudentDashboard,
  DashboardResponse,
} from '../../types/api'
import { StatCard } from '../../components/cards/StatCard'
import { ClassCard } from '../../components/cards/ClassCard'
import { CalendarEventCard } from '../../components/cards/CalendarEventCard'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { showError } = useToast()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboard = async () => {
    setIsLoading(true)
    try {
      const response = await dashboardService.getDashboard()
      setData(response)
    } catch (err: any) {
      showError(err, 'Erro ao carregar dados do painel')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Carregando informações do painel..." className="py-20" />
  }

  const role = user?.role || 'student'

  // ----------------------------------------------------
  // ADMIN DASHBOARD
  // ----------------------------------------------------
  if (role === 'admin') {
    const adminData = data as AdminDashboard

    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Painel do Administrador
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {user?.name}!
            </h1>
            <p className="mt-1 text-sm sm:text-base text-indigo-100 max-w-2xl">
              Visão geral da instituição de ensino. Monitore turmas, alunos, professores e dados
              acadêmicos em tempo real.
            </p>
          </div>
          {/* Decorative background shape */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Metric Cards Grid */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Métricas do Sistema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total de Alunos"
              value={adminData?.total_students ?? 0}
              icon={<Users className="w-6 h-6" />}
              color="emerald"
              description="Estudantes cadastrados"
            />
            <StatCard
              title="Professores"
              value={adminData?.total_teachers ?? 0}
              icon={<GraduationCap className="w-6 h-6" />}
              color="blue"
              description="Docentes ativos"
            />
            <StatCard
              title="Turmas Ativas"
              value={adminData?.total_classes ?? 0}
              icon={<School className="w-6 h-6" />}
              color="indigo"
              description="Salas e turmas abertas"
            />
            <StatCard
              title="Disciplinas"
              value={adminData?.total_disciplines ?? 0}
              icon={<BookOpen className="w-6 h-6" />}
              color="purple"
              description="Matérias na grade curricular"
            />
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-4">Ações Rápidas de Gestão</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                    Gerenciar Usuários
                  </p>
                  <p className="text-xs text-slate-500">Alterar papéis e permissões</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/classes"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                    Turmas & Matrículas
                  </p>
                  <p className="text-xs text-slate-500">Criar turmas e matricular alunos</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/notices"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                    Mural de Avisos
                  </p>
                  <p className="text-xs text-slate-500">Publicar comunicado geral ou por turma</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // TEACHER DASHBOARD
  // ----------------------------------------------------
  if (role === 'teacher') {
    const teacherData = data as TeacherDashboard
    const classes = teacherData?.teaching_classes || []
    const events = teacherData?.upcoming_events || []

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            Espaço do Professor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bem-vindo(a), Prof. {user?.name}!
          </h1>
          <p className="mt-1 text-sm sm:text-base text-blue-100 max-w-2xl">
            Acompanhe suas turmas atribuídas, consulte listas de alunos e verifique o calendário de
            avaliações.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Minhas Turmas"
            value={classes.length}
            icon={<School className="w-6 h-6" />}
            color="blue"
            description="Turmas sob sua responsabilidade"
          />
          <StatCard
            title="Próximos Eventos"
            value={events.length}
            icon={<Calendar className="w-6 h-6" />}
            color="indigo"
            description="Provas e compromissos"
          />
          <StatCard
            title="Notificações Pendentes"
            value={teacherData?.unread_notifications || 0}
            icon={<Bell className="w-6 h-6" />}
            color="amber"
            description="Avisos e comunicados"
          />
        </div>

        {/* Classes List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Minhas Turmas Lecionadas</h2>
            <Link
              to="/classes"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {classes.length === 0 ? (
            <EmptyState
              title="Nenhuma turma atribuída"
              description="Você ainda não possui turmas atribuídas no momento. Solicite ao administrador da instituição."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <ClassCard key={cls.id} schoolClass={cls} teacherName={user?.name} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        {events.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Próximos Eventos & Provas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((evt) => (
                <CalendarEventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ----------------------------------------------------
  // STUDENT DASHBOARD
  // ----------------------------------------------------
  const studentData = data as StudentDashboard
  const enrolledClasses = studentData?.enrolled_classes || []
  const upcomingEvents = studentData?.upcoming_events || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          Área do Estudante
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Olá, {user?.name}!
        </h1>
        <p className="mt-1 text-sm sm:text-base text-emerald-100 max-w-2xl">
          Acompanhe suas matérias matriculadas, prazos de atividades, avaliações e boletim escolar.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Matrículas Ativas"
          value={enrolledClasses.length}
          icon={<School className="w-6 h-6" />}
          color="emerald"
          description="Disciplinas em andamento"
        />
        <StatCard
          title="Próximas Avaliações"
          value={upcomingEvents.length}
          icon={<Calendar className="w-6 h-6" />}
          color="indigo"
          description="Datas agendadas no calendário"
        />
        <StatCard
          title="Notificações"
          value={studentData?.unread_notifications || 0}
          icon={<Bell className="w-6 h-6" />}
          color="amber"
          description="Mensagens e avisos recentes"
        />
      </div>

      {/* Enrolled Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Minhas Turmas Matriculadas</h2>
          <Link
            to="/classes"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrolledClasses.length === 0 ? (
          <EmptyState
            title="Nenhuma matrícula ativa"
            description="Você ainda não foi matriculado em nenhuma turma. Entre em contato com a secretaria acadêmica."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledClasses.map((cls) => (
              <ClassCard key={cls.id} schoolClass={cls} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Próximos Eventos e Provas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((evt) => (
              <CalendarEventCard key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
