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
    AlertCircle,
    Activity,
    Clock,
    Tag,
    BrainCircuit
} from 'lucide-react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { useReporte, useReservas, useProductos, useUnifiedFeed, usePredictiveStock, useProductosDuplicadosTrigram } from '../hooks/useData'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div
        className="bg-slate-900 p-6 rounded-2xl relative overflow-hidden group border border-white/5 shadow-xl transition-transform hover:-translate-y-1"
    >
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-${color}-500/20 transition-all duration-500`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20 shadow-lg`}>
                <Icon className={`h-6 w-6 text-${color}-400`} />
            </div>
            {trendValue && (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-black tracking-tighter ${trend === 'up' ? 'bg-green-500/10 text-green-400' : (trend === 'down' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400')}`}>
                    {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                    {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                    {trendValue}
                </div>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">{title}</p>
            <h3 className="text-2xl font-black text-white mt-1.5 tabular-nums tracking-tight">{value}</h3>
        </div>
    </div>
)

const HomeView = () => {
    const navigate = useNavigate()
    const { data: dailyReport } = useReporte('diario', { sortColumn: 'fecha', sortOrder: 'desc', pageSize: 30 })
    const { data: reservas } = useReservas({}, true)
    const { data: productos, loading: loadingProductos } = useProductos({ pageSize: 5, sortColumn: 'stock_actual', sortOrder: 'asc' })
    const { data: duplicados, loading: loadingDuplicados } = useProductosDuplicadosTrigram()

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

        const todayData = dailyReport.find(d => d.fecha === todayStr) || { ingresos: 0, cant_ventas: 0, saldo: 0 }
        const yesterdayData = dailyReport.find(d => d.fecha === yesterdayStr) || { ingresos: 0, cant_ventas: 0 }

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const totalMesGanancia = dailyReport
            .filter(d => {
                const dDate = new Date(d.fecha + 'T00:00:00');
                return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
            })
            .reduce((acc, curr) => acc + (parseFloat(curr.saldo) || 0), 0)

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

    const chartData = useMemo(() => {
        return [...dailyReport].reverse().map(item => ({
            date: new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
            ventas: parseFloat(item.total_ventas) || 0,
            originalDate: item.fecha
        }))
    }, [dailyReport])

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Centro de Control</h2>
                    <p className="text-slate-400 font-medium mt-1">Monitoreo inteligente en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Sincronizado</span>
                </div>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 p-8 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Evolución Comercial</h3>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-0.5">Últimos 30 días</p>
                        </div>
                        <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Ingresos Brutos</span>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#475569"
                                    fontSize={10}
                                    fontWeight={800}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={10}
                                    fontWeight={800}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ventas"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorVentas)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-red-500/10 relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h3 className="text-lg font-black text-white tracking-tight">Cruce de Catálogo</h3>
                            <BrainCircuit className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            {loadingDuplicados ? (
                                <div className="py-8 text-center text-slate-500 animate-pulse text-sm font-semibold">Analizando...</div>
                            ) : duplicados.length === 0 ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center">
                                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                    <span className="text-sm font-bold text-slate-300 mt-2">Catálogo Optimizado</span>
                                </div>
                            ) : (
                                duplicados.slice(0, 3).map((d, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all cursor-pointer" onClick={() => navigate('/duplicados')}>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-red-400">{d.reason}</div>
                                        <div className="text-[11px] font-bold text-slate-300 truncate mt-1">{d.p1.nombre}</div>
                                        <div className="text-[11px] font-bold text-slate-300 truncate">{d.p2.nombre}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white tracking-tight">Deudores</h3>
                            <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="space-y-4">
                            {reservas.length === 0 ? (
                                <div className="py-4 text-center text-slate-500 italic text-sm">Sin saldos pendientes</div>
                            ) : (
                                reservas.slice(0, 5).map(r => (
                                    <div key={r.reserva_id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-all">
                                        <span className="text-sm font-bold text-slate-300">{r.cliente}</span>
                                        <span className="text-sm font-black text-red-500 tabular-nums">
                                            ${parseFloat(r.saldo_pendiente).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div
                        className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-2xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]"
                        onClick={() => navigate('/analisis-horarios')}
                    >
                        <AlertCircle className="absolute top-2 right-2 h-20 w-20 text-white/10 -mr-6 -mt-6" />
                        <h3 className="text-xl font-black mb-2 flex items-center gap-2">Gestión Proactiva</h3>
                        <p className="text-blue-50 text-sm leading-relaxed font-semibold opacity-90">
                            Detectamos picos de demanda. Optimizá tu stock para maximizar cierres.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomeView
