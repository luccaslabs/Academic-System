import React from 'react'
import type { NoticeResponse } from '../../types/api'
import { formatDate } from '../../utils/formatters'
import { Bell, Trash2, Layers } from 'lucide-react'
import { Badge } from '../common/Badge'

export interface NoticeCardProps {
  notice: NoticeResponse
  classNameRef?: string
  isAdmin?: boolean
  onDelete?: (notice: NoticeResponse) => void
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  notice,
  classNameRef,
  isAdmin = false,
  onDelete,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-xs border border-slate-100 transition-all duration-200 hover:shadow-sm">
      <div>
        {/* Header with badges and delete action */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {notice.class_id ? (
              <Badge variant="purple" size="sm">
                <Layers className="w-3 h-3 mr-1 inline" />
                {classNameRef || `Turma #${notice.class_id}`}
              </Badge>
            ) : (
              <Badge variant="primary" size="sm">
                <Bell className="w-3 h-3 mr-1 inline" />
                Aviso Geral
              </Badge>
            )}
            <span className="text-xs text-slate-400">{formatDate(notice.created_at)}</span>
          </div>

          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(notice)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Excluir Aviso"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">{notice.title}</h3>

        {/* Content */}
        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
          {notice.content}
        </p>
      </div>
    </div>
  )
}
