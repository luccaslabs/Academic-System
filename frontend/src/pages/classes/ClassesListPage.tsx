import React, { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { classesService } from '../../services/classes.service'
import { disciplinesService } from '../../services/disciplines.service'
import { teachersService } from '../../services/teachers.service'
import type {
  SchoolClassResponse,
  DisciplineResponse,
  TeacherResponse,
} from '../../types/api'
import { ClassCard } from '../../components/cards/ClassCard'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'

export const ClassesListPage: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const isAdmin = user?.role === 'admin'

  const [classes, setClasses] = useState<SchoolClassResponse[]>([])
  const [disciplines, setDisciplines] = useState<DisciplineResponse[]>([])
  const [teachers, setTeachers] = useState<TeacherResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchFilter, setSearchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<SchoolClassResponse | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear().toString(),
    discipline_id: '',
    teacher_id: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<SchoolClassResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [classesData, discData, teachData] = await Promise.all([
        classesService.getClasses(),
        disciplinesService.getDisciplines().catch(() => []),
        teachersService.getTeachers().catch(() => []),
      ])
      setClasses(classesData || [])
      setDisciplines(discData || [])
      setTeachers(teachData || [])
    } catch (err) {
      showError(err, 'Erro ao listar turmas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingClass(null)
    setFormData({
      name: '',
      year: new Date().getFullYear().toString(),
      discipline_id: disciplines.length > 0 ? disciplines[0].id : '',
      teacher_id: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (cls: SchoolClassResponse) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      year: cls.year,
      discipline_id: cls.discipline_id,
      teacher_id: cls.teacher_id ? cls.teacher_id : '',
    })
    setIsModalOpen(true)
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.year.trim()) {
      showError(null, 'Por favor, preencha o nome e o ano da turma.')
      return
    }

    if (!editingClass && !formData.discipline_id) {
      showError(null, 'Selecione uma disciplina para a nova turma.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingClass) {
        // PUT /classes/:id { name?, year?, teacher_id? }
        await classesService.updateClass(editingClass.id, {
          name: formData.name.trim(),
          year: formData.year.trim(),
          teacher_id: formData.teacher_id ? formData.teacher_id : null,
        })
        showSuccess('Turma atualizada com sucesso!')
      } else {
        // POST /classes { name, year, discipline_id, teacher_id? }
        await classesService.createClass({
          name: formData.name.trim(),
          year: formData.year.trim(),
          discipline_id: formData.discipline_id,
          teacher_id: formData.teacher_id ? formData.teacher_id : null,
        })
        showSuccess('Turma criada com sucesso!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao salvar turma')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!classToDelete) return
    setIsDeleting(true)
    try {
      await classesService.deleteClass(classToDelete.id)
      showSuccess('Turma excluída com sucesso!')
      setIsDeleteDialogOpen(false)
      setClassToDelete(null)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao excluir turma')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered classes
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      cls.year.includes(searchFilter)
    const matchesYear = yearFilter ? cls.year === yearFilter : true
    return matchesSearch && matchesYear
  })

  // Unique years for filtering
  const availableYears = Array.from(new Set(classes.map((c) => c.year))).sort().reverse()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Turmas Escolares
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulte turmas, grades disciplinares e professores responsáveis
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            size="md"
            className="w-full sm:w-auto min-h-[44px]"
          >
            Nova Turma
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Filtrar turmas por nome ou ano..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os Anos' },
              ...availableYears.map((y) => ({ value: y, label: `Ano ${y}` })),
            ]}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando turmas..." className="py-16" />
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          title="Nenhuma turma encontrada"
          description={
            searchFilter || yearFilter
              ? 'Nenhum resultado corresponde aos filtros aplicados.'
              : 'Nenhuma turma foi cadastrada no sistema ainda.'
          }
          actionText={isAdmin ? 'Criar Primeira Turma' : undefined}
          onAction={isAdmin ? handleOpenCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClasses.map((cls) => {
            const disc = disciplines.find((d) => d.id === cls.discipline_id)
            const teacher = teachers.find((t) => t.id === cls.teacher_id)
            return (
              <ClassCard
                key={cls.id}
                schoolClass={cls}
                disciplineName={disc ? `${disc.name} (${disc.code})` : undefined}
                teacherName={teacher ? `Matrícula: ${teacher.registration}` : undefined}
                isAdmin={isAdmin}
                onEdit={handleOpenEditModal}
                onDelete={(c) => {
                  setClassToDelete(c)
                  setIsDeleteDialogOpen(true)
                }}
              />
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Editar Turma' : 'Criar Nova Turma'}
        description={
          editingClass
            ? 'Atualize as informações da turma selecionada.'
            : 'Preencha os dados para cadastrar uma nova turma.'
        }
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <Input
            label="Nome da Turma"
            placeholder="Ex: 3º Ano B - Ensino Médio"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Ano Letivo"
            placeholder="Ex: 2026"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            required
          />

          {!editingClass && (
            <Select
              label="Disciplina da Turma"
              value={formData.discipline_id}
              onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione a disciplina' },
                ...disciplines.map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.code})`,
                })),
              ]}
              required
            />
          )}

          <Select
            label="Professor Responsável (Opcional)"
            value={formData.teacher_id}
            onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
            options={[
              { value: '', label: 'Nenhum professor selecionado' },
              ...teachers.map((t) => ({
                value: t.id,
                label: `Prof. Reg: ${t.registration}`,
              })),
            ]}
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
              {editingClass ? 'Salvar Alterações' : 'Criar Turma'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Turma"
        message={`Tem certeza que deseja excluir a turma "${classToDelete?.name}"? Esta ação removerá os vínculos e não pode ser desfeita.`}
        confirmText="Sim, excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
