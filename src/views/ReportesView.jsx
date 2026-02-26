import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useReporte } from '../hooks/useData'
import { FileBarChart, Calendar, ChevronRight, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

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

                <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md h-[350px] flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-6">
                        <DollarSign className="h-4 w-4 text-blue-400" />
                        Balance Acumulado
                    </h3>
                    <div className="flex-1 flex flex-col justify-center items-center gap-2">
                        <span className={`text-5xl font-black tabular-nums tracking-tighter ${totals.balance >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                            ${totals.balance.toLocaleString()}
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">Total en el periodo</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/20 rounded-3xl border border-white/5 overflow-hidden">
                <DataTable
                    data={data}
                    columns={getColumns()}
                    isLoading={loading}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortOrder={sortOrder}
                    onFilter={setFilterValue}
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
