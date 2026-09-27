import React from 'react'
import type { CalendarEventResponse } from '../../types/api'
import {
  formatDate,
  formatEventType,
  getEventTypeBadgeClass,
} from '../../utils/formatters'
import { Calendar, Trash2, Edit2 } from 'lucide-react'

export interface CalendarEventCardProps {
  event: CalendarEventResponse
  classNameRef?: string
  isAdmin?: boolean
  onEdit?: (event: CalendarEventResponse) => void
  onDelete?: (event: CalendarEventResponse) => void
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  classNameRef,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-xs border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-slate-200">
      <div>
        {/* Top bar with event type badge, date & admin actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getEventTypeBadgeClass(
                event.event_type
              )}`}
            >
              {formatEventType(event.event_type)}
            </span>
            {event.class_id && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {classNameRef || `Turma #${event.class_id}`}
              </span>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Editar Evento"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(event)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Excluir Evento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 leading-snug mb-1.5">{event.title}</h4>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      {/* Date info footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Calendar className="w-3.5 h-3.5 text-brand-600" />
        <span>{formatDate(event.event_date)}</span>
      </div>
    </div>
  )
}
