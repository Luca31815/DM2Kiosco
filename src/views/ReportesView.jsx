import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useReporte, useReporteVentasPeriodico } from '../hooks/useData'
import {
    FileBarChart, Calendar, ChevronRight, TrendingUp, TrendingDown,
    ShoppingCart, Package, ArrowUpRight, ArrowDownRight,
    Activity, Clock, Tag, BarChart2, Percent, Sigma, ArrowRight, Target,
    CreditCard, PieChart, Sparkles
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, LabelList
} from 'recharts'
import { motion } from 'framer-motion'

import { KPICard } from './reportes/ReportesKPI'
import ExpandedPeriodPanel from './reportes/ExpandedPeriodPanel'
import { MES_NAMES } from './reportes/reportesHelpers'

// ── Custom Tooltip for Chart ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="premium-panel p-4 shadow-2xl min-w-[180px]">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex justify-between items-center gap-4 text-xs font-bold mb-1.5 last:mb-0">
                    <span style={{ color: p.color }} className="font-extrabold">{p.name === 'ingresos' ? 'Ingresos' : p.name === 'egresos' ? 'Egresos' : 'Saldo'}</span>
                    <span className="text-white tabular-nums">${Math.floor(p.value).toLocaleString()}</span>
                </div>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL — ReportesView
