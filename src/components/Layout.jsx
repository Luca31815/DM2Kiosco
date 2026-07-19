import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import { Menu, RefreshCw, Clock, LogOut } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const isMobile = useIsMobile()

    return (
        <div className="flex bg-slate-950 min-h-screen relative overflow-hidden font-outfit">
            {/* Background grid pattern — desktop only */}
            {!isMobile && <div className="absolute inset-0 z-0 pointer-events-none bg-grid-pattern opacity-100" />}
            {/* Radial glow top-left — desktop only */}
            {!isMobile && <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-blue-600/3 rounded-full blur-3xl z-0 pointer-events-none" />}

            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    },
                    success: {
                        iconTheme: { primary: '#22c55e', secondary: '#0f172a' }
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#0f172a' }
                    }
                }}
            />

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Enhanced Top Bar */}
                <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

                <div className="p-4 md:p-8 pt-[80px] overflow-y-auto overflow-x-hidden custom-scrollbar">
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

    const timeStr = currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = currentTime.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })

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
    const { session, signOut } = useAuth()

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        setTimeout(() => {
            setRefreshing(false)
            window.location.reload()
        }, 600)
    }, [])

    return (
        <div className="fixed top-0 left-0 right-0 z-30 h-16">
            {/* Glass background */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5" />

            <div className="relative flex items-center justify-between h-full px-4 md:px-6">
                {/* Left: Menu + Logo */}
                <div className="flex items-center gap-3">
                    <button type="button"
                        id="sidebar-toggle"
                        onClick={onMenuClick}
                        aria-label="Abrir menú de navegación"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all active:scale-95"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <LogoTrigger />
                </div>

                {/* Right: Time + Status + Refresh + Logout */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Live clock — only this component ticks on desktop */}
                    {!isMobile && <LiveClock />}

                    {/* Sync status */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hidden lg:block">Live</span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest lg:hidden">Live</span>
                    </div>

                    {/* Refresh button */}
                    <button type="button"
                        id="refresh-btn"
                        onClick={handleRefresh}
                        title="Recargar datos"
                        className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all active:scale-95 ${refreshing ? 'text-blue-400' : ''}`}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Logout button */}
                    {session && (
                        <button type="button"
                            id="logout-btn"
                            onClick={signOut}
                            title="Cerrar Sesión"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
                        >
                            <LogOut className="h-4 w-4" />
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
const AuthBadge = () => {
    const { isDemoMode } = useAuth()

    // Always call the effect — conditionally execute its body
    useEffect(() => {
        if (!isDemoMode) return
        const url = new URL(window.location.href)
        if (url.searchParams.has('admin')) {
            url.searchParams.delete('admin')
            window.history.replaceState({}, '', url.toString())
        }
    }, [isDemoMode])

    if (isDemoMode) return null

    return (
        <div
            onClick={handleLock}
            role="button"
            tabIndex={0}
            aria-label="Bloquear sistema"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleLock()}
            className="fixed bottom-20 sm:bottom-4 right-4 z-50 px-3 py-1.5 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-lg backdrop-blur-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 group"
        >
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                <span>Fijado (Live)</span>
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">| Bloquear</span>
            </div>
        </div>
    )
}

export default Layout
