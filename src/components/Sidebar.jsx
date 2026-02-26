import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Calendar, Package, TrendingUp, FileBarChart, History, Clock, X, BarChart3, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation()

    const links = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/ventas', label: 'Ventas', icon: TrendingUp },
        { to: '/compras', label: 'Compras', icon: ShoppingCart },
        { to: '/reservas', label: 'Reservas', icon: Calendar },
        { to: '/productos', label: 'Productos', icon: Package },
        { to: '/rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
        { to: '/reportes', label: 'Reportes', icon: FileBarChart },
        { to: '/reporte-productos', label: 'Ventas por Producto', icon: BarChart3 },
        { to: '/analisis-horarios', label: 'Análisis Horarios', icon: Clock },
        { to: '/historial', label: 'Historial', icon: History },
        { to: '/sistema', label: 'Centro de Control', icon: ShieldCheck },
    ]

    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Drawer */}
            <div className={`fixed top-0 left-0 h-full w-72 glass-panel z-50 transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0 shadow-blue-500/10' : '-translate-x-full'}`}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                            <LayoutDashboard className="h-6 w-6 text-white" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">DM2</span>
                    </h1>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = location.pathname === link.to
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative group ${isActive
                                    ? 'bg-blue-600/10 text-blue-400'
                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                                    />
                                )}
                                <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-500' : ''}`} />
                                <span className="font-semibold text-sm">{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-6 border-t border-white/5 text-[10px] uppercase tracking-widest font-black text-slate-600 text-center">
                    Inteligencia en Gestión &copy; 2026
                </div>
            </div>
        </>
    )
}

export default Sidebar
