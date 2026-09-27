import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { School, Mail, Lock, LogIn, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await login({ email, password })
      showSuccess('Login realizado com sucesso!')
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg =
        err.status === 429
          ? 'Muitas tentativas de login. Por favor, aguarde alguns instantes antes de tentar novamente.'
          : err.detail || err.message || 'Falha ao autenticar. Verifique suas credenciais.'
      setErrorMessage(msg)
      showError(err, 'Erro de autenticação')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50/20 to-indigo-100/30 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 mb-4">
            <School className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Portal Acadêmico
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Acesse o sistema de gestão escolar com sua conta
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-100">
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="E-mail institucional ou pessoal"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <Input
                label="Senha de acesso"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3"
              size="lg"
              isLoading={isLoading}
              rightIcon={<LogIn className="w-4 h-4" />}
            >
              Entrar no Sistema
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Ainda não possui conta?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Autenticação segura via cookies HttpOnly com proteção CSRF
        </div>
      </div>

      {/* Forgot Password Information Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Recuperação de Senha"
        maxWidth="sm"
      >
        <div className="space-y-4 text-slate-600 text-sm">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              A recuperação automatizada de senha por e-mail ainda não está disponível nesta versão.
            </span>
          </div>
          <p>
            Caso tenha esquecido sua senha, por favor entre em contato diretamente com a secretaria
            ou administrador escolar para redefinição manual.
          </p>
          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
