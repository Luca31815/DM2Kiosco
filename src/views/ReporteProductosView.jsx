import React, { useState, useRef } from 'react'
import DataTable from '../components/DataTable'
import { useReporteVentasPeriodico } from '../hooks/useData'
import { BarChart3, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductAutocomplete from '../components/ProductAutocomplete'

const ReporteProductosView = () => {
    const [periodType, setPeriodType] = useState('DIARIO')
    const [viewMode, setViewMode] = useState('PIVOT') // PIVOT or LIST
    const [sortColumn, setSortColumn] = useState('periodo_inicio')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('producto')

    const { data, loading } = useReporteVentasPeriodico({
        sortColumn,
        sortOrder,
        filterColumn: 'tipo_periodo',
        filterValue: periodType,
        // We handle product filtering on the hook if the hook supported it, 
        // but for now let's assume we can pass multiple filters or handle it simply.
        // Actually, our useReporteVentasPeriodico (via fetchTableData) only supports one filterColumn.
        // I should probably modify the hook or handle the secondary filter in a clever way.
        // Let's use the 'producto' as the primary filter if search is active, and filter period on client side?
        // Or better, let's just use the period as the fixed filter and filter product name on client side for now, 
        // as the data per period shouldn't be massive.
    })

    const filteredData = data.filter(item =>
        item.producto.toLowerCase().includes(filterValue.toLowerCase())
    )

    // Pivot Transformation
    const pivotData = React.useMemo(() => {
        if (viewMode !== 'PIVOT' || !filteredData.length) return { rows: [], periods: [] }

        // Get unique periods and sort them (DESC order - most recent first)
        const uniquePeriods = Array.from(new Set(filteredData.map(item => item.periodo_inicio)))
            .sort((a, b) => new Date(b) - new Date(a))

        // Group by product
        const productMap = {}
        filteredData.forEach(item => {
            if (!productMap[item.producto]) {
                productMap[item.producto] = { producto: item.producto, values: {} }
            }
            productMap[item.producto].values[item.periodo_inicio] = item.cantidad_total
        })

        return {
            rows: Object.values(productMap),
            periods: uniquePeriods
        }
    }, [filteredData, viewMode])

    const columns = [
        { key: 'producto', label: 'Producto' },
        {
            key: 'periodo_inicio',
            label: 'Periodo',
            render: (val) => {
                if (!val) return ''
                const date = new Date(val)
                if (periodType === 'MENSUAL') {
                    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
                }
                if (periodType === 'SEMANAL') {
                    return `Semana del ${date.toLocaleDateString()}`
                }
                return date.toLocaleDateString()
            }
        },
        { key: 'cantidad_total', label: 'Cantidad', render: (val) => (val || 0).toLocaleString() },
        { key: 'recaudacion_total', label: 'Recaudación', render: (val) => `$${(val || 0).toLocaleString()}` },
    ]

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder(['cantidad_total', 'recaudacion_total'].includes(column) ? 'desc' : 'asc')
        }
    }

    const renderSearchInput = (value, onChange) => {
        return (
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 z-10" />
                <ProductAutocomplete
                    value={value}
                    onChange={onChange}
                    className="pl-10"
                    placeholder="Filtrar por producto..."
                />
            </div>
        )
    }

    const scrollContainerRef = useRef(null)

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                    Ventas por Producto
                </h2>

                <div className="flex flex-wrap gap-4 items-center bg-gray-900 p-2 rounded-lg border border-gray-800">
                    <div className="flex bg-gray-800 p-1 rounded-md">
                        {['DIARIO', 'SEMANAL', 'MENSUAL'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setPeriodType(type)}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${periodType === type
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>

                    <div className="flex bg-gray-800 p-1 rounded-md">
                        <button
                            onClick={() => setViewMode('PIVOT')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'PIVOT'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Pivote
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'LIST'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Lista
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'LIST' ? (
                <DataTable
                    data={filteredData}
                    columns={columns}
                    isLoading={loading}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortOrder={sortOrder}
                    onFilter={setFilterValue}
                    renderSearchInput={renderSearchInput}
                    rowKey={(row) => `${row.producto}-${row.periodo_inicio}`}
                    compact={true}
                />
            ) : (
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl relative group">
                    <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-sm text-gray-400">Vista de Pivote (Cantidad Vendida)</span>
                        {renderSearchInput(filterValue, setFilterValue)}
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-[200px] top-1/2 -translate-y-1/2 z-30 p-2 bg-gray-900/80 border border-gray-700 rounded-full text-white shadow-xl hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                        title="Desplazar a la izquierda"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-gray-900/80 border border-gray-700 rounded-full text-white shadow-xl hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                        title="Desplazar a la derecha"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto custom-scrollbar max-h-[70vh] overflow-y-auto"
                    >
                        <table className="w-full text-sm text-left text-gray-300 border-separate border-spacing-0">
                            <thead className="sticky top-0 z-40">
                                <tr>
                                    <th className="px-6 py-4 sticky left-0 top-0 z-50 bg-gray-800 border-b border-r border-gray-700 shadow-xl min-w-[200px]">
                                        Producto
                                    </th>
                                    {pivotData.periods.map(p => (
                                        <th key={p} className="px-6 py-4 min-w-[120px] text-center whitespace-nowrap bg-gray-800 border-b border-gray-700">
                                            {periodType === 'MENSUAL'
                                                ? new Date(p).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
                                                : new Date(p).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
                                            }
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {loading && (
                                    <tr>
                                        <td colSpan={pivotData.periods.length + 1} className="px-6 py-10 text-center">
                                            <div className="flex justify-center flex-col items-center gap-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                <span>Cargando datos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && pivotData.rows.length === 0 && (
                                    <tr>
                                        <td colSpan={pivotData.periods.length + 1} className="px-6 py-10 text-center text-gray-500 italic">
                                            No se encontraron datos para los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                                {!loading && pivotData.rows.map((row) => (
                                    <tr key={row.producto} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-3 font-medium text-white sticky left-0 z-20 bg-gray-900 border-r border-gray-800 group-hover:bg-gray-800">
                                            {row.producto}
                                        </td>
                                        {pivotData.periods.map(p => (
                                            <td key={p} className="px-6 py-3 text-center border-b border-gray-800/50">
                                                {row.values[p] ? (
                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md font-mono">
                                                        {row.values[p]}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReporteProductosView
