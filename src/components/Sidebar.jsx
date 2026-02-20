import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Calendar, Package, TrendingUp, FileBarChart, History, Clock, X, Menu, BarChart3 } from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation()

    const links = [
        { to: '/', label: 'Ventas', icon: TrendingUp },
        { to: '/compras', label: 'Compras', icon: ShoppingCart },
        { to: '/reservas', label: 'Reservas', icon: Calendar },
        { to: '/productos', label: 'Productos', icon: Package },
        { to: '/rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
        { to: '/reportes', label: 'Reportes', icon: FileBarChart },
        { to: '/reporte-productos', label: 'Ventas por Producto', icon: BarChart3 },
        { to: '/analisis-horarios', label: 'Análisis Horarios', icon: Clock },
        { to: '/historial', label: 'Historial', icon: History },
    ]

    return (
        <>
            {/* Overlay for mobile/when open */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 text-gray-300 flex flex-col transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8 text-blue-500" />
                        DM2
                    </h1>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = location.pathname === link.to
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => {
                                    // Optional: Close on navigate on mobile? 
                                    // User didn't specify, but good UX usually.
                                    // Let's keep it open for now as user said "desplegable", maybe they want it pin-able?
                                    // Actually, if it covers content ("absolute"), we usually close on navigate.
                                    onClose()
                                }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20'
                                    : 'hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                    &copy; 2026 Dashboard Ventas
                </div>
            </div>
        </>
    )
}

export default Sidebar
