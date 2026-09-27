import React from 'react'
import { Link } from 'react-router-dom'
import { School, ArrowLeft } from 'lucide-react'
import { Button } from '../components/common/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 border border-brand-100">
        <School className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">404</h1>
      <p className="mt-2 text-lg font-semibold text-slate-700">Página não encontrada</p>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        O endereço que você tentou acessar não existe ou foi movido para outro local.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Voltar ao Painel</Button>
        </Link>
      </div>
    </div>
  )
}
