import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import {
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  LogIn,
  ArrowLeftRight,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const isSupabaseConfigured = Boolean(
  (import.meta.env.VITE_SUPABASE_URL || '').trim() &&
    (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
)

const AuthGate = ({ children }) => {
  const { session, loading, signInWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 bg-grid-subtle flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
          <div>
            <p className="font-display font-semibold text-slate-100">DM2 Finanzas</p>
            <p className="text-xs text-slate-400 mt-1">Verificando sesión autenticada...</p>
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    return children
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg('Completá tu correo electrónico y contraseña.')
      return
    }

    setErrorMsg(null)
    setSubmitting(true)
    try {
      await signInWithPassword(email.trim(), password)
      setEmail('')
      setPassword('')
    } catch (err) {
      setErrorMsg(err?.message || 'Credenciales inválidas. Verificá tu correo y contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-subtle flex flex-col items-center justify-center p-4 sm:p-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-md surface-panel rounded-3xl p-6 sm:p-8"
      >
        <div className="flex flex-col items-center text-center mb-7">
          <div className="h-13 w-13 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mb-4">
            <Wallet className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-50">
            DM2 Finanzas
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Control mensual privado de sueldos, obligaciones, logística y deudas
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Acceso restringido · RLS autenticado</span>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Faltan variables de entorno <code className="font-mono">VITE_SUPABASE_URL</code> y{' '}
              <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> en <code className="font-mono">.env</code>.
            </span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200 text-xs font-medium"
          >
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="finanzas-email"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="finanzas-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@dm2kiosco.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="finanzas-password"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="finanzas-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-field pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isSupabaseConfigured}
            className="btn-primary w-full mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando acceso...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Ingresar a Finanzas</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Volver al Kiosco</span>
          </Link>
          <span className="text-[11px] text-slate-500">
            Misma cuenta de DM2Kiosco
          </span>
        </div>
      </m.div>
    </div>
  )
}

export default AuthGate
