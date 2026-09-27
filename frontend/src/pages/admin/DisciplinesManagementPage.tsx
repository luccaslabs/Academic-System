import React, { useState, useEffect } from 'react'
import { BookOpen, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { disciplinesService } from '../../services/disciplines.service'
import type { DisciplineResponse } from '../../types/api'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'

export const DisciplinesManagementPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  const [disciplines, setDisciplines] = useState<DisciplineResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDiscipline, setEditingDiscipline] = useState<DisciplineResponse | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [disciplineToDelete, setDisciplineToDelete] = useState<DisciplineResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchDisciplines = async () => {
    setIsLoading(true)
    try {
      const list = await disciplinesService.getDisciplines()
      setDisciplines(list || [])
    } catch (err) {
      showError(err, 'Erro ao listar disciplinas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDisciplines()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingDiscipline(null)
    setFormData({ name: '', code: '' })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (d: DisciplineResponse) => {
    setEditingDiscipline(d)
    setFormData({ name: d.name, code: d.code })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) {
      showError(null, 'Preencha o nome e o código da disciplina.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingDiscipline) {
        // PUT /disciplines/:id
        await disciplinesService.updateDiscipline(editingDiscipline.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
        })
        showSuccess('Disciplina atualizada com sucesso!')
      } else {
        // POST /disciplines
        await disciplinesService.createDiscipline({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
        })
        showSuccess('Disciplina criada com sucesso!')
      }
      setIsModalOpen(false)
      fetchDisciplines()
    } catch (err) {
      showError(err, 'Erro ao salvar disciplina')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!disciplineToDelete) return
    setIsDeleting(true)
    try {
      await disciplinesService.deleteDiscipline(disciplineToDelete.id)
      showSuccess('Disciplina excluída com sucesso!')
      setIsDeleteDialogOpen(false)
      setDisciplineToDelete(null)
      fetchDisciplines()
    } catch (err) {
      showError(err, 'Erro ao excluir disciplina')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered
  const filtered = disciplines.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Disciplinas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre matérias e componentes curriculares da instituição
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Nova Disciplina
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <Input
          placeholder="Pesquisar por nome ou código da matéria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Table / Mobile Cards */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando disciplinas..." className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title="Nenhuma disciplina encontrada"
          description="Nenhum registro corresponde à sua busca."
          actionText="Cadastrar Disciplina"
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
                    <th className="py-3.5 px-6">Código</th>
                    <th className="py-3.5 px-6">Nome da Matéria</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {d.code}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">{d.name}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(d)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDisciplineToDelete(d)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {d.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(d)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisciplineToDelete(d)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="font-bold text-slate-900 text-sm">{d.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal: Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscipline ? 'Editar Disciplina' : 'Nova Disciplina'}
        description="Defina o nome oficial e o código identificador da disciplina."
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nome da Disciplina"
            placeholder="Ex: Física Quântica ou Língua Portuguesa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Código da Disciplina"
            placeholder="Ex: FIS-101 ou MAT-302"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
              {editingDiscipline ? 'Salvar Alterações' : 'Criar Disciplina'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Disciplina"
        message={`Tem certeza que deseja excluir a disciplina "${disciplineToDelete?.name}" (${disciplineToDelete?.code})?`}
        confirmText="Sim, excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
