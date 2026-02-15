import React, { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import { getReporteDiario, getReporteSemanal, getReporteMensual } from '../services/api'
import { FileBarChart } from 'lucide-react'

const ReportesView = () => {
    const [reportType, setReportType] = useState('diario')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // DataTable states
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    useEffect(() => {
        // Reset sort when type changes
        if (reportType === 'diario') setSortColumn('fecha')
        if (reportType === 'semanal') setSortColumn('semana_del')
        if (reportType === 'mensual') setSortColumn('anio')
    }, [reportType])

    useEffect(() => {
        fetchData()
        // Auto-refresh every minute
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [reportType, dateRange, sortColumn, sortOrder, filterValue])

    const fetchData = async () => {
        // Only set loading on first load to avoid flickering on auto-refresh
        if (data.length === 0) setLoading(true)
        try {
            let fetchFunc = getReporteDiario
            let dateCol = 'fecha'

            if (reportType === 'semanal') {
                fetchFunc = getReporteSemanal
                dateCol = 'semana_del'
            }
            if (reportType === 'mensual') {
                fetchFunc = getReporteMensual
                dateCol = 'anio' // Approximation for filtering, might need adjustment for strict date ranges
            }

            const { data } = await fetchFunc({
                sortColumn,
                sortOrder,
                filterColumn: dateCol === 'anio' ? undefined : dateCol, // Filtering by string might be weird for 'anio' number
                filterValue,
                // Only pass dateRange if we have values and we are not in 'mensual' mode 
                // (unless we want to filter by year range, but inputs are YYYY-MM-DD)
                dateRange: (dateRange.start || dateRange.end) && reportType !== 'mensual' ? dateRange : undefined,
                dateColumn: dateCol
            })
            setData(data || [])
        } catch (error) {
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
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
            { key: 'cant_ventas', label: 'Ventas (#)' },
            { key: 'cant_compras', label: 'Compras (#)' },
            { key: 'ingresos', label: 'Ingresos', render: (val) => <span className="text-green-400">${val}</span> },
            { key: 'egresos', label: 'Egresos', render: (val) => <span className="text-red-400">${val}</span> },
            { key: 'balance', label: 'Balance', render: (val) => <span className={`font-bold ${val >= 0 ? 'text-green-500' : 'text-red-500'}`}>${val}</span> },
        ]

        if (reportType === 'diario') {
            return [{
                key: 'fecha', label: 'Fecha', render: (val) => {
                    if (!val) return ''
                    const [y, m, d] = val.split('-')
                    return `${d}/${m}/${y}`
                }
            }, ...common]
        }
        if (reportType === 'semanal') {
            return [{
                key: 'semana_del', label: 'Semana Del', render: (val) => {
                    if (!val) return ''
                    const [y, m, d] = val.split('-')
                    return `${d}/${m}/${y}`
                }
            }, ...common]
        }
        if (reportType === 'mensual') {
            return [
                { key: 'anio', label: 'Año' },
                { key: 'mes', label: 'Mes' },
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
        balance: acc.balance + Number(curr.balance || 0),
    }), { ventas: 0, compras: 0, ingresos: 0, egresos: 0, balance: 0 })

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    <FileBarChart className="h-8 w-8 text-blue-500" />
                    Reportes
                </h2>

                <div className="flex flex-wrap gap-4 items-center bg-gray-900 p-2 rounded-lg border border-gray-800">
                    {/* Report Type Selector */}
                    <div className="flex bg-gray-800 rounded-md p-1">
                        {['diario', 'semanal', 'mensual'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setReportType(type)}
                                className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-colors ${reportType === type ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Date Range Picker (Disabled for monthly for simplicity) */}
                    {reportType !== 'mensual' && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <span className="hidden sm:inline">Desde:</span>
                            <input
                                type="date"
                                className="bg-gray-800 border-none rounded px-2 py-1.5 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <span>Hasta:</span>
                            <input
                                type="date"
                                className="bg-gray-800 border-none rounded px-2 py-1.5 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Floating Summary Bar */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-4/5 max-w-5xl">
                <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/50 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-around transition-all hover:scale-[1.01] duration-300 hover:border-blue-500/30">

                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Ingresos</span>
                        <span className="text-lg font-bold text-green-400 font-mono">${totals.ingresos.toLocaleString()}</span>
                    </div>

                    <div className="h-8 w-px bg-gray-700/50"></div>

                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Egresos</span>
                        <span className="text-lg font-bold text-red-400 font-mono">${totals.egresos.toLocaleString()}</span>
                    </div>

                    <div className="h-8 w-px bg-gray-700/50"></div>

                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Balance</span>
                        <span className={`text-lg font-bold font-mono ${totals.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            ${totals.balance.toLocaleString()}
                        </span>
                    </div>

                </div>
            </div>

            <div className="pb-24"> {/* Padding bottom to prevent content being hidden behind the fixed bar */}
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
        </div>
    )
}

export default ReportesView
