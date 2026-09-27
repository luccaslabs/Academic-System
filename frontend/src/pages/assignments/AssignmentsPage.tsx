import React, { useState, useEffect } from 'react'
import {
  FileCheck2,
  Plus,
  Search,
  Calendar,
  Send,
  ExternalLink,
  Users,
  Edit2,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { assignmentsService } from '../../services/assignments.service'
import { classesService } from '../../services/classes.service'
import type {
  AssignmentResponse,
  SubmissionResponse,
  SchoolClassResponse,
} from '../../types/api'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'
import { formatDateTime } from '../../utils/formatters'

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const isAdmin = user?.role === 'admin'
  const isStudent = user?.role === 'student'

  const [assignments, setAssignments] = useState<AssignmentResponse[]>([])
  const [classes, setClasses] = useState<SchoolClassResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')

  // Create / Edit Modal (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentResponse | null>(null)
  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    description: '',
    due_date: '',
    accepts_submissions: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Student Submission Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [targetAssignment, setTargetAssignment] = useState<AssignmentResponse | null>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [isSubmittingWork, setIsSubmittingWork] = useState(false)

  // Admin View Submissions Modal
  const [isViewSubmissionsOpen, setIsViewSubmissionsOpen] = useState(false)
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentResponse | null>(null)
  const [submissionsList, setSubmissionsList] = useState<SubmissionResponse[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [assignData, classesData] = await Promise.all([
        assignmentsService.getAssignments(),
        classesService.getClasses().catch(() => []),
      ])
      setAssignments(assignData || [])
      setClasses(classesData || [])
    } catch (err) {
      showError(err, 'Erro ao carregar atividades')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Admin handlers
  const handleOpenCreateModal = () => {
    setEditingAssignment(null)
    setFormData({
      class_id: classes.length > 0 ? classes[0].id : '',
      title: '',
      description: '',
      due_date: '',
      accepts_submissions: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (a: AssignmentResponse) => {
    setEditingAssignment(a)
    setFormData({
      class_id: a.class_id,
      title: a.title,
      description: a.description || '',
      due_date: a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : '',
      accepts_submissions: a.accepts_submissions,
    })
    setIsModalOpen(true)
  }

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.due_date) {
      showError(null, 'Preencha o título e o prazo de entrega.')
      return
    }

    if (!editingAssignment && !formData.class_id) {
      showError(null, 'Selecione uma turma para a atividade.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingAssignment) {
        // PUT /assignments/:id
        await assignmentsService.updateAssignment(editingAssignment.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: new Date(formData.due_date).toISOString(),
          accepts_submissions: formData.accepts_submissions,
        })
        showSuccess('Atividade atualizada com sucesso!')
      } else {
        // POST /assignments
        await assignmentsService.createAssignment({
          class_id: formData.class_id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: new Date(formData.due_date).toISOString(),
          accepts_submissions: formData.accepts_submissions,
        })
        showSuccess('Atividade cadastrada com sucesso!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao salvar atividade')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return
    setIsDeleting(true)
    try {
      await assignmentsService.deleteAssignment(assignmentToDelete.id)
      showSuccess('Atividade excluída com sucesso!')
      setIsDeleteDialogOpen(false)
      setAssignmentToDelete(null)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao excluir atividade')
    } finally {
      setIsDeleting(false)
    }
  }

  // Student submission handler
  const handleOpenSubmitModal = (a: AssignmentResponse) => {
    setTargetAssignment(a)
    setSubmissionContent('')
    setIsSubmitModalOpen(true)
  }

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetAssignment) return
    if (!submissionContent.trim()) {
      showError(null, 'Por favor, insira o link ou conteúdo da sua entrega.')
      return
    }

    setIsSubmittingWork(true)
    try {
      await assignmentsService.submitAssignment(targetAssignment.id, {
        content: submissionContent.trim(),
      })
      showSuccess('Atividade entregue com sucesso!')
      setIsSubmitModalOpen(false)
      setSubmissionContent('')
    } catch (err) {
      showError(err, 'Falha ao enviar entrega')
    } finally {
      setIsSubmittingWork(false)
    }
  }

  // Admin view submissions
  const handleOpenSubmissions = async (a: AssignmentResponse) => {
    setViewingAssignment(a)
    setIsViewSubmissionsOpen(true)
    setIsLoadingSubmissions(true)
    try {
      const list = await assignmentsService.getSubmissions(a.id)
      setSubmissionsList(list || [])
    } catch (err) {
      showError(err, 'Erro ao carregar entregas dos alunos')
      setSubmissionsList([])
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  // Filters
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesClass = selectedClassId ? a.class_id === selectedClassId : true

    const isPastDue = new Date(a.due_date).getTime() < Date.now()
    const isOpen = a.accepts_submissions && !isPastDue

    let matchesStatus = true
    if (statusFilter === 'open') matchesStatus = isOpen
    if (statusFilter === 'closed') matchesStatus = !isOpen

    return matchesSearch && matchesClass && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Atividades & Entregas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Trabalhos escolares, prazos de submissão e acompanhamento de entregas
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            size="md"
            className="w-full sm:w-auto min-h-[44px]"
          >
            Nova Atividade
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Pesquisar por título ou instruções..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={[
              { value: '', label: 'Todas as Turmas' },
              ...classes.map((c) => ({
                value: c.id,
                label: `Turma: ${c.name}`,
              })),
            ]}
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 min-h-[38px] flex items-center justify-center ${
              statusFilter === 'all'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 min-h-[38px] flex items-center justify-center ${
              statusFilter === 'open'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Abertas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 min-h-[38px] flex items-center justify-center ${
              statusFilter === 'closed'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Encerradas
          </button>
        </div>
      </div>

      {/* Grid of Assignments */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando atividades..." className="py-16" />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="w-8 h-8 text-slate-400" />}
          title="Nenhuma atividade encontrada"
          description={
            searchQuery || selectedClassId || statusFilter !== 'all'
              ? 'Nenhuma atividade corresponde aos critérios filtrados.'
              : 'Não há trabalhos ou atividades cadastradas no momento.'
          }
          actionText={isAdmin ? 'Cadastrar Atividade' : undefined}
          onAction={isAdmin ? handleOpenCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAssignments.map((a) => {
            const classObj = classes.find((c) => c.id === a.class_id)
            const isPastDue = new Date(a.due_date).getTime() < Date.now()
            const canSubmit = a.accepts_submissions && !isPastDue

            return (
              <div
                key={a.id}
                className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-xs border border-slate-100 transition hover:shadow-md"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={canSubmit ? 'success' : 'danger'}>
                        {canSubmit ? 'Aberta para envio' : 'Prazo encerrado'}
                      </Badge>
                      {classObj && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {classObj.name}
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(a)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignmentToDelete(a)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">{a.title}</h3>

                  {/* Description */}
                  {a.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {a.description}
                    </p>
                  )}
                </div>

                {/* Footer Info & Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      Prazo:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatDateTime(a.due_date)}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full min-h-[40px]"
                        onClick={() => handleOpenSubmissions(a)}
                        leftIcon={<Users className="w-3.5 h-3.5" />}
                      >
                        Ver Entregas
                      </Button>
                    )}

                    {isStudent && (
                      <Button
                        size="sm"
                        variant={canSubmit ? 'primary' : 'secondary'}
                        className="w-full min-h-[40px]"
                        onClick={() => handleOpenSubmitModal(a)}
                        disabled={!canSubmit}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        {canSubmit ? 'Entregar Atividade' : 'Envio Indisponível'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Create / Edit Assignment (Admin) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? 'Editar Atividade' : 'Criar Nova Atividade'}
        description="Configure o título, instruções, prazo e permissão de envio para a turma."
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <Input
            label="Título da Atividade"
            placeholder="Ex: Trabalho de Pesquisa - História Contemporânea"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          {!editingAssignment && (
            <Select
              label="Turma Destinatária"
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione a turma' },
                ...classes.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.year})`,
                })),
              ]}
              required
            />
          )}

          <Input
            label="Data e Hora Limite de Entrega"
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Instruções / Enunciado
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[100px]"
              placeholder="Descreva detalhadamente o que os alunos devem produzir e enviar..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="accepts_sub"
              checked={formData.accepts_submissions}
              onChange={(e) =>
                setFormData({ ...formData, accepts_submissions: e.target.checked })
              }
              className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <label htmlFor="accepts_sub" className="text-sm font-medium text-slate-700">
              Permitir que os alunos façam envios nesta atividade
            </label>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="min-h-[44px]">
              {editingAssignment ? 'Salvar Alterações' : 'Criar Atividade'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Student Submission */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={`Enviar: ${targetAssignment?.title}`}
        description="Cole o link externo do seu documento ou insira a resposta em texto."
      >
        <form onSubmit={handleSubmitWork} className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">Instruções do Trabalho:</p>
            <p className="whitespace-pre-line">{targetAssignment?.description || 'Sem descrição.'}</p>
            <p className="mt-2 font-semibold text-brand-600">
              Prazo limite: {formatDateTime(targetAssignment?.due_date)}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Conteúdo da Entrega (URL ou Resposta)
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[100px]"
              placeholder="https://drive.google.com/... ou https://github.com/..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmittingWork}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmittingWork}
              rightIcon={<Send className="w-4 h-4" />}
              className="min-h-[44px]"
            >
              Confirmar Envio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Admin View Submissions */}
      <Modal
        isOpen={isViewSubmissionsOpen}
        onClose={() => setIsViewSubmissionsOpen(false)}
        title={`Entregas: ${viewingAssignment?.title}`}
        description={`Lista de trabalhos enviados pelos estudantes para esta atividade.`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {isLoadingSubmissions ? (
            <LoadingSpinner size="md" text="Carregando entregas..." className="py-8" />
          ) : submissionsList.length === 0 ? (
            <EmptyState
              title="Nenhuma entrega registrada"
              description="Nenhum estudante enviou trabalho para esta atividade até o momento."
            />
          ) : (
            <>
              {/* Desktop Submissions Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Aluno</th>
                      <th className="py-3 px-4">Data da Entrega</th>
                      <th className="py-3 px-4">Conteúdo / Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissionsList.map((sub) => {
                      const isUrl =
                        sub.content.startsWith('http://') || sub.content.startsWith('https://')

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono text-xs">
                            Aluno #{sub.student_id.slice(0, 8)}...
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {formatDateTime(sub.submitted_at)}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate">
                            {isUrl ? (
                              <a
                                href={sub.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-600 hover:underline inline-flex items-center gap-1"
                              >
                                <span className="truncate">{sub.content}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-800">{sub.content}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Submissions Cards */}
              <div className="sm:hidden space-y-2.5">
                {submissionsList.map((sub) => {
                  const isUrl =
                    sub.content.startsWith('http://') || sub.content.startsWith('https://')

                  return (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          Aluno #{sub.student_id.slice(0, 8)}...
                        </span>
                        <span className="text-slate-400">{formatDateTime(sub.submitted_at)}</span>
                      </div>
                      <div className="pt-1">
                        {isUrl ? (
                          <a
                            href={sub.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span className="truncate max-w-[200px]">{sub.content}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-700">{sub.content}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsViewSubmissionsOpen(false)}
              className="min-h-[40px]"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Atividade"
        message={`Tem certeza que deseja excluir a atividade "${assignmentToDelete?.title}"?`}
        confirmText="Sim, excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
