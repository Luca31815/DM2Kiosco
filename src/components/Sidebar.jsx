import React, { memo, useCallback, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    ShoppingCart,
    Calendar,
    Package,
    TrendingUp,
    FileBarChart,
    History,
    Clock,
    X,
    BarChart3,
    ShieldCheck,
    Users,
    Wallet,
    CreditCard,
    CandlestickChart,
    ScanSearch,
    Scale,
    Zap,
    LogIn,
    LogOut,
    Layers,
    Inbox,
    ArrowLeftRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTriageBadge } from '../hooks/useTriageBadge'
import { prefetchRoute } from '../routes/lazyViews'

const HOVER_PREFETCH_DELAY_MS = 150
const FOCUS_PREFETCH_DELAY_MS = 60

const navGroups = [
    {
        label: 'Principal',
        items: [
            { to: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        ]
    },
    {
        label: 'Ventas & Compras',
        items: [
            { to: '/ventas', label: 'Ventas', icon: TrendingUp },
            { to: '/compras', label: 'Compras', icon: ShoppingCart },
            { to: '/proveedores', label: 'Proveedores', icon: Users },
            { to: '/reservas', label: 'Reservas', icon: Calendar },
            { to: '/retiros', label: 'Gestión de Caja', icon: Wallet },
            { to: '/cartera', label: 'Cartera & Pagos', icon: CreditCard },
        ]
    },
    {
        label: 'Inventario',
        items: [
            { to: '/triage', label: 'Bandeja de Entrada', icon: Inbox, isTriage: true },
            { to: '/productos', label: 'Productos', icon: Package },
            { to: '/radar-precios', label: 'Radar Costo vs PV', icon: CandlestickChart },
            { to: '/rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
        ]
    },
    {
        label: 'Análisis & Reportes',
        items: [
            { to: '/comparador-ventas', label: 'Comparador de Ventas', icon: Scale },
            { to: '/reportes', label: 'Reportes', icon: FileBarChart },
            { to: '/secciones', label: 'Análisis por Secciones', icon: Layers },
            { to: '/reporte-productos', label: 'Ventas por Producto', icon: BarChart3 },
            { to: '/analisis-horarios', label: 'Análisis Horarios', icon: Clock },
            { to: '/historial', label: 'Historial', icon: History },
        ]
    },
    {
        label: 'Auditoría',
        items: [
            { to: '/duplicados', label: 'Alertas de Catálogo', icon: ScanSearch, alert: true },
            { to: '/descalces', label: 'Auditoría de Pagos', icon: Scale, alert: true },
            { to: '/sistema', label: 'Centro de Control', icon: ShieldCheck },
        ]
    }
]

const TriageBadge = memo(({ isOpen }) => {
    const { count: triagePendingCount } = useTriageBadge(isOpen)
    if (!(triagePendingCount > 0)) return null

    return (
        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 ring-2 ring-amber-500/20 tabular-nums">
            {triagePendingCount}
        </span>
    )
})
TriageBadge.displayName = 'TriageBadge'

const SidebarNavItem = memo(({ link, isActive, triageOpen, onClose, onSchedulePrefetch, onCancelPrefetch }) => {
    const Icon = link.icon

    return (
        <Link
            to={link.to}
            onClick={onClose}
            onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') {
                    onSchedulePrefetch(link.to, HOVER_PREFETCH_DELAY_MS)
                }
            }}
            onPointerLeave={onCancelPrefetch}
            onFocus={() => onSchedulePrefetch(link.to, FOCUS_PREFETCH_DELAY_MS)}
            onBlur={onCancelPrefetch}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative group ${
                isActive
                    ? 'bg-blue-600/15 text-blue-400'
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-100'
            }`}
        >
            {isActive && (
                <div className="absolute left-0 w-1 h-5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full" />
            )}
            <div className={`flex-shrink-0 transition-colors ${
                isActive
                    ? 'text-blue-400'
                    : link.alert
                    ? 'text-amber-500'
                    : 'text-slate-500 group-hover:text-slate-300'
            }`}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm flex-1">{link.label}</span>
            {link.isTriage && <TriageBadge isOpen={triageOpen} />}
            {link.alert && (
                <div className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            )}
        </Link>
    )
})
SidebarNavItem.displayName = 'SidebarNavItem'

const Sidebar = memo(({ isOpen, onClose }) => {
    const location = useLocation()
    const { session, openLoginModal, signOut } = useAuth()
    const prefetchTimerRef = useRef(null)

    const cancelPrefetch = useCallback(() => {
        if (prefetchTimerRef.current !== null) {
            clearTimeout(prefetchTimerRef.current)
            prefetchTimerRef.current = null
        }
    }, [])

    const schedulePrefetch = useCallback((pathname, delay = HOVER_PREFETCH_DELAY_MS) => {
        cancelPrefetch()
        prefetchTimerRef.current = setTimeout(() => {
            prefetchTimerRef.current = null
            prefetchRoute(pathname)
        }, delay)
    }, [cancelPrefetch])

    useEffect(() => {
        if (!isOpen) {
            cancelPrefetch()
            return
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            cancelPrefetch()
        }
    }, [isOpen, onClose, cancelPrefetch])

    return (
        <>
            {/* Overlay — sin backdrop-blur animado para mantener 60fps */}
            <button
                type="button"
                tabIndex={isOpen ? 0 : -1}
                aria-hidden={!isOpen}
                aria-label="Cerrar menú"
                onClick={onClose}
                className={`fixed inset-0 bg-slate-950/75 z-40 transition-[opacity,visibility] duration-200 ease-out ${
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                }`}
            />

            {/* Sidebar Drawer */}
            <aside
                aria-label="Menú de navegación"
                aria-hidden={!isOpen}
                inert={!isOpen}
                className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-slate-950/98 border-r border-slate-800/80 shadow-2xl shadow-black/60 [contain:layout_paint_style] will-change-transform transition-[transform,visibility] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen ? 'translate-x-0 visible' : '-translate-x-full invisible pointer-events-none'
                }`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-white">DM2Kiosco</h1>
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Panel de Control</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar navegación"
                        className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 overflow-y-auto overscroll-contain [contain:content] custom-scrollbar">
                    {navGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            <div className="px-6 pt-3 pb-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
                                    {group.label}
                                </span>
                            </div>
                            <div className="px-3 space-y-0.5">
                                {group.items.map((link) => (
                                    <SidebarNavItem
                                        key={link.to}
                                        link={link}
                                        isActive={location.pathname === link.to}
                                        triageOpen={link.isTriage ? isOpen : false}
                                        onClose={onClose}
                                        onSchedulePrefetch={schedulePrefetch}
                                        onCancelPrefetch={cancelPrefetch}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 space-y-2 shrink-0">
                    <Link
                        to="/finanzas"
                        onClick={onClose}
                        onPointerEnter={(e) => {
                            if (e.pointerType === 'mouse') {
                                schedulePrefetch('/finanzas', HOVER_PREFETCH_DELAY_MS)
                            }
                        }}
                        onPointerLeave={cancelPrefetch}
                        onFocus={() => schedulePrefetch('/finanzas', FOCUS_PREFETCH_DELAY_MS)}
                        onBlur={cancelPrefetch}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/20 via-teal-600/15 to-blue-600/20 hover:from-emerald-600/30 hover:to-blue-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors group"
                    >
                        <span className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-emerald-400" />
                            <span>Finanzas & Metas</span>
                        </span>
                        <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-400/70 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    {session ? (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/25" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Operador Activo</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => { signOut(); onClose(); }}
                                title="Cerrar Sesión"
                                className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { openLoginModal(); onClose(); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-colors active:scale-95 cursor-pointer"
                        >
                            <LogIn className="h-4 w-4" />
                            <span>Iniciar Sesión</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
