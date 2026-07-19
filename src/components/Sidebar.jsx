import React, { memo } from 'react'
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
    AlertTriangle,
    Users,
    Wallet,
    CreditCard,
    CandlestickChart,
    ScanSearch,
    Scale,
    Zap
} from 'lucide-react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'

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
            { to: '/productos', label: 'Productos', icon: Package },
            { to: '/rentabilidad', label: 'Rentabilidad', icon: CandlestickChart },
        ]
    },
    {
        label: 'Análisis & Reportes',
        items: [
            { to: '/reportes', label: 'Reportes', icon: FileBarChart },
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

const Sidebar = memo(({ isOpen, onClose }) => {
    const location = useLocation()

    return (
        <LazyMotion features={domAnimation}>
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
                        onClick={onClose}
                        role="button"
                        tabIndex={0}
                        aria-label="Cerrar menú"
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col"
                    >
                        {/* Sidebar background with subtle blur */}
                        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl border-r border-white/5" />

                        {/* Header */}
                        <div className="relative z-10 p-6 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-black tracking-tight text-white">DM2Kiosco</h1>
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Panel de Control</p>
                                </div>
                            </div>
                            <button type="button"
                                onClick={onClose}
                                aria-label="Cerrar navegación"
                                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="relative z-10 flex-1 py-4 overflow-y-auto custom-scrollbar">
                            {navGroups.map((group, gi) => (
                                <div key={gi} className="mb-2">
                                    <div className="px-6 pt-3 pb-1">
                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
                                            {group.label}
                                        </span>
                                    </div>
                                    <div className="px-3 space-y-0.5">
                                        {group.items.map((link) => {
                                            const Icon = link.icon
                                            const isActive = location.pathname === link.to
                                            return (
                                                <Link
                                                    key={link.to}
                                                    to={link.to}
                                                    onClick={onClose}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${
                                                        isActive
                                                            ? 'bg-blue-600/15 text-blue-400'
                                                            : 'hover:bg-white/5 text-slate-400 hover:text-slate-100'
                                                    }`}
                                                >
                                                    {isActive && (
                                                        <m.div
                                                            layoutId="activeIndicator"
                                                            className="absolute left-0 w-1 h-5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                                        />
                                                    )}
                                                    <div className={`flex-shrink-0 transition-all ${
                                                        isActive
                                                            ? 'text-blue-400'
                                                            : link.alert
                                                            ? 'text-amber-500'
                                                            : 'text-slate-500 group-hover:text-slate-300'
                                                    }`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-semibold text-sm flex-1">{link.label}</span>
                                                    {link.alert && (
                                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                                    )}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        {/* Footer */}
                        <div className="relative z-10 p-4 border-t border-white/5">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3">
                                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sistema Activo</span>
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </LazyMotion>
    )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
