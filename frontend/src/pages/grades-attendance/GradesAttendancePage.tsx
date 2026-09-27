import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  CalendarCheck,
  Plus,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { classesService } from '../../services/classes.service'
import { gradesService } from '../../services/grades.service'
import { attendanceService } from '../../services/attendance.service'
import type {
  SchoolClassResponse,
  SchoolClassDetailResponse,
  GradeResponse,
  AttendanceResponse,
  EnrollmentAverageResponse,
} from '../../types/api'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'
import { StatCard } from '../../components/cards/StatCard'
import { formatDate } from '../../utils/formatters'

export const GradesAttendancePage: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const isAdmin = user?.role === 'admin'
  const isStudent = user?.role === 'student'

  const [classes, setClasses] = useState<SchoolClassResponse[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classDetail, setClassDetail] = useState<SchoolClassDetailResponse | null>(null)

  // Selected student / enrollment (For admin/teacher choosing which student to view)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('')

  // Grades & Attendance data
  const [grades, setGrades] = useState<GradeResponse[]>([])
  const [attendanceList, setAttendanceList] = useState<AttendanceResponse[]>([])
  const [averageData, setAverageData] = useState<EnrollmentAverageResponse | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'grades' | 'attendance'>('grades')

  // Create / Edit Grade Modal (Admin)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<GradeResponse | null>(null)
  const [gradeFormData, setGradeFormData] = useState({
    value: '',
    term: '1º Bimestre',
    description: '',
  })
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false)

  // Delete Grade Dialog
  const [isDeleteGradeOpen, setIsDeleteGradeOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState<GradeResponse | null>(null)
  const [isDeletingGrade, setIsDeletingGrade] = useState(false)

  // Create Attendance Modal (Admin)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [attendanceFormData, setAttendanceFormData] = useState({
    class_date: new Date().toISOString().split('T')[0],
    present: true,
  })
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false)

  // Initial classes load
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoadingClasses(true)
      try {
        const list = await classesService.getClasses()
        setClasses(list || [])
        if (list && list.length > 0) {
          setSelectedClassId(list[0].id)
        }
      } catch (err) {
        showError(err, 'Erro ao carregar turmas')
      } finally {
        setIsLoadingClasses(false)
      }
    }
    fetchClasses()
  }, [])

  // When class changes, load class detail
  useEffect(() => {
    const fetchClassDetail = async () => {
      if (!selectedClassId) {
        setClassDetail(null)
        return
      }

      try {
        const detail = await classesService.getClass(selectedClassId)
        setClassDetail(detail)

        // If student, find their enrollment or use default
        if (detail.students && detail.students.length > 0) {
          setSelectedEnrollmentId(detail.students[0].id)
        } else {
          setSelectedEnrollmentId('')
        }
      } catch (err) {
        showError(err, 'Erro ao carregar alunos da turma')
        setClassDetail(null)
      }
    }

    fetchClassDetail()
  }, [selectedClassId])

  // When enrollment changes, load grades, attendance and average
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!selectedEnrollmentId) {
        setGrades([])
        setAttendanceList([])
        setAverageData(null)
        return
      }

      setIsLoadingData(true)
      try {
        const [gradesRes, attendanceRes, avgRes] = await Promise.all([
          gradesService.getGradesByEnrollment(selectedEnrollmentId).catch(() => []),
          attendanceService.getAttendanceByEnrollment(selectedEnrollmentId).catch(() => []),
          gradesService.getAverageByEnrollment(selectedEnrollmentId).catch(() => null),
        ])
        setGrades(gradesRes || [])
        setAttendanceList(attendanceRes || [])
        setAverageData(avgRes)
      } catch (err) {
        showError(err, 'Erro ao carregar notas e frequência')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchEnrollmentData()
  }, [selectedEnrollmentId])

  // Grade handlers
  const handleOpenCreateGrade = () => {
    setEditingGrade(null)
    setGradeFormData({ value: '', term: '1º Bimestre', description: '' })
    setIsGradeModalOpen(true)
  }

  const handleOpenEditGrade = (g: GradeResponse) => {
    setEditingGrade(g)
    setGradeFormData({
      value: String(g.value),
      term: g.term,
      description: g.description || '',
    })
    setIsGradeModalOpen(true)
  }

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(gradeFormData.value)
    if (isNaN(val) || val < 0 || val > 10) {
      showError(null, 'A nota deve ser um valor numérico entre 0 e 10.')
      return
    }

    setIsSubmittingGrade(true)
    try {
      if (editingGrade) {
        await gradesService.updateGrade(editingGrade.id, {
          value: val,
          description: gradeFormData.description.trim() || null,
        })
        showSuccess('Nota atualizada com sucesso!')
      } else {
        await gradesService.createGrade({
          enrollment_id: selectedEnrollmentId,
          value: val,
          term: gradeFormData.term,
          description: gradeFormData.description.trim() || null,
        })
        showSuccess('Nota lançada com sucesso!')
      }
      setIsGradeModalOpen(false)
      // Reload
      const [gradesRes, avgRes] = await Promise.all([
        gradesService.getGradesByEnrollment(selectedEnrollmentId),
        gradesService.getAverageByEnrollment(selectedEnrollmentId).catch(() => null),
      ])
      setGrades(gradesRes || [])
      setAverageData(avgRes)
    } catch (err) {
      showError(err, 'Erro ao salvar nota')
    } finally {
      setIsSubmittingGrade(false)
    }
  }

  const handleDeleteGradeConfirm = async () => {
    if (!gradeToDelete) return
    setIsDeletingGrade(true)
    try {
      await gradesService.deleteGrade(gradeToDelete.id)
      showSuccess('Nota removida com sucesso!')
      setIsDeleteGradeOpen(false)
      setGradeToDelete(null)
      const [gradesRes, avgRes] = await Promise.all([
        gradesService.getGradesByEnrollment(selectedEnrollmentId),
        gradesService.getAverageByEnrollment(selectedEnrollmentId).catch(() => null),
      ])
      setGrades(gradesRes || [])
      setAverageData(avgRes)
    } catch (err) {
      showError(err, 'Erro ao excluir nota')
    } finally {
      setIsDeletingGrade(false)
    }
  }

  // Attendance handlers
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceFormData.class_date) {
      showError(null, 'Selecione a data da aula.')
      return
    }

    setIsSubmittingAttendance(true)
    try {
      await attendanceService.createAttendance({
        enrollment_id: selectedEnrollmentId,
        class_date: attendanceFormData.class_date,
        present: attendanceFormData.present,
      })
      showSuccess('Presença registrada com sucesso!')
      setIsAttendanceModalOpen(false)
      const list = await attendanceService.getAttendanceByEnrollment(selectedEnrollmentId)
      setAttendanceList(list || [])
    } catch (err) {
      showError(err, 'Erro ao registrar presença')
    } finally {
      setIsSubmittingAttendance(false)
    }
  }

  // Calculations
  const calculatedAverage =
    averageData?.average !== undefined && averageData?.average !== null
      ? averageData.average
      : grades.length > 0
      ? grades.reduce((acc, curr) => acc + curr.value, 0) / grades.length
      : null

  const totalClassesCount = attendanceList.length
  const presenceCount = attendanceList.filter((a) => a.present).length
  const absenceCount = totalClassesCount - presenceCount
  const attendanceRate =
    totalClassesCount > 0 ? (presenceCount / totalClassesCount) * 100 : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notas & Frequência
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe o rendimento acadêmico, boletim e assiduidade escolar
          </p>
        </div>

        {isAdmin && selectedEnrollmentId && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAttendanceModalOpen(true)}
              leftIcon={<CalendarCheck className="w-4 h-4" />}
              className="min-h-[44px]"
            >
              Lançar Presença
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreateGrade}
              leftIcon={<Plus className="w-4 h-4" />}
              className="min-h-[44px]"
            >
              Lançar Nota
            </Button>
          </div>
        )}
      </div>

      {/* Class & Student Selection Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="w-full sm:flex-1">
          <Select
            label="Turma Selecionada"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={[
              { value: '', label: 'Selecione uma turma' },
              ...classes.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.year})`,
              })),
            ]}
          />
        </div>

        {!isStudent && classDetail?.students && classDetail.students.length > 0 && (
          <div className="w-full sm:flex-1">
            <Select
              label="Aluno / Matrícula"
              value={selectedEnrollmentId}
              onChange={(e) => setSelectedEnrollmentId(e.target.value)}
              options={classDetail.students.map((s) => ({
                value: s.id,
                label: `${s.user?.name || 'Estudante'} (Matrícula: ${s.registration})`,
              }))}
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Média Atual"
          value={calculatedAverage !== null ? calculatedAverage.toFixed(1) : '—'}
          description={
            averageData?.passing_average
              ? `Mínima da turma: ${averageData.passing_average.toFixed(1)}`
              : 'Sem notas cadastradas'
          }
          icon={<Award className="w-6 h-6" />}
          color="blue"
        />

        <StatCard
          title="Frequência Total"
          value={attendanceRate !== null ? `${attendanceRate.toFixed(0)}%` : '—'}
          description={
            totalClassesCount > 0
              ? `${presenceCount} presenças em ${totalClassesCount} aulas`
              : 'Sem registros de aula'
          }
          icon={<CalendarCheck className="w-6 h-6" />}
          color={attendanceRate !== null && attendanceRate >= 75 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Total de Faltas"
          value={totalClassesCount > 0 ? `${absenceCount}` : '—'}
          description="Aulas não comparecidas"
          icon={<XCircle className="w-6 h-6" />}
          color={absenceCount > 5 ? 'rose' : 'purple'}
        />

        <StatCard
          title="Total de Avaliações"
          value={`${grades.length}`}
          description="Notas lançadas no período"
          icon={<GraduationCap className="w-6 h-6" />}
          color="indigo"
        />
      </div>

      {/* EXAM RISK ALERT BANNER (When below_average is true and average !== null) */}
      {averageData?.below_average && calculatedAverage !== null && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-200/80 shadow-xs flex items-start gap-3.5 text-amber-900 animate-in fade-in duration-200">
          <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm sm:text-base leading-tight text-amber-950">
              Atenção: Risco de Exame Final
            </h4>
            <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
              Sua média atual ({calculatedAverage.toFixed(1)}) está abaixo da média mínima da turma (
              {averageData.passing_average.toFixed(1)}) para dispensa do exame. Procure o professor da
              disciplina ou realize as atividades complementares para recuperação de nota.
            </p>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 py-3 border-b-2 text-sm font-bold transition cursor-pointer min-h-[44px] ${
            activeTab === 'grades'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Boletim de Notas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 py-3 border-b-2 text-sm font-bold transition cursor-pointer min-h-[44px] ${
            activeTab === 'attendance'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Registro de Frequência</span>
        </button>
      </div>

      {/* Tab Content */}
      {isLoadingClasses || isLoadingData ? (
        <LoadingSpinner size="lg" text="Carregando dados acadêmicos..." className="py-16" />
      ) : activeTab === 'grades' ? (
        /* GRADES LIST */
        grades.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="w-8 h-8 text-slate-400" />}
            title="Nenhuma nota lançada"
            description="Não há notas ou avaliações cadastradas para o período selecionado."
            actionText={isAdmin ? 'Lançar Nota' : undefined}
            onAction={isAdmin ? handleOpenCreateGrade : undefined}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-hidden rounded-3xl bg-white shadow-xs border border-slate-100">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Etapa / Bimestre</th>
                    <th className="py-3.5 px-6">Descrição da Avaliação</th>
                    <th className="py-3.5 px-6">Data de Lançamento</th>
                    <th className="py-3.5 px-6 text-center">Nota</th>
                    {isAdmin && <th className="py-3.5 px-6 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-semibold text-slate-900">{grade.term}</td>
                      <td className="py-4 px-6 text-slate-600">
                        {grade.description || 'Avaliação Bimestral'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {formatDate(grade.created_at)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-xl text-sm ${
                            grade.value >= 6.0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {grade.value.toFixed(1)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGrade(grade)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="Editar Nota"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGradeToDelete(grade)
                                setIsDeleteGradeOpen(true)
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Excluir Nota"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
              {grades.map((grade) => (
                <div
                  key={grade.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{grade.term}</span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-lg text-xs ${
                        grade.value >= 6.0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Nota: {grade.value.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {grade.description || 'Avaliação Bimestral'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                    <span>{formatDate(grade.created_at)}</span>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditGrade(grade)}
                          className="text-slate-600 hover:text-slate-900 font-semibold text-xs"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGradeToDelete(grade)
                            setIsDeleteGradeOpen(true)
                          }}
                          className="text-rose-600 hover:text-rose-800 font-semibold text-xs"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        /* ATTENDANCE LIST */
        attendanceList.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8 text-slate-400" />}
            title="Nenhuma chamada realizada"
            description="Não há registros de presença cadastrados para esta turma."
            actionText={isAdmin ? 'Lançar Presença' : undefined}
            onAction={isAdmin ? () => setIsAttendanceModalOpen(true) : undefined}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-hidden rounded-3xl bg-white shadow-xs border border-slate-100">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Data da Aula</th>
                    <th className="py-3.5 px-6">Status de Frequência</th>
                    <th className="py-3.5 px-6 text-right">Data de Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {formatDate(item.class_date)}
                      </td>
                      <td className="py-4 px-6">
                        {item.present ? (
                          <Badge variant="success">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                            Presente
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <XCircle className="w-3.5 h-3.5 mr-1 inline" />
                            Falta
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 text-right">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
              {attendanceList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{formatDate(item.class_date)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Registrado em {formatDate(item.created_at)}</p>
                  </div>
                  <div>
                    {item.present ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                        Presente
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <XCircle className="w-3.5 h-3.5 mr-1 inline" />
                        Falta
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* Modal: Create / Edit Grade */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={editingGrade ? 'Editar Nota do Aluno' : 'Lançar Nota de Avaliação'}
        description="Informe o valor da nota e o período letivo correspondente."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveGrade} className="space-y-4">
          <Input
            label="Valor da Nota (0.0 a 10.0)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="Ex: 8.5"
            value={gradeFormData.value}
            onChange={(e) => setGradeFormData({ ...gradeFormData, value: e.target.value })}
            required
          />

          {!editingGrade && (
            <Select
              label="Etapa / Bimestre"
              value={gradeFormData.term}
              onChange={(e) => setGradeFormData({ ...gradeFormData, term: e.target.value })}
              options={[
                { value: '1º Bimestre', label: '1º Bimestre' },
                { value: '2º Bimestre', label: '2º Bimestre' },
                { value: '3º Bimestre', label: '3º Bimestre' },
                { value: '4º Bimestre', label: '4º Bimestre' },
                { value: 'Exame Final', label: 'Exame Final' },
              ]}
              required
            />
          )}

          <Input
            label="Descrição da Avaliação (Opcional)"
            placeholder="Ex: Prova Mensal, Trabalho em Grupo"
            value={gradeFormData.description}
            onChange={(e) => setGradeFormData({ ...gradeFormData, description: e.target.value })}
          />

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGradeModalOpen(false)}
              disabled={isSubmittingGrade}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmittingGrade} className="min-h-[44px]">
              {editingGrade ? 'Salvar Alterações' : 'Lançar Nota'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Attendance */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Lançar Registro de Presença"
        description="Defina a data da aula e o status de comparecimento do estudante."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          <Input
            label="Data da Aula"
            type="date"
            value={attendanceFormData.class_date}
            onChange={(e) =>
              setAttendanceFormData({ ...attendanceFormData, class_date: e.target.value })
            }
            required
          />

          <Select
            label="Situação de Comparecimento"
            value={attendanceFormData.present ? 'true' : 'false'}
            onChange={(e) =>
              setAttendanceFormData({
                ...attendanceFormData,
                present: e.target.value === 'true',
              })
            }
            options={[
              { value: 'true', label: 'Presente (Compareceu)' },
              { value: 'false', label: 'Falta (Ausente)' },
            ]}
            required
          />

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAttendanceModalOpen(false)}
              disabled={isSubmittingAttendance}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmittingAttendance} className="min-h-[44px]">
              Confirmar Presença
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteGradeOpen}
        onClose={() => setIsDeleteGradeOpen(false)}
        onConfirm={handleDeleteGradeConfirm}
        title="Excluir Nota"
        message="Tem certeza que deseja remover este lançamento de nota?"
        confirmText="Sim, excluir"
        isLoading={isDeletingGrade}
        variant="danger"
      />
    </div>
  )
}
