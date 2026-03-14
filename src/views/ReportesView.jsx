import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useReporte, useReporteVentasPeriodico } from '../hooks/useData'
import { FileBarChart, Calendar, ChevronRight, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts'
import { ShoppingCart, Package, ArrowUpRight, ArrowDownRight, Activity, Clock, Tag } from 'lucide-react'

const ReportesView = () => {
    const [reportType, setReportType] = useState('diario')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    // Prepare options for the hook
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

    const chartData = useMemo(() => {
        return [...data].reverse().map(item => ({
            name: reportType === 'diario' ? item.fecha : reportType === 'semanal' ? item.semana_del : `${item.mes}/${item.anio}`,
            ingresos: Number(item.ingresos || 0),
            egresos: Number(item.egresos || 0),
            saldo: Number(item.saldo || 0)
        }))
    }, [data, reportType])

    const handleReportTypeChange = (type) => {
        setReportType(type)
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

    const getColumns = () => {
        const common = [
            { key: 'cant_ventas', label: 'Ventas (#)', render: (val) => <span className="font-bold text-slate-400">{val}</span> },
            { key: 'cant_compras', label: 'Compras (#)', render: (val) => <span className="font-bold text-slate-500">{val}</span> },
            { key: 'ingresos', label: 'Ingresos', render: (val) => <span className="font-black text-emerald-400 tabular-nums">${val}</span> },
            { key: 'egresos', label: 'Egresos', render: (val) => <span className="font-black text-rose-400 tabular-nums">${val}</span> },
            { key: 'saldo', label: 'Balance', render: (val) => <span className={`font-black tabular-nums ${val >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>${val}</span> },
        ]

        if (reportType === 'diario') {
            return [{
                key: 'fecha', label: 'Fecha', render: (val) => {
                    if (!val) return ''
                    const [y, m, d] = val.split('-')
                    return <span className="font-bold text-slate-200">{d}/{m}/{y}</span>
                }
            }, ...common]
        }
        if (reportType === 'semanal') {
            return [{
                key: 'semana_del', label: 'Semana Del', render: (val) => {
                    if (!val) return ''
                    const [y, m, d] = val.split('-')
                    return <span className="font-bold text-slate-200">{d}/{m}/{y}</span>
                }
            }, ...common]
        }
        if (reportType === 'mensual') {
            return [
                { key: 'anio', label: 'Año', render: (val) => <span className="font-bold text-slate-200">{val}</span> },
                { key: 'mes', label: 'Mes', render: (val) => <span className="font-bold text-slate-400">{val}</span> },
                ...common
            ]
        }
        return common
    }

    const totals = data.reduce((acc, curr) => ({
        ventas: acc.ventas + Number(curr.cant_ventas || 0),
        compras: acc.compras + Number(curr.cant_compras || 0),
        ingresos: acc.ingresos + Number(curr.ingresos || 0),
        egresos: acc.egresos + Number(curr.egresos || 0),
        balance: acc.balance + Number(curr.saldo || 0),
    }), { ventas: 0, compras: 0, ingresos: 0, egresos: 0, balance: 0 })

    const ticketPromedio = totals.ventas > 0 ? totals.ingresos / totals.ventas : 0

    // Trends calculation (comparing first two rows representing the last two periods)
    const trends = useMemo(() => {
        if (data.length < 2) return { ingresos: 0, egresos: 0, ticket: 0 }
        const curr = data[0]
        const prev = data[1]

        const getTrend = (c, p) => p > 0 ? ((c - p) / p) * 100 : 0
        
        const currTicket = curr.cant_ventas > 0 ? curr.ingresos / curr.cant_ventas : 0
        const prevTicket = prev.cant_ventas > 0 ? prev.ingresos / prev.cant_ventas : 0

        return {
            ingresos: getTrend(curr.ingresos, prev.ingresos),
            egresos: getTrend(curr.egresos, prev.egresos),
            ticket: getTrend(currTicket, prevTicket)
        }
    }, [data])

    const KPICard = ({ title, value, subValue, trend, icon: Icon, colorClass, gradient }) => (
        <motion.div
            whileHover={{ y: -5 }}
            className="relative overflow-hidden p-6 rounded-3xl border border-white/10 backdrop-blur-md bg-slate-900/40 group"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 ${gradient}`} />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(trend).toFixed(1)}%
                        </div>
                    )}
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</h4>
                <div className="flex flex-col">
                    <span className="text-3xl font-black text-white tracking-tight tabular-nums">
                        {value}
                    </span>
                    {subValue && <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{subValue}</span>}
                </div>
            </div>
        </motion.div>
    )

    const { data: topProductsData, loading: loadingTop } = useReporteVentasPeriodico({
        filterColumn: 'tipo_periodo',
        filterValue: reportType.toUpperCase(),
        sortColumn: 'cantidad_total',
        sortOrder: 'desc',
        pageSize: 5
    })

    const DayMix = ({ item, type }) => {
        const date = type === 'diario' ? item.fecha : type === 'semanal' ? item.semana_del : item.anio;
        
        const { data, loading } = useReporteVentasPeriodico({
            filterColumn: 'tipo_periodo',
            filterValue: type.toUpperCase(),
            dateColumn: 'periodo_inicio',
            dateRange: { start: date, end: date },
            sortColumn: 'cantidad_total',
            sortOrder: 'desc',
            pageSize: 5
        })

        if (loading) return (
            <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-white/5 rounded-md animate-pulse" />)}
            </div>
        )

        if (!data.length) return <span className="text-[10px] text-slate-500 italic font-medium">Sin datos de productos</span>

        return (
            <div className="space-y-1">
                {data.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center group/item hover:bg-white/5 p-1 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            <span className="text-[10px] text-slate-300 font-bold truncate max-w-[120px]">{p.producto}</span>
                        </div>
                        <span className="text-[10px] font-black text-white tabular-nums">
                            {p.cantidad_total} <span className="text-[8px] text-slate-500 uppercase">u.</span>
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    const renderExpandedRow = (item) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 space-y-4">
                <h5 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Resumen Día
                </h5>
                <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Ticket Promedio</span>
                        <span className="text-xs font-black text-white">${(item.ingresos / (item.cant_ventas || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Eficiencia C/V</span>
                        <span className="text-xs font-black text-white">{(item.cant_compras / (item.cant_ventas || 1)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 lg:col-span-2">
                <h5 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-4">
                    <Tag className="h-4 w-4" /> Top Productos del Día
                </h5>
                <DayMix item={item} type={reportType} />
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 space-y-4">
                <h5 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Flujo Caja
                </h5>
                <div className="space-y-1 text-[10px] font-bold">
                    <div className="flex justify-between text-emerald-400">
                        <span>INGRESOS</span>
                        <span>${item.ingresos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                        <span>EGRESOS</span>
                        <span>${item.egresos.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between text-white text-xs">
                        <span>SALDO</span>
                        <span>${item.saldo.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-32"
        >
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <FileBarChart className="h-10 w-10 text-blue-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Reportes
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Análisis detallado de movimientos y rentabilidad.</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                        {['diario', 'semanal', 'mensual'].map((type) => (
                            <button
                                key={type}
                                onClick={() => handleReportTypeChange(type)}
                                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {reportType !== 'mensual' && (
                        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                            <Calendar className="h-4 w-4 text-slate-500 ml-2" />
                            <input
                                type="date"
                                className="bg-transparent border-none text-white text-xs font-bold focus:ring-0 w-32"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <ChevronRight className="h-3 w-3 text-slate-700" />
                            <input
                                type="date"
                                className="bg-transparent border-none text-white text-xs font-bold focus:ring-0 w-32"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Ventas (Ingresos)"
                    value={`$${totals.ingresos.toLocaleString()}`}
                    subValue={`${totals.ventas} tickets generados`}
                    trend={trends.ingresos}
                    icon={ShoppingCart}
                    colorClass="text-emerald-400"
                    gradient="bg-emerald-500"
                />
                <KPICard 
                    title="Gastos (Egresos)"
                    value={`$${totals.egresos.toLocaleString()}`}
                    subValue={`${totals.compras} facturas cargadas`}
                    trend={trends.egresos}
                    icon={Package}
                    colorClass="text-rose-400"
                    gradient="bg-rose-500"
                />
                <KPICard 
                    title="Ticket Promedio"
                    value={`$${ticketPromedio.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    subValue="Por cada venta realizada"
                    trend={trends.ticket}
                    icon={DollarSign}
                    colorClass="text-blue-400"
                    gradient="bg-blue-500"
                />
                <KPICard 
                    title="Balance Neto"
                    value={`$${totals.balance.toLocaleString()}`}
                    subValue="Resultado del periodo"
                    trend={undefined}
                    icon={Activity}
                    colorClass={totals.balance >= 0 ? "text-emerald-400" : "text-rose-400"}
                    gradient={totals.balance >= 0 ? "bg-emerald-500" : "bg-rose-500"}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md h-[350px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            Flujo de Caja
                        </h3>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => reportType === 'diario' ? val.split('-')[2] : val}
                            />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                            <Area type="monotone" dataKey="egresos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorEgresos)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md h-[350px] flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 -mr-24 -mt-24 rounded-full blur-[80px] bg-blue-500/20 group-hover:bg-blue-500/30 transition-all duration-500" />
                    
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-6 relative z-10">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        Top 5 Productos
                    </h3>
                    
                    <div className="flex-1 relative z-10">
                        {loadingTop ? (
                            <div className="animate-spin h-8 w-8 text-blue-500 mx-auto mt-20" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={topProductsData}
                                    margin={{ left: 20, right: 20, top: 0, bottom: 0 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="producto" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        fontSize={10} 
                                        width={100}
                                        tick={{ fill: '#94a3b8', fontWeight: 700 }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="cantidad_total" radius={[0, 4, 4, 0]} barSize={20}>
                                        {topProductsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#3b82f680'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/20 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
                <DataTable
                    data={data}
                    columns={getColumns()}
                    isLoading={loading}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortOrder={sortOrder}
                    onFilter={setFilterValue}
                    renderExpandedRow={renderExpandedRow}
                    rowKey={(row) => 
                        reportType === 'diario' ? row.fecha : 
                        reportType === 'semanal' ? row.semana_del : 
                        `${row.mes}-${row.anio}`
                    }
                />
            </div>

            {/* Floating Summary Bar */}
            <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-4 md:px-8 md:py-4 flex flex-col md:flex-row items-center justify-between w-full max-w-4xl pointer-events-auto gap-4 md:gap-12"
                >
                    <div className="flex items-center gap-12 w-full md:w-auto justify-around">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Ingresos</span>
                            <span className="text-xl font-black text-white tabular-nums">${totals.ingresos.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Egresos</span>
                            <span className="text-xl font-black text-white tabular-nums">${totals.egresos.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Balance</span>
                            <span className="text-xl font-black text-white tabular-nums">${totals.balance.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 border-l border-white/10 pl-12">
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Operaciones</span>
                            <span className="text-xl font-black text-slate-300 tabular-nums">{totals.ventas + totals.compras}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default ReportesView
