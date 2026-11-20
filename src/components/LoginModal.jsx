import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, Mail, Lock, Loader2, AlertCircle, LogIn, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LoginModal = () => {
    const { isLoginModalOpen, closeLoginModal, signInWithPassword } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)
    const emailInputRef = useRef(null)

    const handleClose = useCallback(() => {
        setErrorMsg(null)
        closeLoginModal()
    }, [closeLoginModal])

    useEffect(() => {
        if (!isLoginModalOpen) return

        const previousFocus = document.activeElement
        emailInputRef.current?.focus()

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            if (previousFocus && typeof previousFocus.focus === 'function') {
                previousFocus.focus()
            }
        }
    }, [isLoginModalOpen, handleClose])

    if (!isLoginModalOpen) return null

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
            setEmail('')
            setPassword('')
        } catch (err) {
            console.error('Error al iniciar sesión:', err)
            setErrorMsg(err.message || 'Credenciales inválidas. Verificá tu correo y contraseña.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={handleClose}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-default"
            />

            {/* Modal Window */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
                className="relative w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/90 backdrop-blur-2xl z-10 font-outfit animate-modal-in"
            >
                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Cerrar ventana de inicio de sesión"
                    className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Brand Header */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/25 mb-3">
                        <Zap className="h-7 w-7 text-white" />
                    </div>
                    <h2 id="login-modal-title" className="text-2xl font-black tracking-tight text-white mb-1">
                        DM2Kiosco
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Iniciar Sesión de Operador
                    </p>
                </div>

                {/* Error Alert */}
                {errorMsg && (
                    <div
                        role="alert"
                        className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs font-medium animate-fade-in"
                    >
                        <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">{errorMsg}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Mail className="h-4 w-4" />
                            </div>
                            <input
                                ref={emailInputRef}
                                id="login-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="operador@dm2kiosco.com"
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                id="login-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm font-medium"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                <span>Ingresando...</span>
                            </>
                        ) : (
                            <>
                                <LogIn className="h-4 w-4" />
                                <span>Ingresar al Sistema</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center mt-5 text-[11px] text-slate-500 font-medium">
                    DM2Kiosco &copy; {new Date().getFullYear()} — Acceso restringido para operadores
                </div>
            </div>
        </div>
    )
}

export default LoginModal
