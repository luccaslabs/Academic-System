import React, { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useUnreadDot } from '../../hooks/useUnreadDot'
import { calendarService } from '../../services/calendar.service'
import { classesService } from '../../services/classes.service'
import { notificationsService } from '../../services/notifications.service'
import type {
  CalendarEventResponse,
  SchoolClassResponse,
  EventType,
} from '../../types/api'
import { CalendarEventCard } from '../../components/cards/CalendarEventCard'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import {
  formatDateForInput,
  formatEventType,
  getEventTypeBadgeClass,
} from '../../utils/formatters'

export const CalendarPage: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const { refresh: refreshUnread } = useUnreadDot()
  const isAdmin = user?.role === 'admin'

  const [events, setEvents] = useState<CalendarEventResponse[]>([])
  const [classes, setClasses] = useState<SchoolClassResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'month'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filters
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEventResponse | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    event_type: EventType
    event_date: string
    class_id: string
  }>({
    title: '',
    description: '',
    event_type: 'exam',
    event_date: formatDateForInput(new Date().toISOString()),
    class_id: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<CalendarEventResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mark all calendar notifications as read on mount and refresh dot
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await notificationsService.markAllRead('calendar_event')
        await refreshUnread()
      } catch {
        // Silently handle
      }
    }
    markAsRead()
  }, [refreshUnread])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [eventsData, classesData] = await Promise.all([
        calendarService.getEvents(),
        classesService.getClasses().catch(() => []),
      ])
      setEvents(eventsData || [])
      setClasses(classesData || [])
    } catch (err) {
      showError(err, 'Erro ao carregar calendário acadêmico')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingEvent(null)
    setFormData({
      title: '',
      description: '',
      event_type: 'exam',
      event_date: formatDateForInput(new Date().toISOString()),
      class_id: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (evt: CalendarEventResponse) => {
    setEditingEvent(evt)
    setFormData({
      title: evt.title,
      description: evt.description || '',
      event_type: evt.event_type,
      event_date: formatDateForInput(evt.event_date),
      class_id: evt.class_id ? evt.class_id : '',
    })
    setIsModalOpen(true)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.event_date) {
      showError(null, 'Preencha o título e a data do evento.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingEvent) {
        // PUT /calendar/:id
        await calendarService.updateEvent(editingEvent.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          event_type: formData.event_type,
          event_date: formData.event_date,
        })
        showSuccess('Evento atualizado com sucesso!')
      } else {
        // POST /calendar
        await calendarService.createEvent({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          event_type: formData.event_type,
          event_date: formData.event_date,
          class_id: formData.class_id ? formData.class_id : null,
        })
        showSuccess('Evento cadastrado no calendário com sucesso!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao salvar evento no calendário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return
    setIsDeleting(true)
    try {
      await calendarService.deleteEvent(eventToDelete.id)
      showSuccess('Evento removido do calendário com sucesso!')
      setIsDeleteDialogOpen(false)
      setEventToDelete(null)
      fetchData()
    } catch (err) {
      showError(err, 'Erro ao excluir evento')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter events
  const filteredEvents = events.filter((evt) => {
    const matchesType = selectedType ? evt.event_type === selectedType : true
    const matchesClass = selectedClass
      ? selectedClass === 'general'
        ? evt.class_id === null
        : evt.class_id === selectedClass
      : true
    return matchesType && matchesClass
  })

  // Sort events by date ascending
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )

  // Month navigation helpers
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const monthYearLabel = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  // Calendar month grid calculation
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  const calendarDays = []
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Calendário Acadêmico
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Agenda de provas, prazos de entrega e eventos escolares
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition min-h-[40px] min-w-[40px] flex items-center justify-center ${
                viewMode === 'list' ? 'bg-white text-brand-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`p-2 rounded-lg transition min-h-[40px] min-w-[40px] flex items-center justify-center ${
                viewMode === 'month' ? 'bg-white text-brand-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="Visualização Mensal"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {isAdmin && (
            <Button
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
              size="md"
              className="min-h-[44px]"
            >
              Novo Evento
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="w-full sm:w-56">
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={[
              { value: '', label: 'Todos os tipos de evento' },
              { value: 'exam', label: 'Provas (exam)' },
              { value: 'assignment', label: 'Atividades (assignment)' },
              { value: 'event', label: 'Eventos Gerais (event)' },
            ]}
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: '', label: 'Todas as turmas e gerais' },
              { value: 'general', label: 'Apenas Eventos Gerais' },
              ...classes.map((c) => ({
                value: c.id,
                label: `Turma: ${c.name}`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Carregando eventos do calendário..." className="py-16" />
      ) : viewMode === 'month' ? (
        /* MONTH GRID VIEW */
        <div className="rounded-2xl bg-white shadow-xs border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 capitalize">{monthYearLabel}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-[11px] sm:text-xs font-bold text-slate-400 py-2.5">
            <div>DOM</div>
            <div>SEG</div>
            <div>TER</div>
            <div>QUA</div>
            <div>QUI</div>
            <div>SEX</div>
            <div>SÁB</div>
          </div>

          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-[70px] sm:min-h-[100px] bg-slate-50/40 p-1 sm:p-2" />
              }

              const cellDateStr = `${currentDate.getFullYear()}-${String(
                currentDate.getMonth() + 1
              ).padStart(2, '0')}-${String(day).padStart(2, '0')}`

              const dayEvents = sortedEvents.filter((e) => {
                const eDate = e.event_date.split('T')[0]
                return eDate === cellDateStr
              })

              return (
                <div
                  key={`day-${day}`}
                  className="min-h-[70px] sm:min-h-[100px] p-1 sm:p-2 hover:bg-slate-50/50 transition flex flex-col"
                >
                  <span className="text-xs font-bold text-slate-700 mb-1">{day}</span>
                  <div className="space-y-1 overflow-y-auto max-h-20 sm:max-h-24">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => isAdmin && handleOpenEditModal(evt)}
                        className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border truncate cursor-pointer ${getEventTypeBadgeClass(
                          evt.event_type
                        )}`}
                        title={`${evt.title} - ${formatEventType(evt.event_type)}`}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : sortedEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-8 h-8 text-slate-400" />}
          title="Nenhum evento encontrado"
          description={
            selectedType || selectedClass
              ? 'Nenhum evento corresponde aos filtros selecionados.'
              : 'Não há provas ou compromissos agendados no calendário.'
          }
          actionText={isAdmin ? 'Cadastrar Evento' : undefined}
          onAction={isAdmin ? handleOpenCreateModal : undefined}
        />
      ) : (
        /* LIST / AGENDA VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortedEvents.map((evt) => {
            const classObj = classes.find((c) => c.id === evt.class_id)
            return (
              <CalendarEventCard
                key={evt.id}
                event={evt}
                classNameRef={classObj?.name}
                isAdmin={isAdmin}
                onEdit={handleOpenEditModal}
                onDelete={(e) => {
                  setEventToDelete(e)
                  setIsDeleteDialogOpen(true)
                }}
              />
            )
          })}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Editar Evento' : 'Novo Evento no Calendário'}
        description={
          editingEvent
            ? 'Atualize as informações do evento acadêmico.'
            : 'Preencha os detalhes para agendar uma prova, entrega ou evento.'
        }
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <Input
            label="Título do Evento"
            placeholder="Ex: Prova Final de Cálculo I"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo de Evento"
              value={formData.event_type}
              onChange={(e) =>
                setFormData({ ...formData, event_type: e.target.value as EventType })
              }
              options={[
                { value: 'exam', label: 'Prova / Avaliação (exam)' },
                { value: 'assignment', label: 'Atividade / Entrega (assignment)' },
                { value: 'event', label: 'Evento Geral / Escolar (event)' },
              ]}
              required
            />

            <Input
              label="Data do Evento"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
            />
          </div>

          {!editingEvent && (
            <Select
              label="Vincular a uma Turma (Opcional)"
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              options={[
                { value: '', label: 'Evento Geral da Instituição' },
                ...classes.map((c) => ({
                  value: c.id,
                  label: `Turma: ${c.name} (${c.year})`,
                })),
              ]}
            />
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Descrição do Evento (Opcional)
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[100px]"
              placeholder="Instruções sobre o conteúdo, sala ou materiais permitidos..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
              {editingEvent ? 'Salvar Alterações' : 'Cadastrar Evento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Evento"
        message={`Tem certeza que deseja remover o evento "${eventToDelete?.title}" do calendário?`}
        confirmText="Sim, excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
