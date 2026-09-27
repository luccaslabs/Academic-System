import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, UserCheck } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { teachersService } from '../../services/teachers.service'
import { usersService } from '../../services/users.service'
import type { TeacherResponse, UserResponse } from '../../types/api'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'

export const TeachersManagementPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  const [teachers, setTeachers] = useState<TeacherResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(null)
  const [formData, setFormData] = useState({ user_id: '', registration: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [teachersList, usersList] = await Promise.all([
        teachersService.getTeachers(),
        usersService.getUsers().catch(() => []),
      ])
      setTeachers(teachersList || [])
      setUsers(usersList || [])
    } catch (err) {
      showError(err, 'Erro ao listar professores')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingTeacher(null)
    setFormData({ user_id: '', registration: '' })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (t: TeacherResponse) => {
    setEditingTeacher(t)
    setFormData({ user_id: t.user_id, registration: t.registration })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.registration.trim()) {
      showError(null, 'Preencha o número de registro/matrícula.')
      return
    }

    if (!editingTeacher && !formData.user_id) {
      showError(null, 'Selecione uma conta de usuário para vincular como professor.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingTeacher) {
        // PUT /teachers/:id
        await teachersService.updateTeacher(editingTeacher.id, {
          registration: formData.registration.trim(),
        })
        showSuccess('Registro do professor atualizado!')
      } else {
        // POST /teachers
        await teachersService.createTeacher({
          user_id: formData.user_id,
          registration: formData.registration.trim(),
        })
        showSuccess('Professor cadastrado com sucesso!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao salvar registro de professor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!teacherToDelete) return
    setIsDeleting(true)
    try {
      await teachersService.deleteTeacher(teacherToDelete.id)
      showSuccess('Registro de professor excluído!')
      setIsDeleteDialogOpen(false)
      setTeacherToDelete(null)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao excluir professor')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered
  const filtered = teachers.filter((t) => {
    const matchedUser = users.find((u) => u.id === t.user_id)
    const nameMatch = matchedUser ? matchedUser.name.toLowerCase().includes(searchQuery.toLowerCase()) : false
    const regMatch = t.registration.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || regMatch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Professores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vincule contas de usuários a registros docentes oficiais
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Cadastrar Professor
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <Input
          placeholder="Pesquisar por matrícula ou nome do docente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Table / Mobile Cards */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando professores..." className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="w-8 h-8 text-slate-400" />}
          title="Nenhum professor encontrado"
          description="Nenhum registro de docente cadastrado."
          actionText="Cadastrar Docente"
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
                    <th className="py-3.5 px-6">Nº de Matrícula</th>
                    <th className="py-3.5 px-6">Usuário Vinculado</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => {
                    const linkedUser = users.find((u) => u.id === t.user_id)

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {t.registration}
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
                              onClick={() => handleOpenEditModal(t)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Editar Matrícula"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTeacherToDelete(t)
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
            {filtered.map((t) => {
              const linkedUser = users.find((u) => u.id === t.user_id)

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {linkedUser ? linkedUser.name : 'Professor'}
                      </p>
                      <p className="text-xs text-slate-500">{linkedUser?.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(t)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherToDelete(t)
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
                    <span className="font-mono font-bold text-slate-800">{t.registration}</span>
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
        title={editingTeacher ? 'Editar Registro do Professor' : 'Cadastrar Novo Professor'}
        description="Associe uma conta de usuário a um registro funcional docente."
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editingTeacher && (
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
            label="Matrícula / Registro Docente"
            placeholder="Ex: PROF-2026-001"
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
              {editingTeacher ? 'Salvar Alterações' : 'Cadastrar Docente'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Registro de Professor"
        message={`Deseja realmente remover o registro funcional de matrícula "${teacherToDelete?.registration}"?`}
        confirmText="Sim, excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
