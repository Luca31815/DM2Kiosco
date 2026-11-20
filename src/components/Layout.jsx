import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import Sidebar from './Sidebar'
import { Menu, RefreshCw, Clock, LogOut, LogIn, Eye, Wallet } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { prefetchRoute } from '../routes/lazyViews'

const TOAST_OPTIONS = {
    style: {
        background: '#1e293b',
        color: '#f1f5f9',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
    },
    success: {
        iconTheme: { primary: '#22c55e', secondary: '#0f172a' }
    },
    error: {
        iconTheme: { primary: '#ef4444', secondary: '#0f172a' }
    }
}

const RADIAL_GLOW_STYLE = {
    background: 'radial-gradient(ellipse at top left, rgba(37, 99, 235, 0.08), transparent 70%)'
}

const TIME_FORMATTER = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
})

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
})

const NavigationShell = React.memo(() => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])

    return (
        <>
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            <TopBar onMenuClick={openSidebar} />
        </>
    )
})
NavigationShell.displayName = 'NavigationShell'

const Layout = ({ children }) => {
    const isMobile = useIsMobile()

    return (
        <div className="flex bg-slate-950 min-h-screen relative overflow-hidden font-outfit">
            {/* Background grid pattern — desktop only */}
            {!isMobile && <div className="absolute inset-0 z-0 pointer-events-none bg-grid-pattern opacity-100" />}
            {/* Radial glow top-left sin blur GPU — desktop only */}
            {!isMobile && <div className="absolute top-0 left-0 w-[600px] h-[400px] z-0 pointer-events-none" style={RADIAL_GLOW_STYLE} />}

            <Toaster
                position="top-right"
                toastOptions={TOAST_OPTIONS}
            />

            <NavigationShell />

            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                <div className="p-4 md:p-8 pt-24 md:pt-28 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-24 md:pb-16">
                        {children}
                    </div>
                </div>

                {/* Status Badge */}
                <AuthBadge />
            </main>
        </div>
    )
}

// ── Live Clock — isolated so only it re-renders every second ─────────────────
const LiveClock = React.memo(() => {
    const [currentTime, setCurrentTime] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const timeStr = TIME_FORMATTER.format(currentTime)
    const dateStr = DATE_FORMATTER.format(currentTime)

    return (
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/3 border border-white/5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-slate-200 tabular-nums tracking-tight">{timeStr}</span>
                <span className="text-[10px] text-slate-500 font-semibold capitalize">{dateStr}</span>
            </div>
        </div>
    )
})
LiveClock.displayName = 'LiveClock'