// ─────────────────────────────────────────────────────────────────────────────
const ReportesView = () => {
    const [reportType, setReportType] = useState('diario')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    // Columna de fecha según tipo de reporte
    let dateCol = 'fecha'
    let currentSortColumn = sortColumn

    if (reportType === 'semanal') {
        dateCol = 'semana_del'
        if (currentSortColumn === 'fecha') currentSortColumn = 'semana_del'
    } else if (reportType === 'mensual') {
        dateCol = 'anio'
        if (currentSortColumn === 'fecha' || currentSortColumn === 'semana_del') currentSortColumn = 'anio'
    }

    const { data: fetchedData, loading } = useReporte(reportType, {
        sortColumn: currentSortColumn,
        sortOrder,
        filterColumn: dateCol === 'anio' ? undefined : dateCol,
        filterValue,
        dateRange: (dateRange.start || dateRange.end) && reportType !== 'mensual' ? dateRange : undefined,
        dateColumn: dateCol
    })

    const data = useMemo(() => fetchedData || [], [fetchedData])

    // Formateo de datos para el gráfico
    const chartData = useMemo(() => {
        return [...data].reverse().map(item => ({
            name: reportType === 'diario'
                ? item.fecha
                : reportType === 'semanal'
                    ? item.semana_del
                    : `${MES_NAMES[Number(item.mes)]?.slice(0, 3) || item.mes}/${String(item.anio).slice(-2)}`,
            ingresos: Number(item.ingresos || 0),
            egresos: Number(item.egresos || 0),
            saldo: Number(item.saldo || 0)
        }))
    }, [data, reportType])

    const handleReportTypeChange = (type) => {
        setReportType(type)
        setFilterValue('')
        if (type === 'diario') setSortColumn('fecha')
        if (type === 'semanal') setSortColumn('semana_del')
        if (type === 'mensual') setSortColumn('anio')
    }

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    // Columnas de la tabla según el tipo de periodo
    const columns = useMemo(() => {
        const common = [
            { key: 'cant_ventas', label: 'Ventas', render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-jade animate-pulse" />
                    <span className="font-bold text-slate-300 tabular-nums">{val}</span>
                </div>
            )},
            { key: 'cant_compras', label: 'Compras', render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-ruby" />
                    <span className="font-bold text-slate-450 tabular-nums">{val}</span>
                </div>
            )},
            { key: 'ingresos', label: 'Ingresos', render: (val) => <span className="font-black text-brand-jade tabular-nums">${Math.floor(val).toLocaleString()}</span> },
            { key: 'egresos', label: 'Egresos', render: (val) => <span className="font-black text-brand-ruby tabular-nums">${Math.floor(val).toLocaleString()}</span> },
            { key: 'saldo', label: 'Balance Neto', render: (val) => (
                <div className="flex items-center gap-1.5">
                    {val >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 text-brand-indigo" /> : <ArrowDownRight className="h-3.5 w-3.5 text-brand-ruby" />}
                    <span className={`font-black tabular-nums ${val >= 0 ? 'text-brand-indigo' : 'text-brand-ruby'}`}>${Math.floor(val).toLocaleString()}</span>
                </div>
            )},
        ]

        if (reportType === 'diario') {
            return [{ key: 'fecha', label: 'Fecha', render: (val) => {
                if (!val) return ''
                const [y, m, d] = val.split('-')
                const date = new Date(Number(y), Number(m) - 1, Number(d))
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' })
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-wider text-slate-550 font-black w-8">{dayName}</span>
                        <span className="font-bold text-slate-200">{d}/{m}/{y}</span>
                    </div>
                )
            }}, ...common]
        }

        if (reportType === 'semanal') {
            return [{ key: 'semana_del', label: 'Semana del', render: (val) => {
                if (!val) return ''
                const [y, m, d] = val.split('-')
                const start = new Date(Number(y), Number(m) - 1, Number(d))
                const end = new Date(start)
                end.setDate(start.getDate() + 6)
                const endStr = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{d}/{m}/{y}</span>
                        <ArrowRight className="h-3 w-3 text-slate-650" />
                        <span className="font-bold text-slate-400">{endStr}</span>
                    </div>
                )
            }}, ...common]
        }

        if (reportType === 'mensual') {
            return [{ key: 'mes', label: 'Mes', render: (val, row) => (
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-550 font-black tracking-wider w-8">{row.anio}</span>
                    <span className="font-bold text-slate-200">{MES_NAMES[Number(val)] || val}</span>
                </div>
            )}, ...common]
        }
        return common
    }, [reportType])

    // Totales acumulados del periodo visible
    const totals = useMemo(() => data.reduce((acc, curr) => ({
        ventas: acc.ventas + Number(curr.cant_ventas || 0),
        compras: acc.compras + Number(curr.cant_compras || 0),
        ingresos: acc.ingresos + Number(curr.ingresos || 0),
        egresos: acc.egresos + Number(curr.egresos || 0),
        balance: acc.balance + Number(curr.saldo || 0),
    }), { ventas: 0, compras: 0, ingresos: 0, egresos: 0, balance: 0 }), [data])

    const ticketPromedio = totals.ventas > 0 ? totals.ingresos / totals.ventas : 0
    const margenNetoTotal = totals.ingresos > 0 ? (totals.balance / totals.ingresos) * 100 : 0

    // Lógica de tendencias
    const trends = useMemo(() => {
        if (data.length < 2) return { ingresos: 0, egresos: 0, ticket: 0, balance: 0 }
        const curr = data[0]
        const prev = data[1]
        const getTrend = (c, p) => (p > 0 ? ((c - p) / p) * 100 : 0)
        const currTicket = curr.cant_ventas > 0 ? curr.ingresos / curr.cant_ventas : 0
        const prevTicket = prev.cant_ventas > 0 ? prev.ingresos / prev.cant_ventas : 0
        return {
            ingresos: getTrend(Number(curr.ingresos), Number(prev.ingresos)),
            egresos: getTrend(Number(curr.egresos), Number(prev.egresos)),
            ticket: getTrend(currTicket, prevTicket),
            balance: getTrend(Number(curr.saldo), Number(prev.saldo))
        }
    }, [data])

    // Top productos
    const { data: topProductsData, loading: loadingTop } = useReporteVentasPeriodico({
        filterColumn: 'tipo_periodo',
        filterValue: reportType.toUpperCase(),
        sortColumn: 'ganancia_total',
        sortOrder: 'desc',
        dateRange: (dateRange.start || dateRange.end) && reportType !== 'mensual' ? dateRange : undefined,
        dateColumn: 'periodo_inicio',
        pageSize: 1000
    })

    const aggregatedTopData = useMemo(() => {
        if (!topProductsData) return []
        const map = topProductsData.reduce((acc, curr) => {
            const name = curr.producto?.trim() || 'Sin Nombre'
            if (!acc[name]) {
                acc[name] = { ...curr, producto: name }
            } else {
                acc[name].ganancia_total = Number(acc[name].ganancia_total || 0) + Number(curr.ganancia_total || 0)
                acc[name].recaudacion_total = Number(acc[name].recaudacion_total || 0) + Number(curr.recaudacion_total || 0)
                acc[name].cantidad_total = Number(acc[name].cantidad_total || 0) + Number(curr.cantidad_total || 0)
            }
            return acc
        }, {})
        return Object.values(map).sort((a, b) => b.ganancia_total - a.ganancia_total).slice(0, 5)
    }, [topProductsData])

    const gananciaReal = useMemo(() => {
        if (!topProductsData || !topProductsData.length) return { total: 0, productos: 0 }
        const map = topProductsData.reduce((acc, curr) => {
            const name = curr.producto?.trim() || 'Sin Nombre'
            if (!acc[name]) {
                acc[name] = { ganancia_total: Number(curr.ganancia_total || 0), recaudacion_total: Number(curr.recaudacion_total || 0) }
            } else {
                acc[name].ganancia_total += Number(curr.ganancia_total || 0)
                acc[name].recaudacion_total += Number(curr.recaudacion_total || 0)
            }
            return acc
        }, {})
        const CON_COSTO_THRESHOLD = 0.001
        const conCosto = Object.values(map).filter(p =>
            p.recaudacion_total > 0 && p.ganancia_total < (p.recaudacion_total - CON_COSTO_THRESHOLD)
        )
        return { total: conCosto.reduce((s, p) => s + p.ganancia_total, 0), productos: conCosto.length }
    }, [topProductsData])

    // Ganancia Real Promedio Diario (Ponderada por mes actual y recencia)
    const gananciaRealPromedioDiario = useMemo(() => {
        if (!topProductsData || !topProductsData.length) return { valor: 0, modo: 'Sin datos', diasMesActual: 0 }
        
        const CON_COSTO_THRESHOLD = 0.001
        const itemsConCosto = topProductsData.filter(p =>
            Number(p.recaudacion_total || 0) > 0 && 
            Number(p.ganancia_total || 0) < (Number(p.recaudacion_total || 0) - CON_COSTO_THRESHOLD)
        )

        if (!itemsConCosto.length) return { valor: 0, modo: 'Sin costo reg.', diasMesActual: 0 }

        // Agrupar por fecha (YYYY-MM-DD)
        const porFecha = {}
        itemsConCosto.forEach(p => {
            const fecha = p.periodo_inicio || p.fecha
            if (!fecha) return
            const dateKey = String(fecha).slice(0, 10)
            porFecha[dateKey] = (porFecha[dateKey] || 0) + Number(p.ganancia_total || 0)
        })

        // Agrupar por Mes (YYYY-MM)
        const porMes = {}
        Object.entries(porFecha).forEach(([dateStr, ganancia]) => {
            const monthKey = dateStr.slice(0, 7)
            if (!porMes[monthKey]) {
                porMes[monthKey] = { total: 0, diasSet: new Set() }
            }
            porMes[monthKey].total += ganancia
            porMes[monthKey].diasSet.add(dateStr)
        })

        const mesesOrdenados = Object.keys(porMes).sort().reverse()
        if (!mesesOrdenados.length) return { valor: 0, modo: 'Sin datos', diasMesActual: 0 }

        const mesActualKey = mesesOrdenados[0]
        const diasMesActual = porMes[mesActualKey].diasSet.size
        const totalMesActual = porMes[mesActualKey].total
        const promMesActual = diasMesActual > 0 ? totalMesActual / diasMesActual : 0

        let ponderadoFinal = 0
        let modoTag = ''

        if (diasMesActual >= 10) {
            // Regla >= 10 días: 75% mes actual, 15% mes -1, 5% mes -2, 5% resto anterior
            const pMesActual = promMesActual
            
            // Mes -1
            let pMesPrevio1 = pMesActual
            if (mesesOrdenados.length > 1) {
                const mKey = mesesOrdenados[1]
                const d = porMes[mKey].diasSet.size
                if (d > 0) pMesPrevio1 = porMes[mKey].total / d
            }

            // Mes -2
            let pMesPrevio2 = pMesPrevio1
            if (mesesOrdenados.length > 2) {
                const mKey = mesesOrdenados[2]
                const d = porMes[mKey].diasSet.size
                if (d > 0) pMesPrevio2 = porMes[mKey].total / d
            }

            // Mes -3 y anteriores (distribuido / promedio de los restantes)
            let pRestoAnteriores = pMesPrevio2
            if (mesesOrdenados.length > 3) {
                let sumaProm = 0
                let cantMeses = 0
                for (let i = 3; i < mesesOrdenados.length; i++) {
                    const mKey = mesesOrdenados[i]
                    const d = porMes[mKey].diasSet.size
                    if (d > 0) {
                        sumaProm += porMes[mKey].total / d
                        cantMeses++
                    }
                }
                if (cantMeses > 0) pRestoAnteriores = sumaProm / cantMeses
            }

            ponderadoFinal = (pMesActual * 0.75) + (pMesPrevio1 * 0.15) + (pMesPrevio2 * 0.05) + (pRestoAnteriores * 0.05)
            modoTag = `Mes act. (${diasMesActual}d ≥ 10)`
        } else {
            // Mes actual <= 10 días: se apoya en el resto de meses ponderados por recencia
            let sumaPesos = 0
            let sumaPonderada = 0

            if (mesesOrdenados.length > 1) {
                mesesOrdenados.slice(1).forEach((mKey, idx) => {
                    const dias = porMes[mKey].diasSet.size
                    if (dias === 0) return
                    const prom = porMes[mKey].total / dias
                    const peso = Math.pow(0.6, idx)
                    sumaPonderada += prom * peso
                    sumaPesos += peso
                })
                const promMesesAnteriores = sumaPesos > 0 ? sumaPonderada / sumaPesos : promMesActual
                const pesoMesActual = (diasMesActual / 10) * 0.3
                ponderadoFinal = (promMesActual * pesoMesActual) + (promMesesAnteriores * (1 - pesoMesActual))
                modoTag = `Histórico (${diasMesActual}d mes act.)`
            } else {
                ponderadoFinal = promMesActual
                modoTag = `Mes act. (${diasMesActual}d)`
            }
        }

        return {
            valor: Math.round(ponderadoFinal),
            modo: modoTag,
            diasMesActual
        }
    }, [topProductsData])

    return (
        <div className="space-y-6 pb-28 animate-fade-in-up">

            {/* Encabezado */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-1 w-6 bg-brand-indigo rounded-full" />
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-brand-indigo">Kiosco Estadísticas</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                        <FileBarChart className="h-7 w-7 text-brand-indigo" />
                        <span>Reportes Comerciales</span>
                    </h2>
                    <p className="text-slate-500 font-bold mt-1 text-xs">Análisis de rendimiento, rentabilidad y flujo de caja diario, semanal y mensual.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                    <div className="flex bg-white/[0.015] border border-white/5 p-1 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                        {['diario', 'semanal', 'mensual'].map((type) => (
                            <button
                                key={type}
                                onClick={() => handleReportTypeChange(type)}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                                    reportType === type
                                        ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/10'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    {reportType !== 'mensual' && (
                        <div className="flex items-center gap-1.5 bg-white/[0.015] p-2 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <input 
                                type="date" 
                                className="bg-transparent border-none text-white text-xs font-extrabold focus:ring-0 outline-none w-28 cursor-pointer" 
                                value={dateRange.start} 
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} 
                            />
                            <ChevronRight className="h-3 w-3 text-slate-600" />
                            <input 
                                type="date" 
                                className="bg-transparent border-none text-white text-xs font-extrabold focus:ring-0 outline-none w-28 cursor-pointer" 
                                value={dateRange.end} 
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <KPICard title="Ingresos Totales" value={`$${Math.floor(totals.ingresos).toLocaleString()}`} subValue={`${totals.ventas} tickets generados`} trend={trends.ingresos} icon={ShoppingCart} colorClass="text-brand-jade" accentBg="bg-brand-jade" />
                <KPICard title="Egresos / Gastos" value={`$${Math.floor(totals.egresos).toLocaleString()}`} subValue={`${totals.compras} compras cargadas`} trend={trends.egresos} icon={Package} colorClass="text-brand-ruby" accentBg="bg-brand-ruby" />
                <KPICard title="Ticket Promedio" value={`$${Math.floor(ticketPromedio).toLocaleString()}`} subValue="Ingreso medio por venta" trend={trends.ticket} icon={CreditCard} colorClass="text-slate-200" accentBg="bg-slate-200" />
                <KPICard title="Balance Neto" value={`$${Math.floor(totals.balance).toLocaleString()}`} subValue={`Margen: ${margenNetoTotal.toFixed(1)}%`} trend={trends.balance} icon={totals.balance >= 0 ? TrendingUp : TrendingDown} colorClass={totals.balance >= 0 ? 'text-brand-jade' : 'text-brand-ruby'} accentBg={totals.balance >= 0 ? 'bg-brand-jade' : 'bg-brand-ruby'} />

                {/* Ganancia Real Promedio Día */}
                <div className="relative overflow-hidden p-6 rounded-3xl border border-brand-indigo/15 bg-slate-900/40 shadow-xl hover:border-brand-indigo/20 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-brand-indigo" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-brand-indigo"><TrendingUp className="h-5 w-5" /></div>
                            {loadingTop ? <div className="w-16 h-5 bg-white/5 rounded-lg animate-pulse" /> : (
                                <div className="flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-xl bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/15">
                                    {gananciaRealPromedioDiario.modo}
                                </div>
                            )}
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-505 mb-2">Ganancia Real / Día</h4>
                        <div className="flex flex-col gap-1">
                            {loadingTop ? <div className="w-28 h-8 bg-white/5 rounded-xl animate-pulse" /> : <span className="text-3xl font-black text-white tracking-tight tabular-nums font-outfit">${gananciaRealPromedioDiario.valor.toLocaleString()}</span>}
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Promedio ponderado por recencia</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 premium-panel p-5 h-[340px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                <BarChart2 className="h-4.5 w-4.5 text-brand-indigo" />
                                <span>Evolución del Flujo de Caja</span>
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-1 font-bold">Ingresos vs Egresos — {reportType === 'diario' ? 'por día' : reportType === 'semanal' ? 'por semana' : 'por mes'}</p>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-jade" />Ingresos</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-ruby" />Egresos</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="80%" debounce={50}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="oklch(0.72 0.16 150)" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="oklch(0.72 0.16 150)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="oklch(0.65 0.20 15)" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="oklch(0.65 0.20 15)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => {
                                if (reportType === 'diario' && val?.includes('-')) {
                                    const parts = val.split('-')
                                    return `${parts[2]}/${parts[1]}`
                                }
                                return val
                            }} />
                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="ingresos" stroke="oklch(0.72 0.16 150)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIngresos)" dot={false} activeDot={{ r: 4, fill: 'oklch(0.72 0.16 150)' }} />
                            <Area type="monotone" dataKey="egresos" stroke="oklch(0.65 0.20 15)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEgresos)" dot={false} activeDot={{ r: 4, fill: 'oklch(0.65 0.20 15)' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="premium-panel p-5 h-[340px] flex flex-col">
                    <div className="mb-5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <Target className="h-4.5 w-4.5 text-brand-jade animate-pulse" />
                            <span>Top 5 — Ganancia Real</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold">Productos más rentables del periodo</p>
                    </div>
                    <div className="flex-1">
                        {loadingTop ? (
                            <div className="space-y-3 mt-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-white/5 rounded-xl animate-pulse" />)}</div>
                        ) : aggregatedTopData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-600 text-xs italic font-bold">Sin datos disponibles</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <BarChart layout="vertical" data={aggregatedTopData} margin={{ left: 15, right: 55, top: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="producto" type="category" axisLine={false} tickLine={false} fontSize={10} width={100} tick={{ fill: '#94a3b8', fontWeight: 700 }} />
                                    <Tooltip cursor={{ fill: '#ffffff04' }} content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null
                                        const d = payload[0].payload
                                        return (
                                            <div className="premium-panel p-3 text-[10px] font-bold space-y-1">
                                                <p className="text-white font-extrabold">{d.producto}</p>
                                                <p className="text-brand-jade">Ganancia: ${Math.floor(d.ganancia_total).toLocaleString()}</p>
                                                <p className="text-slate-400">Cantidad: {Number(d.cantidad_total || 0).toLocaleString()}</p>
                                            </div>
                                        )
                                    }} />
                                    <Bar dataKey="ganancia_total" radius={[0, 6, 6, 0]} barSize={18}>
                                        {aggregatedTopData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? 'oklch(0.72 0.16 150)' : `oklch(0.72 0.16 150 / ${0.7 - index * 0.12})`} />
                                        ))}
                                        <LabelList dataKey="ganancia_total" position="right" fill="#64748b" fontSize={10} fontWeight="bold" formatter={(val) => `$${Math.floor(val / 1000)}k`} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla de datos */}
            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={setFilterValue}
                renderExpandedRow={(item) => <ExpandedPeriodPanel item={item} reportType={reportType} />}
                rowKey={(row) =>
                    reportType === 'diario' ? row.fecha :
                    reportType === 'semanal' ? row.semana_del :
                    `${row.mes}-${row.anio}`
                }
                minWidth="800px"
            />

            {/* Barra flotante inferior */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none px-2 pb-4 sm:pb-6 sm:px-4">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-950/85 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl p-3 md:px-8 md:py-3.5 grid grid-cols-3 md:flex md:flex-row items-center justify-between w-full max-w-4xl mx-auto pointer-events-auto gap-2 md:gap-10"
                >
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-jade mb-0.5">Ingresos</span>
                        <span className="text-base md:text-lg font-black text-white tabular-nums">${Math.floor(totals.ingresos).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-ruby mb-0.5">Egresos</span>
                        <span className="text-base md:text-lg font-black text-white tabular-nums">${Math.floor(totals.egresos).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-indigo mb-0.5">Balance Neto</span>
                        <span className={`text-base md:text-lg font-black tabular-nums ${totals.balance >= 0 ? 'text-brand-jade' : 'text-brand-ruby'}`}>${Math.floor(totals.balance).toLocaleString()}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 border-l border-white/10 pl-10">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Ticket Prom.</span>
                            <span className="text-base font-black text-slate-300 tabular-nums">${Math.floor(ticketPromedio).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Operaciones</span>
                            <span className="text-base font-black text-slate-300 tabular-nums">{(totals.ventas + totals.compras).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Margen</span>
                            <span className={`text-base font-black tabular-nums ${margenNetoTotal >= 0 ? 'text-brand-jade' : 'text-brand-ruby'}`}>{margenNetoTotal.toFixed(1)}%</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default ReportesView
