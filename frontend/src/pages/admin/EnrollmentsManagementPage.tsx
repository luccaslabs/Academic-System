import React, { useState, useEffect } from 'react'
import {
  Users,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { classesService } from '../../services/classes.service'
import { studentsService } from '../../services/students.service'
import { enrollmentsService } from '../../services/enrollments.service'
import type {
  SchoolClassResponse,
  SchoolClassDetailResponse,
  StudentResponse,
} from '../../types/api'
import { Button } from '../../components/common/Button'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'

export const EnrollmentsManagementPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  const [classes, setClasses] = useState<SchoolClassResponse[]>([])
  const [students, setStudents] = useState<StudentResponse[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classDetail, setClassDetail] = useState<SchoolClassDetailResponse | null>(null)
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Enroll Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isEnrolling, setIsEnrolling] = useState(false)

  // Delete / Unenroll Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToUnenroll, setStudentToUnenroll] = useState<StudentResponse | null>(null)
  const [isUnenrolling, setIsUnenrolling] = useState(false)

  const fetchInitialData = async () => {
    setIsLoadingClasses(true)
    try {
      const [classList, studentList] = await Promise.all([
        classesService.getClasses(),
        studentsService.getStudents().catch(() => []),
      ])
      setClasses(classList || [])
      setStudents(studentList || [])

      if (classList && classList.length > 0) {
        setSelectedClassId(classList[0].id)
      }
    } catch (err) {
      showError(err, 'Erro ao listar turmas e alunos')
    } finally {
      setIsLoadingClasses(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchClassDetail = async () => {
    if (!selectedClassId) {
      setClassDetail(null)
      return
    }

    setIsLoadingDetail(true)
    try {
      const detail = await classesService.getClass(selectedClassId)
      setClassDetail(detail)
    } catch (err) {
      showError(err, 'Erro ao carregar detalhes da turma selecionada')
      setClassDetail(null)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  useEffect(() => {
    fetchClassDetail()
  }, [selectedClassId])

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId || !selectedStudentId) {
      showError(null, 'Selecione a turma e o aluno.')
      return
    }

    setIsEnrolling(true)
    try {
      await enrollmentsService.createEnrollment({
        class_id: selectedClassId,
        student_id: selectedStudentId,
      })
      showSuccess('Aluno matriculado com sucesso nesta turma!')
      setIsModalOpen(false)
      setSelectedStudentId('')
      fetchClassDetail()
    } catch (err) {
      showError(err, 'Erro ao matricular aluno')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleUnenrollConfirm = async () => {
    if (!studentToUnenroll) return
    setIsUnenrolling(true)
    try {
      // DELETE /enrollments/:id
      await enrollmentsService.deleteEnrollment(studentToUnenroll.id)
      showSuccess('Matrícula removida com sucesso!')
      setIsDeleteDialogOpen(false)
      setStudentToUnenroll(null)
      fetchClassDetail()
    } catch (err) {
      showError(err, 'Erro ao desmatricular aluno')
    } finally {
      setIsUnenrolling(false)
    }
  }

  // Filter available students who are not yet enrolled in this class
  const enrolledStudentIds = new Set(classDetail?.students?.map((s) => s.id) || [])
  const availableStudents = students.filter((s) => !enrolledStudentIds.has(s.id))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Matrículas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Matricule alunos em turmas e gerencie o quadro discente de cada sala
          </p>
        </div>

        {selectedClassId && (
          <Button
            onClick={() => {
              setSelectedStudentId('')
              setIsModalOpen(true)
            }}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Matricular Aluno
          </Button>
        )}
      </div>

      {/* Class Selector Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <Select
          label="Selecione a Turma para Gerenciar Matrículas"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          options={[
            { value: '', label: 'Selecione uma turma' },
            ...classes.map((c) => ({
              value: c.id,
              label: `${c.name} (Ano: ${c.year})`,
            })),
          ]}
        />
      </div>

      {/* Content */}
      {isLoadingClasses || isLoadingDetail ? (
        <LoadingSpinner size="lg" text="Carregando matrículas..." className="py-16" />
      ) : !classDetail ? (
        <EmptyState
          title="Nenhuma turma selecionada"
          description="Selecione uma turma no menu acima para gerenciar os alunos matriculados."
        />
      ) : (
        <div className="space-y-6">
          {/* Class Summary Box */}
          <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary">Ano {classDetail.year}</Badge>
                {classDetail.discipline && (
                  <Badge variant="purple">{classDetail.discipline.name}</Badge>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{classDetail.name}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-400 font-medium">Total de Matriculados</p>
                <p className="text-xl font-bold text-slate-800">
                  {classDetail.students?.length || 0} alunos
                </p>
              </div>
            </div>
          </div>

          {/* Enrolled Students Table / Cards */}
          {classDetail.students?.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-400" />}
              title="Nenhum aluno matriculado nesta turma"
              description="Clique em 'Matricular Aluno' para adicionar estudantes."
              actionText="Matricular Aluno"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-hidden rounded-3xl bg-white shadow-xs border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-6">Nº de Matrícula</th>
                        <th className="py-3.5 px-6">Nome do Aluno</th>
                        <th className="py-3.5 px-6 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classDetail.students?.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">
                            {s.registration}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            {s.user?.name || `Estudante #${s.registration}`}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 hover:bg-rose-50 border-rose-200 min-h-[36px]"
                              onClick={() => {
                                setStudentToUnenroll(s)
                                setIsDeleteDialogOpen(true)
                              }}
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Desmatricular
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-3">
                {classDetail.students?.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {s.user?.name || 'Estudante'}
                      </p>
                      <p className="font-mono text-xs text-slate-500 mt-0.5">{s.registration}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 min-h-[40px]"
                      onClick={() => {
                        setStudentToUnenroll(s)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal: Enroll Student */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Matricular Aluno na Turma"
        description={`Selecione um estudante para matricular em ${classDetail?.name}.`}
        maxWidth="sm"
      >
        <form onSubmit={handleEnroll} className="space-y-4">
          <Select
            label="Estudante Cadastrado"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={[
              { value: '', label: 'Selecione o aluno' },
              ...availableStudents.map((s) => ({
                value: s.id,
                label: `Aluno: ${s.user?.name || s.registration} (Matrícula: ${s.registration})`,
              })),
            ]}
            required
          />

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isEnrolling}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isEnrolling} className="min-h-[44px]">
              Confirmar Matrícula
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Unenroll Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleUnenrollConfirm}
        title="Desmatricular Aluno"
        message={`Deseja realmente desmatricular o aluno com matrícula "${studentToUnenroll?.registration}" desta turma?`}
        confirmText="Sim, desmatricular"
        isLoading={isUnenrolling}
        variant="danger"
      />
    </div>
  )
}
