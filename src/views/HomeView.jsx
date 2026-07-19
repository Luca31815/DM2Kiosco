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
import { HomeRightColumn } from './home/HomeRightColumn'
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
                <HomeRightColumn
                    reservas={reservas}
                    saldoReservas={saldoReservas}
                    goToReservas={goToReservas}
                    loadingDuplicados={loadingDuplicados}
                    duplicados={duplicados}
                    goToDuplicados={goToDuplicados}
                    goToAnalisis={goToAnalisis}
                />
            </div>
        </div>
    )
}

export default HomeView
