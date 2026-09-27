import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { School, User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'

export const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      showSuccess('Cadastro realizado com sucesso! Bem-vindo(a) ao portal.')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg =
        err.status === 429
          ? 'Muitas tentativas de registro. Por favor, aguarde alguns instantes antes de tentar novamente.'
          : err.detail || err.message || 'Erro ao registrar usuário. Tente novamente.'
      setErrorMessage(msg)
      showError(err, 'Falha no cadastro')
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
            Criar Nova Conta
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cadastre-se para acessar o sistema de gestão escolar
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-100">
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome Completo"
              type="text"
              placeholder="Ex: Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-3"
                size="lg"
                isLoading={isLoading}
                rightIcon={<UserPlus className="w-4 h-4" />}
              >
                Concluir Cadastro
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Já possui uma conta?{' '}
              <Link
                to="/login"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
