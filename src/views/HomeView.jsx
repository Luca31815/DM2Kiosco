import React, { useMemo } from 'react'
import {
    TrendingUp,
    ShoppingCart,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Package,
    AlertCircle
} from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { useReporte, useReservas, useProductos } from '../hooks/useData'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                <Icon className={`h-6 w-6 text-${color}-500`} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {trendValue}
                </div>
            )}
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
    </div>
)

const HomeView = () => {
    const { data: dailyReport, loading: loadingReport } = useReporte('diario', { sortColumn: 'fecha', sortOrder: 'desc', pageSize: 30 })
    const { data: reservas, loading: loadingReservas } = useReservas({ openOnly: true })
    const { data: productos, loading: loadingProductos } = useProductos({ pageSize: 5, sortColumn: 'stock', sortOrder: 'asc' })

    // Calcular KPIs
    const stats = useMemo(() => {
        if (!dailyReport.length) return { today: '$0', thisMonth: '$0', lastWeekTrend: '0%' }

        const todayData = dailyReport[0]
        const totalMes = dailyReport.reduce((acc, curr) => acc + (curr.total_ventas || 0), 0)

        return {
            today: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(todayData.total_ventas || 0),
            thisMonth: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalMes),
            countToday: todayData.cantidad_ventas || 0
        }
    }, [dailyReport])

    const saldoReservas = useMemo(() => {
        const total = reservas.reduce((acc, curr) => acc + (curr.saldo_pendiente || 0), 0)
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)
    }, [reservas])

    // Preparar datos para el gráfico (últimos 30 días cronológicamente)
    const chartData = useMemo(() => {
        return [...dailyReport].reverse().map(item => ({
            date: new Date(item.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
            ventas: item.total_ventas || 0,
            originalDate: item.fecha
        }))
    }, [dailyReport])

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white">Dashboard Principal</h2>
                <p className="text-gray-400 mt-1">Resumen general del estado de tu negocio.</p>
            </div>

            {/* Grid de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ventas de Hoy"
                    value={stats.today}
                    icon={DollarSign}
                    color="blue"
                    trend="up"
                    trendValue={`${stats.countToday} op.`}
                />
                <StatCard
                    title="Caja este Mes"
                    value={stats.thisMonth}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Pendiente Reservas"
                    value={saldoReservas}
                    icon={Calendar}
                    color="purple"
                    trend={reservas.length > 0 ? 'up' : null}
                    trendValue={`${reservas.length} activas`}
                />
                <StatCard
                    title="Stock Crítico"
                    value={productos.filter(p => (p.stock || 0) <= (p.stock_minimo || 5)).length}
                    icon={Package}
                    color="yellow"
                />
            </div>

            {/* Gráfico de Ingresos */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-semibold text-white">Evolución de Ingresos (Últimos 30 días)</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-gray-400 font-medium">Ventas Diarias</span>
                        </div>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                itemStyle={{ color: '#3b82f6' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ventas"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorVentas)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Alertas Rápidas / Stock Crítico */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Reposición Sugerida</h3>
                        <Package className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {productos.map(p => (
                            <div key={p.producto_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                                <div>
                                    <p className="text-white font-medium">{p.nombre}</p>
                                    <p className="text-xs text-gray-500">Costo: ${p.ultimo_costo_compra || 0}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(p.stock || 0) <= 0 ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        Stock: {p.stock || 0}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white">
                    <AlertCircle className="h-8 w-8 mb-4 " />
                    <h3 className="text-xl font-bold mb-2">Tip de Gestión</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                        Detectamos que tu horario pico es a las 19:00 hs. Asegurate de tener stock de productos estrella antes de esa hora para maximizar las ventas del día.
                    </p>
                    <button className="mt-6 w-full py-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg text-sm font-semibold">
                        Ver Análisis de Horarios
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HomeView
