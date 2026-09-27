import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Users, GraduationCap, School, BookOpen, Loader2, ArrowRight } from 'lucide-react'
import { searchService } from '../../services/search.service'
import type { SearchResponse } from '../../types/api'

export interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults(null)
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await searchService.search(trimmed)
        setResults(data)
      } catch (err: any) {
        setError(err.detail || 'Erro ao realizar busca')
        setResults(null)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelectClass = (classId: string) => {
    navigate(`/classes/${classId}`)
    onClose()
  }

  const handleSelectAdminStudent = () => {
    navigate('/admin/students')
    onClose()
  }

  const handleSelectAdminTeacher = () => {
    navigate('/admin/teachers')
    onClose()
  }

  const handleSelectAdminDiscipline = () => {
    navigate('/admin/disciplines')
    onClose()
  }

  const totalResults =
    results ?
    (results.classes?.length || 0) +
    (results.students?.length || 0) +
    (results.teachers?.length || 0) +
    (results.disciplines?.length || 0) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Search dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar turmas, disciplinas, alunos ou professores... (mínimo 2 caracteres)"
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Body */}
        <div className="overflow-y-auto p-4 space-y-6 flex-1">
          {query.trim().length < 2 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              Digite pelo menos 2 caracteres para pesquisar no sistema...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {results && totalResults === 0 && !isLoading && (
            <div className="py-12 text-center text-slate-500 text-sm">
              Nenhum resultado encontrado para <span className="font-semibold">"{query}"</span>.
            </div>
          )}

          {results && totalResults > 0 && (
            <>
              {/* Classes */}
              {results.classes && results.classes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-brand-600" />
                    Turmas ({results.classes.length})
                  </h4>
                  <div className="space-y-1">
                    {results.classes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClass(c.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-brand-50/70 text-left transition group cursor-pointer min-h-[44px]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500">Ano letivo: {c.year}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Disciplines */}
              {results.disciplines && results.disciplines.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Disciplinas ({results.disciplines.length})
                  </h4>
                  <div className="space-y-1">
                    {results.disciplines.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={handleSelectAdminDiscipline}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition group cursor-pointer min-h-[44px]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-500 font-mono">Código: {d.code}</p>
                        </div>
                        <span className="text-xs text-slate-400">Ver Disciplinas</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Teachers */}
              {results.teachers && results.teachers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    Professores ({results.teachers.length})
                  </h4>
                  <div className="space-y-1">
                    {results.teachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={handleSelectAdminTeacher}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition group cursor-pointer min-h-[44px]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Matrícula: {t.registration}
                          </p>
                          <p className="text-xs text-slate-500">Docente ID: #{t.id.slice(0, 8)}</p>
                        </div>
                        <span className="text-xs text-slate-400">Ver Professores</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              {results.students && results.students.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Alunos ({results.students.length})
                  </h4>
                  <div className="space-y-1">
                    {results.students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={handleSelectAdminStudent}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition group cursor-pointer min-h-[44px]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Matrícula: {s.registration}
                          </p>
                          <p className="text-xs text-slate-500">Estudante ID: #{s.id.slice(0, 8)}</p>
                        </div>
                        <span className="text-xs text-slate-400">Ver Alunos</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium shadow-2xs">
              ESC
            </kbd>
            <span>para fechar</span>
          </div>
          <span className="hidden sm:inline">Busca global acadêmica</span>
        </div>
      </div>
    </div>
  )
}
