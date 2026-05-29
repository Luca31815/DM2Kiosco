import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Package,
    AlertCircle,
    Activity,
    Clock,
    BrainCircuit,
    ChevronRight,
    Zap,
    BarChart2,
    Users,
    Minus,
    ShoppingBag,
    Wallet,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Eye
} from 'lucide-react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine,
    BarChart,
    Bar,
    ComposedChart,
    Line
} from 'recharts'
import { useReporte, useReservas, useProductos, useProductosDuplicadosTrigram } from '../hooks/useData'

// ── Animated Number Counter ──────────────────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '', suffix = '', duration = 800 }) => {
    const [display, setDisplay] = useState(value)
    const prevRef = useRef(value)

    useEffect(() => {
        const start = prevRef.current
        const end = value
        if (start === end) return
        const startTime = performance.now()
        const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = start + (end - start) * eased
            setDisplay(current)
            if (progress < 1) requestAnimationFrame(animate)
            else prevRef.current = end
        }
        requestAnimationFrame(animate)
    }, [value, duration])

    return <>{prefix}{typeof display === 'number' && !isNaN(display) ? Math.round(display).toLocaleString('es-AR') : display}{suffix}</>
}

// ── Skeleton Loader ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 skeleton rounded-xl" />
            <div className="w-16 h-6 skeleton rounded-full" />
        </div>
        <div className="w-20 h-3 skeleton rounded mb-3" />
        <div className="w-32 h-8 skeleton rounded" />
    </div>
)

// ── Mini Sparkline ───────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#3b82f6' }) => {
    if (!data || data.length < 2) return null
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const w = 80, h = 32, pad = 2
    const points = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2)
        const y = pad + (1 - (v - min) / range) * (h - pad * 2)
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
            <defs>
                <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// ── Stat Card ────────────────────────────────────────────────────────────────
const colorMap = {
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   glow: 'stat-glow-blue',   line: '#3b82f6', badge: 'bg-blue-500/10 text-blue-400' },
    green:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'stat-glow-green', line: '#10b981', badge: 'bg-emerald-500/10 text-emerald-400' },
    purple: { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  icon: 'text-purple-400', glow: 'stat-glow-purple', line: '#a855f7', badge: 'bg-purple-500/10 text-purple-400' },
    yellow: { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400',  glow: 'stat-glow-yellow', line: '#f59e0b', badge: 'bg-amber-500/10 text-amber-400' },
    orange: { bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  icon: 'text-orange-400', glow: 'stat-glow-orange', line: '#f97316', badge: 'bg-orange-500/10 text-orange-400' },
}

const StatCard = ({ title, value, rawValue, icon: Icon, trend, trendValue, trendLabel, color = 'blue', sparkData, subtitle, delay = 0, onClick }) => {
    const c = colorMap[color] || colorMap.blue

    return (
        <div
            className={`bg-slate-900 p-5 rounded-2xl relative overflow-hidden border border-white/5 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/10 animate-fade-in-up ${c.glow} ${onClick ? 'cursor-pointer' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
        >
            {/* Ambient glow */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 ${c.bg} rounded-full blur-2xl pointer-events-none transition-opacity duration-300`} />

            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2.5 rounded-xl ${c.bg} border ${c.border} shadow-sm`}>
                    <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                {trendValue !== undefined && trendValue !== null && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                        trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
                        trend === 'down' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-700/50 text-slate-400'
                    }`}>
                        {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                        {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                        {trend === 'neutral' && <Minus className="h-3 w-3" />}
                        {trendValue}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.12em] mb-1">{title}</p>
                <h3 className="text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                    {value}
                </h3>
                {(subtitle || trendLabel) && (
                    <p className="text-slate-500 text-[11px] font-semibold mt-1.5">{subtitle || trendLabel}</p>
                )}
            </div>

            {sparkData && sparkData.length > 1 && (
                <div className="relative z-10 mt-3 opacity-70">
                    <Sparkline data={sparkData} color={c.line} />
                </div>
            )}
        </div>
    )
}

// ── Period Selector ──────────────────────────────────────────────────────────
const PeriodButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
            active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
        {label}
    </button>
)

