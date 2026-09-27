import React, { useState } from 'react'
import { User, Mail, Save, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { formatRole, getRoleBadgeClass } from '../../utils/formatters'

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const { showSuccess, showError } = useToast()

  const isStudent = user?.role === 'student'
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isStudent) return

    if (!name.trim() || !email.trim()) {
      showError(null, 'Preencha o nome e o e-mail.')
      return
    }

    setIsSubmitting(true)
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
      })
      showSuccess('Perfil atualizado com sucesso!')
    } catch (err) {
      showError(err, 'Erro ao atualizar perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isStudent
            ? 'Consulte seus dados de identificação acadêmica'
            : 'Gerencie seus dados de identificação e informações de acesso'}
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 space-y-6">
        {/* User Avatar & Role Overview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 font-bold text-white text-2xl shadow-md shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getRoleBadgeClass(
                  user?.role || 'student'
                )}`}
              >
                {formatRole(user?.role || 'student')}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        {isStudent ? (
          /* READ-ONLY VIEW FOR STUDENTS */
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50/80 border border-amber-200/60 rounded-2xl text-xs text-amber-800">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Os dados cadastrais de alunos são gerenciados exclusivamente pela secretaria escolar.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Nome Completo
                </p>
                <p className="text-sm sm:text-base font-semibold text-slate-900">{user?.name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  E-mail Cadastrado
                </p>
                <p className="text-sm sm:text-base font-semibold text-slate-900 break-all">{user?.email}</p>
              </div>
            </div>
          </div>
        ) : (
          /* EDITABLE VIEW FOR TEACHERS AND ADMINS */
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Endereço de E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
