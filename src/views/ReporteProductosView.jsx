import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useReporteVentasPeriodico } from '../hooks/useData'
import { BarChart3, Search } from 'lucide-react'
import ProductAutocomplete from '../components/ProductAutocomplete'

const ReporteProductosView = () => {
    const [periodType, setPeriodType] = useState('DIARIO')
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                    Ventas por Producto
                </h2>

                <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
                    {['DIARIO', 'SEMANAL', 'MENSUAL'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setPeriodType(type)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${periodType === type
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

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
        </div>
    )
}

export default ReporteProductosView
