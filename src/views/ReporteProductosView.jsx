import React, { useState, useRef, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useReporteVentasPeriodico, usePredictiveStock } from '../hooks/useData'
import { BarChart3, Search, ChevronLeft, ChevronRight, BrainCircuit, AlertTriangle } from 'lucide-react'
import ProductAutocomplete from '../components/ProductAutocomplete'
import { ProductPivotTable } from './reportes/ProductPivotTable'

const ProductSearchInput = ({ value, onChange }) => (
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

const renderSearchInput = (value, onChange) => <ProductSearchInput value={value} onChange={onChange} />

const ReporteProductosView = () => {
    const [periodType, setPeriodType] = useState('DIARIO')
    const [viewMode, setViewMode] = useState('PIVOT') // PIVOT, LIST or PREDICTION
    const [sortColumn, setSortColumn] = useState('periodo_inicio')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    const { data: prediccionData, loading: loadingPrediccion } = usePredictiveStock({
        sortColumn: 'dias_restantes',
        sortOrder: 'asc'
    })

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

    const columns = useMemo(() => [
        { key: 'producto', label: 'Producto', width: 'w-1/3', wrap: true },
        {
            key: 'periodo_inicio',
            label: 'Periodo',
            render: (val) => {
                if (!val) return ''
                // Parse YYYY-MM-DD as local date to avoid timezone shift
                const [year, month, day] = val.split('-').map(Number)
                const date = new Date(year, month - 1, day)

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
    ], [periodType])

    const predictionColumns = useMemo(() => [
        { key: 'producto', label: 'Producto', width: 'w-1/3', wrap: true },
        { key: 'stock_actual', label: 'Stock Actual', render: (val) => <span className="font-bold text-slate-300">{val}</span> },
        { key: 'ventas_promedio_dia', label: 'Ritmo Venta (Día)', render: (val) => (val || 0).toFixed(2) },
        { 
            key: 'dias_restantes', 
            label: 'Días Restantes', 
            render: (val) => {
                const colors = val < 3 ? 'text-rose-500 bg-rose-500/10' : val < 7 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'
                return <span className={`px-2 py-1 rounded-lg font-black ${colors}`}>{val} días</span>
            }
        },
        { 
            key: 'fecha_agotamiento', 
            label: 'Agotamiento Est.', 
            render: (val) => {
                if (!val) return 'N/A'
                const [y, m, d] = val.split('-')
                return <span className="font-bold text-slate-400">{d}/{m}/{y}</span>
            }
        }
    ], [])

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder(['cantidad_total', 'recaudacion_total'].includes(column) ? 'desc' : 'asc')
        }
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
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                    <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 shrink-0" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">Ventas por Producto</span>
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-gray-900 p-2 rounded-xl border border-gray-800 w-full lg:w-auto">
                    <div className="flex bg-gray-800 p-1 rounded-lg justify-center sm:justify-start">
                        {['DIARIO', 'SEMANAL', 'MENSUAL'].map((type) => (
                            <button type="button"
                                key={type}
                                onClick={() => setPeriodType(type)}
                                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all min-h-[36px] ${periodType === type
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>

                    <div className="flex bg-gray-800 p-1 rounded-lg justify-center sm:justify-start">
                        <button type="button"
                            onClick={() => setViewMode('PIVOT')}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all min-h-[36px] ${viewMode === 'PIVOT'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Pivote
                        </button>
                        <button type="button"
                            onClick={() => setViewMode('LIST')}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all min-h-[36px] ${viewMode === 'LIST'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Lista
                        </button>
                        <button type="button"
                            onClick={() => setViewMode('PREDICTION')}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 min-h-[36px] ${viewMode === 'PREDICTION'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <BrainCircuit className="h-3.5 w-3.5" />
                            Predicción
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'PREDICTION' ? (
                <DataTable
                    data={prediccionData}
                    columns={predictionColumns}
                    isLoading={loadingPrediccion}
                    onSort={(col) => console.log('Sort by', col)}
                    sortColumn="dias_restantes"
                    sortOrder="asc"
                    onFilter={setFilterValue}
                    renderSearchInput={renderSearchInput}
                    rowKey="producto"
                    compact={true}
                    minWidth="800px"
                />
            ) : viewMode === 'LIST' ? (
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
                    minWidth="750px"
                />
            ) : (
                <ProductPivotTable
                    renderSearchInput={renderSearchInput}
                    filterValue={filterValue}
                    setFilterValue={setFilterValue}
                    pivotData={pivotData}
                    periodType={periodType}
                    loading={loading}
                />
            )}
        </div>
    )
}

export default ReporteProductosView
