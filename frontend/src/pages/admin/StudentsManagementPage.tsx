import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { studentsService } from '../../services/students.service'
import { usersService } from '../../services/users.service'
import type { StudentResponse, UserResponse } from '../../types/api'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'

export const StudentsManagementPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  const [students, setStudents] = useState<StudentResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(null)
  const [formData, setFormData] = useState({ user_id: '', registration: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<StudentResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [studentsList, usersList] = await Promise.all([
        studentsService.getStudents(),
        usersService.getUsers().catch(() => []),
      ])
      setStudents(studentsList || [])
      setUsers(usersList || [])
    } catch (err) {
      showError(err, 'Erro ao listar alunos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingStudent(null)
    setFormData({ user_id: '', registration: '' })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (s: StudentResponse) => {
    setEditingStudent(s)
    setFormData({ user_id: s.user_id, registration: s.registration })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.registration.trim()) {
      showError(null, 'Preencha o número de matrícula do aluno.')
      return
    }

    if (!editingStudent && !formData.user_id) {
      showError(null, 'Selecione uma conta de usuário para vincular como aluno.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingStudent) {
        // PUT /students/:id
        await studentsService.updateStudent(editingStudent.id, {
          registration: formData.registration.trim(),
        })
        showSuccess('Matrícula do aluno atualizada!')
      } else {
        // POST /students
        await studentsService.createStudent({
          user_id: formData.user_id,
          registration: formData.registration.trim(),
        })
        showSuccess('Aluno cadastrado com sucesso!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao salvar registro de aluno')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return
    setIsDeleting(true)
    try {
      await studentsService.deleteStudent(studentToDelete.id)
      showSuccess('Registro de aluno excluído!')
      setIsDeleteDialogOpen(false)
      setStudentToDelete(null)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao excluir aluno')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered
  const filtered = students.filter((s) => {
    const matchedUser = users.find((u) => u.id === s.user_id)
    const nameMatch = matchedUser ? matchedUser.name.toLowerCase().includes(searchQuery.toLowerCase()) : false
    const regMatch = s.registration.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || regMatch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Alunos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre matrículas acadêmicas e associe contas de estudantes
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Cadastrar Aluno
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <Input
          placeholder="Pesquisar por matrícula ou nome do aluno..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Table / Mobile Cards */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando alunos..." className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-400" />}
          title="Nenhum aluno encontrado"
          description="Nenhum registro de estudante encontrado no sistema."
          actionText="Cadastrar Aluno"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-3xl bg-white shadow-xs border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Matrícula (Registro)</th>
                    <th className="py-3.5 px-6">Usuário Associado</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const linkedUser = users.find((u) => u.id === s.user_id)

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-semibold text-slate-900 font-mono text-xs">
                          {s.registration}
                        </td>
                        <td className="py-4 px-6">
                          {linkedUser ? (
                            <div>
                              <p className="font-semibold text-slate-800">{linkedUser.name}</p>
                              <p className="text-xs text-slate-400">{linkedUser.email}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Usuário associado</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(s)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Editar Matrícula"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStudentToDelete(s)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3">
            {filtered.map((s) => {
              const linkedUser = users.find((u) => u.id === s.user_id)

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {linkedUser ? linkedUser.name : 'Aluno'}
                      </p>
                      <p className="text-xs text-slate-500">{linkedUser?.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(s)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentToDelete(s)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Matrícula:</span>
                    <span className="font-mono font-bold text-slate-800">{s.registration}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal: Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Editar Matrícula do Aluno' : 'Cadastrar Novo Aluno'}
        description="Associe uma conta cadastrada ao registro estudantil oficial."
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editingStudent && (
            <Select
              label="Conta de Usuário"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione um usuário' },
                ...users.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.email}) - Papel: ${u.role}`,
                })),
              ]}
              required
            />
          )}

          <Input
            label="Número de Matrícula (Registro)"
            placeholder="Ex: ALU-2026-0089"
            value={formData.registration}
            onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
            required
          />

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
              {editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Registro de Aluno"
        message={`Deseja realmente remover a matrícula de estudante "${studentToDelete?.registration}"?`}
        confirmText="Sim, excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
