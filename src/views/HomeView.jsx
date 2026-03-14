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
import { useReporte, useReservas, useProductos, useUnifiedFeed, usePredictiveStock } from '../hooks/useData'

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
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">{title}</p>
            <h3 className="text-2xl font-black text-white mt-1.5 tabular-nums tracking-tight">{value}</h3>
        </div>
    </motion.div>
)

const ActivityFeed = ({ data }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'venta': return <ShoppingCart className="h-4 w-4 text-emerald-400" />
            case 'compra': return <Package className="h-4 w-4 text-rose-400" />
            case 'retiro': return <ArrowDownRight className="h-4 w-4 text-amber-400" />
            case 'reserva': return <Calendar className="h-4 w-4 text-purple-400" />
            default: return <Activity className="h-4 w-4 text-slate-400" />
        }
    }

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={item.id} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-all border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover/item:scale-110 transition-transform">
                            {getIcon(item.type)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-200 truncate max-w-[120px]">{item.title}</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                                {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <span className={`text-xs font-black tabular-nums ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.amount >= 0 ? '+' : ''}${Math.abs(item.amount).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    )
}

const HomeView = () => {
    const navigate = useNavigate()
    const { data: dailyReport, loading: loadingReport } = useReporte('diario', { sortColumn: 'fecha', sortOrder: 'desc', pageSize: 30 })
    const { data: reservas, loading: loadingReservas } = useReservas({}, true)
    const { data: productos, loading: loadingProductos } = useProductos({ pageSize: 5, sortColumn: 'stock_actual', sortOrder: 'asc' })
    const { data: unifiedFeed, loading: loadingFeed } = useUnifiedFeed(10)
    const { data: topAgotados, loading: loadingPred } = usePredictiveStock({ pageSize: 3, sortColumn: 'dias_restantes', sortOrder: 'asc' })

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
                    {/* Radar de Stock */}
                    <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-yellow-400" /> Radar Stock
                            </h3>
                            <button onClick={() => navigate('/reporte-productos')} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
                                <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-3 relative z-10">
                            {loadingPred ? (
                                <div className="py-4 text-center text-slate-500 animate-pulse">Analizando ciclos...</div>
                            ) : topAgotados.length === 0 ? (
                                <div className="py-4 text-center text-slate-500 italic text-xs">Abastecimiento estable</div>
                            ) : (
                                topAgotados.map(p => (
                                    <div key={p.producto} className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-slate-300 truncate max-w-[120px]">{p.producto}</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${p.dias_restantes < 3 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {p.dias_restantes} d.
                                            </span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(10, 100 - (p.dias_restantes * 10))}%` }}
                                                className={`h-full ${p.dias_restantes < 3 ? 'bg-rose-500' : 'bg-amber-500'}`}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Flujo de Actividad Unificado */}
                    <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border-white/10 group">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-400" /> Actividad
                            </h3>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Vivo</span>
                        </div>
                        {loadingFeed ? (
                            <div className="py-8 text-center text-slate-500 animate-pulse">Conectando...</div>
                        ) : (
                            <ActivityFeed data={unifiedFeed} />
                        )}
                        <button 
                            onClick={() => navigate('/reportes')}
                            className="w-full mt-6 py-2.5 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                            Ver Balance Completo
                        </button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

export default HomeView
