import React, { useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Zap, Mail, Lock, Loader2, AlertCircle, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LoginView = () => {
    const { signInWithPassword } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) {
            setErrorMsg('Por favor completá todos los campos.')
            return
        }

        setErrorMsg(null)
        setLoading(true)
        try {
            await signInWithPassword(email, password)
        } catch (err) {
            console.error('Error al iniciar sesión:', err)
            setErrorMsg(err.message || 'Credenciales inválidas. Verificá tu correo y contraseña.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-outfit">
                {/* Background ambient lighting */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

                <m.div 
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-md relative z-10"
                >
                    {/* Brand Card Header */}
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/80">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/25 mb-4">
                                <Zap className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-white mb-1">
                                DM2Kiosco
                            </h1>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                Control de Acceso Operador
                            </p>
                        </div>

                        {/* Error Alert */}
                        {errorMsg && (
                            <m.div 
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs font-medium"
                            >
                                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                <span className="flex-1">{errorMsg}</span>
                            </m.div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="operador@dm2kiosco.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        <span>Iniciando Sesión...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-4 w-4" />
                                        <span>Ingresar al Sistema</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer note */}
                    <div className="text-center mt-6 text-xs text-slate-500 font-medium">
                        DM2Kiosco &copy; {new Date().getFullYear()} — Acceso restringido con Supabase Auth & RLS
                    </div>
                </m.div>
            </div>
        </LazyMotion>
    )
}

export default LoginView
