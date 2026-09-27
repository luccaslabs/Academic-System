import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { usersService } from '../../services/users.service'
import type { UserResponse, UserRole } from '../../types/api'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { formatRole, getRoleBadgeClass } from '../../utils/formatters'

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const { showSuccess, showError } = useToast()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  // Edit Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<UserResponse | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('student')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const list = await usersService.getUsers()
      setUsers(list || [])
    } catch (err) {
      showError(err, 'Erro ao listar usuários')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenRoleModal = (u: UserResponse) => {
    if (u.id === currentUser?.id) {
      showError(null, 'Você não pode alterar o papel da sua própria conta de administrador.')
      return
    }
    setTargetUser(u)
    setNewRole(u.role)
    setIsRoleModalOpen(true)
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUser) return

    setIsUpdatingRole(true)
    try {
      await usersService.updateUserRole(targetUser.id, newRole)
      showSuccess(`Papel de ${targetUser.name} atualizado para ${formatRole(newRole)}!`)
      setIsRoleModalOpen(false)
      fetchUsers()
    } catch (err) {
      showError(err, 'Erro ao atualizar papel do usuário')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleOpenDeleteDialog = (u: UserResponse) => {
    if (u.id === currentUser?.id) {
      showError(null, 'Você não pode excluir sua própria conta de administrador.')
      return
    }
    setUserToDelete(u)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await usersService.deleteUser(userToDelete.id)
      showSuccess(`Usuário ${userToDelete.name} excluído com sucesso!`)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (err) {
      showError(err, 'Erro ao excluir usuário')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter ? u.role === roleFilter : true
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Gestão de Usuários
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Administre contas cadastradas, altere permissões de acesso e papéis
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os Papéis' },
              { value: 'admin', label: 'Administrador (admin)' },
              { value: 'teacher', label: 'Professor (teacher)' },
              { value: 'student', label: 'Aluno (student)' },
            ]}
          />
        </div>
      </div>

      {/* Users Table / Mobile Cards */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando lista de usuários..." className="py-16" />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-400" />}
          title="Nenhum usuário encontrado"
          description="Nenhuma conta corresponde aos filtros pesquisados."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-3xl bg-white shadow-xs border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Nome Completo</th>
                    <th className="py-3.5 px-6">E-mail</th>
                    <th className="py-3.5 px-6">Papel de Acesso</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 font-bold">
                                Você
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600">{u.email}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getRoleBadgeClass(
                              u.role
                            )}`}
                          >
                            {formatRole(u.role)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenRoleModal(u)}
                              disabled={isSelf}
                              title={isSelf ? 'Não é possível alterar seu próprio papel' : 'Alterar Papel'}
                            >
                              Alterar Papel
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteDialog(u)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed text-slate-300'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isSelf ? 'Não é possível excluir sua própria conta' : 'Excluir Usuário'}
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
            {filteredUsers.map((u) => {
              const isSelf = u.id === currentUser?.id

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 font-bold">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 break-all">{u.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${getRoleBadgeClass(
                        u.role
                      )}`}
                    >
                      {formatRole(u.role)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenRoleModal(u)}
                      disabled={isSelf}
                      className="text-xs min-h-[40px]"
                    >
                      Alterar Papel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDeleteDialog(u)}
                      disabled={isSelf}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 min-h-[40px]"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal: Change User Role */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Alterar Papel de Acesso"
        description={`Modifique a função de ${targetUser?.name} no sistema.`}
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <Select
            label="Novo Papel (Role)"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            options={[
              { value: 'student', label: 'Aluno (student)' },
              { value: 'teacher', label: 'Professor (teacher)' },
              { value: 'admin', label: 'Administrador (admin)' },
            ]}
            required
          />

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
            <strong>Atenção:</strong> Ao alterar para Administrador, o usuário terá acesso total a
            todas as configurações do sistema.
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoleModalOpen(false)}
              disabled={isUpdatingRole}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isUpdatingRole} className="min-h-[44px]">
              Salvar Papel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir permanentemente o usuário "${userToDelete?.name}" (${userToDelete?.email})?`}
        confirmText="Sim, excluir conta"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