// ── Custom Tooltip for Chart ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
        <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[160px]">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                        <span className="text-[11px] font-semibold text-slate-300">{entry.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-white tabular-nums">
                        {entry.name === 'Ingresos' ? `$${(entry.value / 1000).toFixed(1)}k` : entry.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ── Stock Progress Bar ────────────────────────────────────────────────────────
const StockBar = ({ stock, maxStock = 20 }) => {
    const pct = Math.min((stock / maxStock) * 100, 100)
    const color = stock <= 2 ? 'bg-red-500' : stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
    return (
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
    )
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, to, color = 'blue', delay = 0 }) => {
    const navigate = useNavigate()
    return (
        <button
            onClick={() => navigate(to)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 animate-fade-in-up group`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`p-2 rounded-lg ${colorMap[color]?.bg || ''} ${colorMap[color]?.border ? `border ${colorMap[color].border}` : ''} group-hover:scale-110 transition-transform`}>
                <Icon className={`h-4 w-4 ${colorMap[color]?.icon || 'text-slate-400'}`} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors text-center leading-tight">{label}</span>
        </button>
    )
}

// ── Main HomeView ─────────────────────────────────────────────────────────────
const HomeView = () => {
    const navigate = useNavigate()
    const [chartPeriod, setChartPeriod] = useState(30)
    const { data: dailyReport } = useReporte('diario', { sortColumn: 'fecha', sortOrder: 'desc', pageSize: 60 })
    const { data: reservas } = useReservas({}, true)
    const { data: productos, loading: loadingProductos } = useProductos({ pageSize: 20, sortColumn: 'stock_actual', sortOrder: 'asc' })
    const { data: duplicados, loading: loadingDuplicados } = useProductosDuplicadosTrigram()

    // ── KPI Calculations ───────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const getLocalDateStr = (date) => {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
        }

        const now = new Date()
        const todayStr = getLocalDateStr(now)
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
        const yesterdayStr = getLocalDateStr(yesterday)

        if (!dailyReport.length) return {
            today: '$0', thisMonth: '$0', countToday: 0,
            trend: null, trendValue: null, avgTicket: '$0',
            sparkIngresos: [], sparkVentas: [], totalMesRaw: 0,
            ingresosHoyRaw: 0, yesterdayCount: 0
        }

        const todayData = dailyReport.find(d => d.fecha === todayStr) || { ingresos: 0, cant_ventas: 0, saldo: 0, total_ventas: 0 }
        const yesterdayData = dailyReport.find(d => d.fecha === yesterdayStr) || { ingresos: 0, cant_ventas: 0 }

        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const thisMonthData = dailyReport.filter(d => {
            const dDate = new Date(d.fecha + 'T00:00:00')
            return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear
        })

        const totalMesGanancia = thisMonthData.reduce((acc, curr) => acc + (parseFloat(curr.saldo) || 0), 0)
        const ingresosHoy = parseFloat(todayData.ingresos) || 0
        const cantHoy = todayData.cant_ventas || 0
        const avgTicket = cantHoy > 0 ? ingresosHoy / cantHoy : 0

        const last7 = [...dailyReport].slice(0, 7).reverse()
        const sparkIngresos = last7.map(d => parseFloat(d.ingresos) || 0)
        const sparkVentas = last7.map(d => parseInt(d.cant_ventas) || 0)

        let trend = null
        let pctChange = null
        if (yesterdayData.cant_ventas > 0) {
            pctChange = ((cantHoy - yesterdayData.cant_ventas) / yesterdayData.cant_ventas * 100).toFixed(0)
            trend = cantHoy > yesterdayData.cant_ventas ? 'up' : cantHoy < yesterdayData.cant_ventas ? 'down' : 'neutral'
        }

        const fmt = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)

        return {
            today: fmt(ingresosHoy),
            thisMonth: fmt(totalMesGanancia),
            countToday: cantHoy,
            trend,
            trendValue: pctChange !== null ? `${pctChange > 0 ? '+' : ''}${pctChange}%` : null,
            avgTicket: fmt(avgTicket),
            sparkIngresos,
            sparkVentas,
            totalMesRaw: totalMesGanancia,
            ingresosHoyRaw: ingresosHoy,
            yesterdayCount: yesterdayData.cant_ventas
        }
    }, [dailyReport])

    const saldoReservas = useMemo(() => {
        const total = reservas.reduce((acc, curr) => acc + (parseFloat(curr.saldo_pendiente) || 0), 0)
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(total)
    }, [reservas])

    // ── Chart Data ─────────────────────────────────────────────────────────────
    const chartData = useMemo(() => {
        const sliced = [...dailyReport].slice(0, chartPeriod).reverse()
        const avg = sliced.reduce((a, b) => a + (parseFloat(b.total_ventas) || 0), 0) / (sliced.length || 1)
        return {
            points: sliced.map(item => ({
                date: new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
                ingresos: parseFloat(item.ingresos) || 0,
                ventas: parseInt(item.cant_ventas) || 0,
                promedio: Math.round(avg),
                originalDate: item.fecha
            })),
            avg: Math.round(avg)
        }
    }, [dailyReport, chartPeriod])

    // ── Stock crítico ──────────────────────────────────────────────────────────
    const criticalStock = useMemo(() => {
        return productos.filter(p => (p.stock_actual || 0) <= 5)
    }, [productos])

    const isLoading = !dailyReport.length

    return (
        <div className="space-y-8">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in-up">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-1 w-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">Centro de Control</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        Panel Principal
                    </h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Acciones Rápidas inline */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">En vivo</span>
                    </div>
                </div>
            </div>

            {/* ── KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    <>
                        <StatCard
                            title="Ingresos de Hoy"
                            value={stats.today}
                            icon={DollarSign}
                            color="blue"
                            trend={stats.trend}
                            trendValue={stats.trendValue}
                            subtitle={`vs. ${stats.yesterdayCount} op. ayer`}
                            sparkData={stats.sparkIngresos}
                            delay={0}
                            onClick={() => navigate('/ventas')}
                        />
                        <StatCard
                            title="Ganancia del Mes"
                            value={stats.thisMonth}
                            icon={TrendingUp}
                            color="green"
                            sparkData={stats.sparkIngresos}
                            subtitle="Saldo neto acumulado"
                            delay={80}
                        />
                        <StatCard
                            title="Transacciones Hoy"
                            value={stats.countToday}
                            icon={Activity}
                            color="purple"
                            trend={stats.trend}
                            trendValue={stats.trendValue}
                            subtitle="Operaciones del día"
                            sparkData={stats.sparkVentas}
                            delay={160}
                            onClick={() => navigate('/ventas')}
                        />
                        <StatCard
                            title="Reservas Activas"
                            value={`${reservas.length}`}
                            icon={Calendar}
                            color="orange"
                            trendValue={saldoReservas}
                            subtitle="Saldo pendiente total"
                            delay={240}
                            onClick={() => navigate('/reservas')}
                        />
                        <StatCard
                            title="Stock Crítico"
                            value={loadingProductos ? '–' : criticalStock.length}
                            icon={Package}
                            color="yellow"
                            trend={criticalStock.length > 0 ? 'down' : null}
                            trendValue={criticalStock.length > 0 ? `${criticalStock.length} bajo mínimo` : null}
                            subtitle={loadingProductos ? 'Cargando...' : criticalStock.length === 0 ? 'Todo en orden' : 'Requiere atención'}
                            delay={320}
                            onClick={() => navigate('/productos')}
                        />
                    </>
                )}
            </div>

            {/* ── Main Grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Chart Column ──────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Evolución Chart */}
                    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-xl animate-fade-in-up animation-delay-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight">Evolución Comercial</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Ingresos y transacciones</p>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-white/5">
                                {[7, 14, 30].map(p => (
                                    <PeriodButton key={p} label={`${p}d`} active={chartPeriod === p} onClick={() => setChartPeriod(p)} />
                                ))}
                            </div>
                        </div>

                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <ComposedChart data={chartData.points} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="transparent"
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={24}
                                    />
                                    <YAxis
                                        yAxisId="ingresos"
                                        orientation="left"
                                        stroke="transparent"
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                        width={48}
                                    />
                                    <YAxis
                                        yAxisId="ventas"
                                        orientation="right"
                                        stroke="transparent"
                                        tick={{ fill: '#334155', fontSize: 9, fontWeight: 700 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={28}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    {chartData.avg > 0 && (
                                        <ReferenceLine
                                            yAxisId="ingresos"
                                            y={chartData.avg}
                                            stroke="#6366f1"
                                            strokeDasharray="4 4"
                                            strokeWidth={1.5}
                                            label={{ value: 'Prom.', fill: '#6366f1', fontSize: 9, fontWeight: 700, position: 'insideTopLeft' }}
                                        />
                                    )}
                                    <Bar
                                        yAxisId="ventas"
                                        dataKey="ventas"
                                        name="Transacciones"
                                        fill="rgba(99, 102, 241, 0.15)"
                                        radius={[3, 3, 0, 0]}
                                    />
                                    <Area
                                        yAxisId="ingresos"
                                        type="monotone"
                                        dataKey="ingresos"
                                        name="Ingresos"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#gradIngresos)"
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 flex items-center gap-5 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
                                <span className="text-[10px] text-slate-400 font-semibold">Ingresos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500/40" />
                                <span className="text-[10px] text-slate-400 font-semibold">Transacciones</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-0.5 w-4 border-t-2 border-dashed border-indigo-400" />
                                <span className="text-[10px] text-slate-400 font-semibold">Promedio</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 animate-fade-in-up animation-delay-300">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <h3 className="text-sm font-black text-white tracking-tight">Acciones Rápidas</h3>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            <QuickAction icon={TrendingUp}    label="Ver Ventas"       to="/ventas"           color="blue"   delay={350} />
                            <QuickAction icon={ShoppingCart}  label="Compras"          to="/compras"          color="green"  delay={400} />
                            <QuickAction icon={Calendar}      label="Reservas"         to="/reservas"         color="purple" delay={450} />
                            <QuickAction icon={FileBarChart2} label="Reportes"         to="/reportes"         color="orange" delay={500} />
                            <QuickAction icon={Package}       label="Productos"        to="/productos"        color="yellow" delay={550} />
                            <QuickAction icon={BarChart2}     label="Análisis"         to="/analisis-horarios" color="blue"  delay={600} />
                        </div>
                    </div>
                </div>

                {/* ── Right Column ───────────────────────────────────────── */}
                <div className="space-y-5">



                    {/* Deudores / Reservas */}
                    <div className="bg-slate-900 p-5 rounded-2xl border border-white/5 shadow-xl animate-fade-in-up animation-delay-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-purple-400" />
                                <h3 className="text-sm font-black text-white tracking-tight">Saldos Pendientes</h3>
                            </div>
                            <button
                                onClick={() => navigate('/reservas')}
                                className="text-[10px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                                Ver todo <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {reservas.length === 0 ? (
                                <div className="py-5 text-center">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-400/50 mx-auto mb-2" />
                                    <span className="text-sm font-bold text-slate-400">Sin saldos pendientes</span>
                                </div>
                            ) : (
                                reservas.slice(0, 5).map(r => (
                                    <div
                                        key={r.reserva_id}
                                        className="flex justify-between items-center p-2.5 rounded-xl bg-white/3 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer"
                                        onClick={() => navigate('/reservas')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                <span className="text-[9px] font-black text-purple-400">{r.cliente?.charAt(0)?.toUpperCase()}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-300 truncate max-w-[100px]">{r.cliente}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-red-400 tabular-nums">
                                            -${parseFloat(r.saldo_pendiente).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {reservas.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total pendiente</span>
                                <span className="text-sm font-black text-red-400">{saldoReservas}</span>
                            </div>
                        )}
                    </div>

                    {/* Alertas de Catálogo */}
                    <div className="bg-slate-900 p-5 rounded-2xl border border-red-500/10 relative overflow-hidden shadow-xl animate-fade-in-up animation-delay-400">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="h-4 w-4 text-red-400" />
                                <h3 className="text-sm font-black text-white tracking-tight">Cruce de Catálogo</h3>
                            </div>
                            {!loadingDuplicados && duplicados.length > 0 && (
                                <span className="text-[10px] font-black bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                    {duplicados.length} alertas
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 relative z-10">
                            {loadingDuplicados ? (
                                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)
                            ) : duplicados.length === 0 ? (
                                <div className="py-5 flex flex-col items-center gap-2">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-400/50" />
                                    <span className="text-sm font-bold text-slate-400">Catálogo Optimizado</span>
                                    <span className="text-[11px] text-slate-600 text-center">Sin duplicados detectados</span>
                                </div>
                            ) : (
                                duplicados.slice(0, 3).map((d, i) => (
                                    <div
                                        key={i}
                                        className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                                        onClick={() => navigate('/duplicados')}
                                    >
                                        <div className="text-[9px] font-black uppercase tracking-wider text-red-400 mb-1">{d.reason}</div>
                                        <div className="text-[11px] font-bold text-slate-300 truncate">{d.p1?.nombre}</div>
                                        <div className="text-[11px] font-semibold text-slate-500 truncate">{d.p2?.nombre}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!loadingDuplicados && duplicados.length > 0 && (
                            <button
                                onClick={() => navigate('/duplicados')}
                                className="mt-3 w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Revisar {duplicados.length > 3 ? `${duplicados.length - 3} más` : 'todos'}
                            </button>
                        )}
                    </div>

                    {/* CTA Card: Gestión Proactiva */}
                    <div
                        className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 rounded-2xl text-white shadow-2xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-blue-600/30 animate-fade-in-up animation-delay-500"
                        onClick={() => navigate('/analisis-horarios')}
                    >
                        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-yellow-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">IA Predictiva</span>
                            </div>
                            <h3 className="text-base font-black mb-1.5">Gestión Proactiva</h3>
                            <p className="text-blue-100 text-[12px] leading-relaxed opacity-90">
                                Detectamos picos de demanda y patrones horarios. Optimizá tu stock para maximizar cierres.
                            </p>
                            <div className="mt-3 flex items-center gap-1.5 text-blue-200 text-[11px] font-black">
                                <span>Ver análisis</span>
                                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Need FileBarChart2 icon
const FileBarChart2 = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
)

// Wallet icon for QuickActions (already imported)

export default HomeView
