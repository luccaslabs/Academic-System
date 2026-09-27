import React from 'react'
import { Link } from 'react-router-dom'
import type { SchoolClassResponse } from '../../types/api'
import { User, Calendar, ArrowRight, Edit2, Trash2 } from 'lucide-react'
import { Badge } from '../common/Badge'

export interface ClassCardProps {
  schoolClass: SchoolClassResponse
  disciplineName?: string
  teacherName?: string
  isAdmin?: boolean
  onEdit?: (schoolClass: SchoolClassResponse) => void
  onDelete?: (schoolClass: SchoolClassResponse) => void
}

export const ClassCard: React.FC<ClassCardProps> = ({
  schoolClass,
  disciplineName,
  teacherName,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-xs border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-slate-200">
      <div>
        {/* Top badges & admin actions */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="primary">
              <Calendar className="w-3 h-3 mr-1 inline" />
              Ano {schoolClass.year}
            </Badge>
            {disciplineName && (
              <Badge variant="default" className="font-mono text-[11px]">
                {disciplineName}
              </Badge>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onEdit(schoolClass)
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Editar Turma"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onDelete(schoolClass)
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Excluir Turma"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/classes/${schoolClass.id}`} className="block group-hover:text-brand-600 transition">
          <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">
            {schoolClass.name}
          </h3>
        </Link>

        {/* Teacher details */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {teacherName ? `Prof. ${teacherName}` : 'Professor não atribuído'}
          </span>
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <Link
          to={`/classes/${schoolClass.id}`}
          className="inline-flex items-center gap-1 hover:underline"
        >
          <span>Ver Detalhes da Turma</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
