import React, { useState, useEffect } from 'react'
import DataTable from '../components/DataTable'
import { useReporte } from '../hooks/useData'
import { FileBarChart } from 'lucide-react'

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

    const data = fetchedData || []

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

                <div className="flex flex-wrap gap-4 items-center bg-gray-900 p-2 rounded-lg border border-gray-800 w-full md:w-auto overflow-x-auto">
                    {/* Report Type Selector */}
                    <div className="flex bg-gray-800 rounded-md p-1 shrink-0">
                        {['diario', 'semanal', 'mensual'].map((type) => (
                            <button
                                key={type}
                                onClick={() => handleReportTypeChange(type)}
                                className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-colors ${reportType === type ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Date Range Picker (Disabled for monthly for simplicity) */}
                    {reportType !== 'mensual' && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap overflow-x-auto pb-1 md:pb-0">
                            <span className="hidden sm:inline">Desde:</span>
                            <input
                                type="date"
                                className="bg-gray-800 border-none rounded px-2 py-1.5 text-white text-sm focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <span>Al:</span>
                            <input
                                type="date"
                                className="bg-gray-800 border-none rounded px-2 py-1.5 text-white text-sm focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Floating Summary Bar - Ensure high z-index and visible text colors */}
            <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
                <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 shadow-2xl rounded-2xl p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-around w-full max-w-4xl pointer-events-auto gap-3 md:gap-0">

                    <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-2 md:gap-0">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Ingresos</span>
                        <span className="text-base md:text-lg font-bold text-green-400 font-mono">${totals.ingresos.toLocaleString()}</span>
                    </div>

                    <div className="hidden md:block h-8 w-px bg-gray-700/50 mx-4"></div>
                    <div className="block md:hidden h-px w-full bg-gray-700/20"></div>

                    <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-2 md:gap-0">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Egresos</span>
                        <span className="text-base md:text-lg font-bold text-red-400 font-mono">${totals.egresos.toLocaleString()}</span>
                    </div>

                    <div className="hidden md:block h-8 w-px bg-gray-700/50 mx-4"></div>
                    <div className="block md:hidden h-px w-full bg-gray-700/20"></div>

                    <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-2 md:gap-0">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Balance</span>
                        <span className={`text-base md:text-lg font-bold font-mono ${totals.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            ${totals.balance.toLocaleString()}
                        </span>
                    </div>

                </div>
            </div>

            <div className="pb-32"> {/* Increased Padding bottom to prevent content intersection */}
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
