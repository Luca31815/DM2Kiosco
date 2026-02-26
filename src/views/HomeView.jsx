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
import { motion } from 'framer-motion'
import { useReporte, useReservas, useProductos } from '../hooks/useData'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
        whileHover={{ y: -5 }}
        className="glass-card p-6 rounded-2xl relative overflow-hidden group"
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
            <p className="text-slate-400 text-sm font-semibold tracking-wide flex items-center gap-2">{title}</p>
            <h3 className="text-3xl font-black text-white mt-1.5 tabular-nums tracking-tight">{value}</h3>
        </div>
    </motion.div>
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-10"
        >
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

            {/* Grid de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos de Hoy"
                    value={stats.today}
                    icon={DollarSign}
                    color="blue"
                    trend={stats.trend}
                    trendValue={stats.trendValue}
                    index={0}
                />
                <StatCard
                    title="Ganancia este Mes"
                    value={stats.thisMonth}
                    icon={TrendingUp}
                    color="green"
                    index={1}
                />
                <StatCard
                    title="Reservas Abiertas"
                    value={`${reservas.length} activas`}
                    icon={Calendar}
                    color="purple"
                    trend={null}
                    trendValue={saldoReservas}
                    index={2}
                />
                <StatCard
                    title="Stock Crítico"
                    value={loadingProductos ? '...' : productos.filter(p => (p.stock_actual || 0) <= 5).length}
                    icon={Package}
                    color="yellow"
                    index={3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de Ingresos */}
                <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-8 rounded-2xl">
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
                        <ResponsiveContainer width="100%" height="100%">
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
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(12px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ventas"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorVentas)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <div className="space-y-8">
                    {/* Reservas Pendientes */}
                    <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white tracking-tight">Deudores</h3>
                            <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="space-y-4">
                            {loadingReservas ? (
                                <div className="py-8 text-center text-slate-500 animate-pulse">Analizando deudas...</div>
                            ) : reservas.length === 0 ? (
                                <div className="py-8 text-center text-slate-500 italic">No hay saldos pendientes</div>
                            ) : (
                                reservas.slice(0, 5).map(r => (
                                    <div key={r.reserva_id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 transition-all group">
                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{r.cliente}</span>
                                        <span className="text-sm font-black text-red-500 tabular-nums">
                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(parseFloat(r.saldo_pendiente) || 0)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                        {reservas.length > 5 && (
                            <button className="w-full mt-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors cursor-pointer">
                                Ver todos ({reservas.length})
                            </button>
                        )}
                    </motion.div>

                    {/* Tip de Gestión */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group cursor-pointer"
                        onClick={() => navigate('/analisis-horarios')}
                    >
                        <AlertCircle className="absolute top-2 right-2 h-20 w-20 text-white/10 -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                            Gestión Proactiva
                        </h3>
                        <p className="text-blue-50 text-sm leading-relaxed font-semibold opacity-90">
                            Detectamos picos de demanda a las 19:00 hs. Optimizá tu stock de productos estrella para maximizar cierres.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                            <span>Ver detalles interactivos</span>
                            <ArrowUpRight className="h-4 w-4" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

export default HomeView