// ── TopBar — no longer re-renders on clock tick ──────────────────────────────
const TopBar = React.memo(({ onMenuClick }) => {
    const [refreshing, setRefreshing] = useState(false)
    const isMobile = useIsMobile()
    const { session, openLoginModal, signOut } = useAuth()
    const { mutate } = useSWRConfig()
    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    const handleRefresh = useCallback(async () => {
        if (refreshing) return
        setRefreshing(true)
        try {
            await mutate(() => true, undefined, { revalidate: true })
        } finally {
            if (isMountedRef.current) {
                setRefreshing(false)
            }
        }
    }, [mutate, refreshing])

    return (
        <div className="fixed top-0 left-0 right-0 z-30 h-16 shrink-0 select-none">
            {/* Fondo sólido de alto rendimiento en lugar de backdrop-blur-xl */}
            <div className="absolute inset-0 bg-slate-950/95 border-b border-white/5" />

            <div className="relative flex items-center justify-between h-full px-4 md:px-6">
                {/* Left: Menu + Logo */}
                <div className="flex items-center gap-3 shrink-0">
                    <button type="button"
                        id="sidebar-toggle"
                        onClick={onMenuClick}
                        aria-label="Abrir menú de navegación"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-colors active:scale-95"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <LogoTrigger />
                </div>

                {/* Right: Time + Finanzas Switch + Status + Refresh + Auth Button */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {/* Live clock — only this component ticks on desktop */}
                    {!isMobile && <LiveClock />}

                    <Link
                        to="/finanzas"
                        title="Ir a DM2 Finanzas & Metas"
                        onMouseEnter={() => prefetchRoute('/finanzas')}
                        onFocus={() => prefetchRoute('/finanzas')}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 font-bold text-xs transition-colors active:scale-95"
                    >
                        <Wallet className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Finanzas</span>
                    </Link>

                    {/* Mode status badge */}
                    {session ? (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/25" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">En Vivo</span>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                            <Eye className="h-3 w-3 text-amber-400" />
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Vista Previa</span>
                        </div>
                    )}

                    {/* Refresh button */}
                    <button type="button"
                        id="refresh-btn"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Recargar datos"
                        className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-colors active:scale-95 ${refreshing ? 'text-blue-400' : ''}`}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Auth Action button: Login / Logout */}
                    {session ? (
                        <button type="button"
                            id="logout-btn"
                            onClick={signOut}
                            title="Cerrar Sesión"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors active:scale-95"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    ) : (
                        <button type="button"
                            id="login-btn"
                            onClick={openLoginModal}
                            title="Iniciar Sesión"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-colors active:scale-95 cursor-pointer"
                        >
                            <LogIn className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Iniciar Sesión</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
})
TopBar.displayName = 'TopBar'


const LogoTrigger = () => {
    const [clicks, setClicks] = useState(0)
    const { isDemoMode } = useAuth()

    useEffect(() => {
        if (clicks === 0) return
        const timer = setTimeout(() => setClicks(0), 2000)
        return () => clearTimeout(timer)
    }, [clicks])

    const handleClick = () => {
        if (!isDemoMode) return
        const newClicks = clicks + 1
        if (newClicks >= 5) {
            setClicks(0)
            const key = prompt('Introduce la Clave Maestra para autorizar este dispositivo:')
            if (key) {
                window.location.search = `?admin=${encodeURIComponent(key)}`
            }
        } else {
            setClicks(newClicks)
        }
    }

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label="Autorizar dispositivo"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
            className="flex items-center gap-2.5 cursor-default select-none"
        >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white text-xs font-black">D</span>
            </div>
            <h1 className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                DM2Kiosco
            </h1>
        </div>
    )
}

const handleLock = () => {
    if (confirm('¿Querés BLOQUEAR el dashboard y volver al modo restringido?')) {
        window.location.search = '?logout=true'
    }
}

// ── AuthBadge — useEffect siempre se llama (hooks rule fix) ──────────────────
const AuthBadge = React.memo(() => {
    const { isDemoMode, openLoginModal } = useAuth()

    // Always call the effect — conditionally execute its body
    useEffect(() => {
        if (!isDemoMode) return
        const url = new URL(window.location.href)
        if (url.searchParams.has('admin')) {
            url.searchParams.delete('admin')
            window.history.replaceState({}, '', url.toString())
        }
    }, [isDemoMode])

    if (isDemoMode) {
        return (
            <div
                onClick={openLoginModal}
                role="button"
                tabIndex={0}
                aria-label="Iniciar sesión para acceder al sistema real"
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openLoginModal()}
                className="fixed bottom-20 sm:bottom-4 right-4 z-40 px-3.5 py-2 rounded-2xl border border-amber-500/20 text-xs font-bold transition-colors active:scale-95 shadow-xl bg-slate-900/95 text-amber-300 hover:bg-slate-900 hover:border-amber-500/40 group flex items-center gap-2.5 cursor-pointer"
            >
                <div className="h-2 w-2 rounded-full bg-amber-400 ring-2 ring-amber-400/25" />
                <span className="hidden sm:inline">Vista Previa (Datos Ficticios)</span>
                <span className="sm:hidden">Vista Previa</span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-600/30 border border-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase ml-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    Iniciar Sesión
                </span>
            </div>
        )
    }

    return (
        <div
            onClick={handleLock}
            role="button"
            tabIndex={0}
            aria-label="Bloquear sistema"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleLock()}
            className="fixed bottom-20 sm:bottom-4 right-4 z-50 px-3 py-1.5 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors active:scale-95 shadow-lg bg-emerald-950/90 text-emerald-400 hover:bg-emerald-900/90 group"
        >
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/25" />
                <span>Fijado (Live)</span>
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">| Bloquear</span>
            </div>
        </div>
    )
})
AuthBadge.displayName = 'AuthBadge'

export default Layout
