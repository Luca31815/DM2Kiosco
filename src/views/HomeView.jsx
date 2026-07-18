import React, { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    TrendingUp,
    ShoppingCart,
    Calendar,
    DollarSign,
    Package,
    Activity,
    Zap,
    BarChart2,
    Wallet,
    CheckCircle2,
    Eye,
    BrainCircuit,
    ChevronRight,
} from 'lucide-react'
import { useReporte, useReservas, useProductos, useProductosDuplicadosTrigram } from '../hooks/useData'
import { StatCard, SkeletonCard } from '../components/home/HomeStatCards'
const HomeChart = React.lazy(() => import('../components/home/HomeChart').then(m => ({ default: m.HomeChart })))
import { StockBar, QuickAction, FileBarChart2 } from '../components/home/HomeWidgets'

const currencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

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

        const fmt = (v) => currencyFormatter.format(v)

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

    const goToVentas = useCallback(() => navigate('/ventas'), [navigate])
    const goToReservas = useCallback(() => navigate('/reservas'), [navigate])
    const goToProductos = useCallback(() => navigate('/productos'), [navigate])
    const goToDuplicados = useCallback(() => navigate('/duplicados'), [navigate])
    const goToAnalisis = useCallback(() => navigate('/analisis-horarios'), [navigate])

    return (
        <div className="space-y-8">

            {/* ── Header ────────────────────────────────────────────── */}
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
                            onClick={goToVentas}
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
                            onClick={goToVentas}
                        />
                        <StatCard
                            title="Reservas Activas"
                            value={`${reservas.length}`}
                            icon={Calendar}
                            color="orange"
                            trendValue={saldoReservas}
                            subtitle="Saldo pendiente total"
                            delay={240}
                            onClick={goToReservas}
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
                            onClick={goToProductos}
                        />
                    </>
                )}
            </div>

            {/* ── Main Grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Chart Column ──────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Evolución Chart */}
                    <React.Suspense fallback={<div className="h-64 bg-slate-900/50 border border-white/5 rounded-2xl animate-pulse" />}>
                        <HomeChart
                            chartData={chartData}
                            chartPeriod={chartPeriod}
                            setChartPeriod={setChartPeriod}
                        />
                    </React.Suspense>

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
                            <button type="button"
                                onClick={goToReservas}
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
                                        onClick={goToReservas}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Ver reserva de ${r.cliente}`}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToReservas()}
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
                                ['sk-dup-1', 'sk-dup-2', 'sk-dup-3'].map((skKey) => <div key={skKey} className="h-14 skeleton rounded-xl" />)
                            ) : duplicados.length === 0 ? (
                                <div className="py-5 flex flex-col items-center gap-2">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-400/50" />
                                    <span className="text-sm font-bold text-slate-400">Catálogo Optimizado</span>
                                    <span className="text-[11px] text-slate-600 text-center">Sin duplicados detectados</span>
                                </div>
                            ) : (
                                duplicados.slice(0, 3).map((d) => (
                                    <div
                                        key={d.p1?.id ? `${d.p1.id}_${d.p2?.id || 'p2'}` : `${d.p1?.nombre || 'p1'}_${d.p2?.nombre || 'p2'}`}
                                        className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                                        onClick={goToDuplicados}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Ver duplicado de ${d.p1?.nombre}`}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToDuplicados()}
                                    >
                                        <div className="text-[9px] font-black uppercase tracking-wider text-red-400 mb-1">{d.reason}</div>
                                        <div className="text-[11px] font-bold text-slate-300 truncate">{d.p1?.nombre}</div>
                                        <div className="text-[11px] font-semibold text-slate-500 truncate">{d.p2?.nombre}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!loadingDuplicados && duplicados.length > 0 && (
                            <button type="button"
                                onClick={goToDuplicados}
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
                        onClick={goToAnalisis}
                        role="button"
                        tabIndex={0}
                        aria-label="Ver análisis de horarios"
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToAnalisis()}
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

export default HomeView
