import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
            {trendValue && (
                <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-500' : (trend === 'down' ? 'text-red-500' : 'text-gray-400')}`}>
                    {trend === 'up' && <ArrowUpRight className="h-4 w-4" />}
                    {trend === 'down' && <ArrowDownRight className="h-4 w-4" />}
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
    const navigate = useNavigate()
    const { data: dailyReport, loading: loadingReport } = useReporte('diario', { sortColumn: 'fecha', sortOrder: 'desc', pageSize: 30 })
    const { data: reservas, loading: loadingReservas } = useReservas({}, true)
    const { data: productos, loading: loadingProductos } = useProductos({ pageSize: 5, sortColumn: 'stock_actual', sortOrder: 'asc' })

    // Calcular KPIs
    const stats = useMemo(() => {
        const getLocalDateStr = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const now = new Date();
        const todayStr = getLocalDateStr(now);
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);

        if (!dailyReport.length) return { today: '$0', thisMonth: '$0', countToday: 0, trend: null, trendValue: '0 op.' }

        const todayData = dailyReport.find(d => d.fecha === todayStr) || { ingresos: 0, cant_ventas: 0, balance: 0 }
        const yesterdayData = dailyReport.find(d => d.fecha === yesterdayStr) || { ingresos: 0, cant_ventas: 0 }

        const totalMesGanancia = dailyReport.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0)

        // Calculate trend based on count of sales
        let trend = null;
        if (todayData.cant_ventas > yesterdayData.cant_ventas) trend = 'up';
        else if (todayData.cant_ventas < yesterdayData.cant_ventas) trend = 'down';

        return {
            today: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(todayData.ingresos || 0),
            thisMonth: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalMesGanancia),
            countToday: todayData.cant_ventas || 0,
            trend,
            trendValue: `${todayData.cant_ventas} op.`,
            yesterdayCount: yesterdayData.cant_ventas
        }
    }, [dailyReport])

    const saldoReservas = useMemo(() => {
        const total = reservas.reduce((acc, curr) => acc + (parseFloat(curr.saldo_pendiente) || 0), 0)
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)
    }, [reservas])

    // Preparar datos para el gráfico (últimos 30 días cronológicamente)
    const chartData = useMemo(() => {
        return [...dailyReport].reverse().map(item => ({
            date: new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
            ventas: parseFloat(item.total_ventas) || 0,
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
                    title="Ingresos de Hoy"
                    value={stats.today}
                    icon={DollarSign}
                    color="blue"
                    trend={stats.trend}
                    trendValue={stats.trendValue}
                />
                <StatCard
                    title="Ganancia este Mes"
                    value={stats.thisMonth}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Reservas Abiertas"
                    value={`${reservas.length} activas`}
                    icon={Calendar}
                    color="purple"
                    trend={null}
                    trendValue={saldoReservas}
                />
                <StatCard
                    title="Stock Crítico"
                    value={loadingProductos ? '...' : productos.filter(p => (p.stock_actual || 0) <= 5).length}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Reservas Pendientes (Deudores)</h3>
                        <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                                    <th className="pb-3 font-semibold">Cliente</th>
                                    <th className="pb-3 font-semibold text-right">Saldo Pendiente</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {loadingReservas ? (
                                    <tr><td colSpan="2" className="py-4 text-center text-gray-500">Cargando...</td></tr>
                                ) : reservas.length === 0 ? (
                                    <tr><td colSpan="2" className="py-4 text-center text-gray-500">No hay deudas pendientes</td></tr>
                                ) : (
                                    reservas.slice(0, 5).map(r => (
                                        <tr key={r.reserva_id} className="group hover:bg-gray-800/30 transition-colors">
                                            <td className="py-3 text-sm font-medium text-gray-300 group-hover:text-white">{r.cliente}</td>
                                            <td className="py-3 text-sm font-bold text-red-400 text-right">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(parseFloat(r.saldo_pendiente) || 0)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {reservas.length > 5 && (
                            <p className="text-[10px] text-gray-500 mt-4 italic">
                                * Mostrando 5 de {reservas.length} reservas abiertas.
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white h-fit shadow-xl shadow-blue-900/20">
                    <AlertCircle className="h-8 w-8 mb-4 " />
                    <h3 className="text-xl font-bold mb-2">Tip de Gestión</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                        Detectamos que tu horario pico es a las 19:00 hs. Asegurate de tener stock de productos estrella antes de esa hora para maximizar las ventas del día.
                    </p>
                    <button
                        onClick={() => navigate('/analisis-horarios')}
                        className="mt-6 w-full py-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-lg text-sm font-semibold"
                    >
                        Ver Análisis de Horarios
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HomeView
