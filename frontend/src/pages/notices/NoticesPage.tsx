import React, { useState, useEffect } from 'react'
import { Bell, Plus, Search, Layers, Globe } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useUnreadDot } from '../../hooks/useUnreadDot'
import { noticesService } from '../../services/notices.service'
import { classesService } from '../../services/classes.service'
import { notificationsService } from '../../services/notifications.service'
import type { NoticeResponse, SchoolClassResponse } from '../../types/api'
import { NoticeCard } from '../../components/cards/NoticeCard'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'

export const NoticesPage: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const { refresh: refreshUnread } = useUnreadDot()
  const isAdmin = user?.role === 'admin'

  const [notices, setNotices] = useState<NoticeResponse[]>([])
  const [classes, setClasses] = useState<SchoolClassResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter
  const [filterScope, setFilterScope] = useState<'all' | 'general' | 'class'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    class_id: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [noticeToDelete, setNoticeToDelete] = useState<NoticeResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mark all notices as read on mount and refresh unread dot
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await notificationsService.markAllRead('notice')
        await refreshUnread()
      } catch {
        // Silently handle if fails
      }
    }
    markAsRead()
  }, [refreshUnread])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [noticesData, classesData] = await Promise.all([
        noticesService.getNotices(),
        classesService.getClasses().catch(() => []),
      ])
      setNotices(noticesData || [])
      setClasses(classesData || [])
    } catch (err) {
      showError(err, 'Erro ao carregar avisos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      showError(null, 'Preencha o título e a mensagem do aviso.')
      return
    }

    setIsSubmitting(true)
    try {
      await noticesService.createNotice({
        title: formData.title.trim(),
        content: formData.content.trim(),
        class_id: formData.class_id ? formData.class_id : null,
      })
      showSuccess('Aviso publicado com sucesso!')
      setIsCreateModalOpen(false)
      setFormData({ title: '', content: '', class_id: '' })
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao publicar aviso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!noticeToDelete) return
    setIsDeleting(true)
    try {
      await noticesService.deleteNotice(noticeToDelete.id)
      showSuccess('Aviso excluído com sucesso!')
      setIsDeleteDialogOpen(false)
      setNoticeToDelete(null)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao excluir aviso')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered notices
  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesScope = true
    if (filterScope === 'general') {
      matchesScope = n.class_id === null
    } else if (filterScope === 'class') {
      matchesScope = n.class_id !== null
    }

    return matchesSearch && matchesScope
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mural de Avisos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Comunicados gerais e informes das turmas escolares
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => {
              setFormData({ title: '', content: '', class_id: '' })
              setIsCreateModalOpen(true)
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Novo Aviso
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Pesquisar em títulos ou conteúdo dos avisos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterScope('all')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 min-h-[38px] flex items-center justify-center ${
              filterScope === 'all'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({notices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('general')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 shrink-0 min-h-[38px] ${
              filterScope === 'general'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Gerais
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('class')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 shrink-0 min-h-[38px] ${
              filterScope === 'class'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Por Turma
          </button>
        </div>
      </div>

      {/* Notices Grid */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando avisos..." className="py-16" />
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-slate-400" />}
          title="Nenhum aviso encontrado"
          description={
            searchQuery || filterScope !== 'all'
              ? 'Nenhum comunicado corresponde aos filtros selecionados.'
              : 'Não há avisos ou comunicados cadastrados no momento.'
          }
          actionText={isAdmin ? 'Publicar Aviso' : undefined}
          onAction={isAdmin ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredNotices.map((notice) => {
            const classObj = classes.find((c) => c.id === notice.class_id)
            return (
              <NoticeCard
                key={notice.id}
                notice={notice}
                classNameRef={classObj?.name}
                isAdmin={isAdmin}
                onDelete={(n) => {
                  setNoticeToDelete(n)
                  setIsDeleteDialogOpen(true)
                }}
              />
            )
          })}
        </div>
      )}

      {/* Modal: Create Notice */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publicar Novo Aviso"
        description="Envie um comunicado para todos os alunos ou selecione uma turma específica."
      >
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <Input
            label="Título do Aviso"
            placeholder="Ex: Calendário de Rematrícula 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Select
            label="Destinatários"
            value={formData.class_id}
            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            options={[
              { value: '', label: 'Aviso Geral (Todos os Alunos e Professores)' },
              ...classes.map((c) => ({
                value: c.id,
                label: `Turma: ${c.name} (${c.year})`,
              })),
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Mensagem do Comunicado</label>
            <textarea
              rows={5}
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[120px]"
              placeholder="Escreva a mensagem completa do aviso..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="min-h-[44px]">
              Publicar Aviso
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Aviso"
        message={`Deseja realmente remover o aviso "${noticeToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
