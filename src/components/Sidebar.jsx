import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Calendar, Package, TrendingUp, FileBarChart } from 'lucide-react'

const Sidebar = () => {
    const location = useLocation()

    const links = [
        { to: '/', label: 'Ventas', icon: TrendingUp },
        { to: '/compras', label: 'Compras', icon: ShoppingCart },
        { to: '/reservas', label: 'Reservas', icon: Calendar },
        { to: '/productos', label: 'Productos', icon: Package },
        { to: '/reportes', label: 'Reportes', icon: FileBarChart },
    ]

    return (
        <div className="h-screen w-64 bg-gray-900 border-r border-gray-800 text-gray-300 flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <LayoutDashboard className="h-8 w-8 text-blue-500" />
                    DM2Kiosco
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = location.pathname === link.to
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
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
    )
}

export default Sidebar
