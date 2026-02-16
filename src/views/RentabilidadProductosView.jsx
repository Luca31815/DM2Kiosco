import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useRentabilidadProductos } from '../hooks/useData'
import { TrendingUp, AlertTriangle, CheckCircle, Ban } from 'lucide-react'

const RentabilidadProductosView = () => {
    const [sortColumn, setSortColumn] = useState('ingresos_totales')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    // We fetch data with basic sort options, but we might do client-side sort for specific cases
    const { data: fetchedData, loading } = useRentabilidadProductos({
        sortColumn,
        sortOrder,
        filterColumn: 'producto',
        filterValue,
        pageSize: 1000
    })

    // Apply custom client-side sort logic
    const data = useMemo(() => {
        if (!fetchedData) return []
        let processedData = [...fetchedData]

        if (sortColumn === 'ganancia_neta' && sortOrder === 'desc') {
            processedData.sort((a, b) => {
                const aOk = a.prioridad === 2
                const bOk = b.prioridad === 2

                if (aOk && !bOk) return -1
                if (!aOk && bOk) return 1

                return (b.ganancia_neta || 0) - (a.ganancia_neta || 0)
            })
        }
        return processedData
    }, [fetchedData, sortColumn, sortOrder])

    const columns = [
        { key: 'producto', label: 'Producto' },
        { key: 'unidades_vendidas', label: 'U. Vendidas', render: (val) => (val || 0).toLocaleString() },
        { key: 'ingresos_totales', label: 'Ingresos', render: (val) => `$${(val || 0).toLocaleString()}` },
        { key: 'unidades_compradas', label: 'U. Compradas', render: (val) => (val || 0).toLocaleString() },
        { key: 'costo_total_compras', label: 'Costo Total', render: (val) => `$${(val || 0).toLocaleString()}` },
        { key: 'ppp_costo_unitario', label: 'Costo Unit.', render: (val) => `$${val || 0}` },
        { key: 'costo_mercaderia_vendida', label: 'CMV', render: (val) => `$${(val || 0).toLocaleString()}` },
        { key: 'ganancia_neta', label: 'Ganancia', render: (val) => <span className={`font-bold ${(val || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>${(val || 0).toLocaleString()}</span> },
        {
            key: 'estado_del_dato',
            label: 'Estado',
            render: (val) => {
                const status = val || ''
                if (status === 'OK') return <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> OK</span>
                if (status.includes('PÉRDIDA')) return <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-4 w-4" /> Pérdida</span>
                if (status.includes('FALTA COSTO')) return <span className="flex items-center gap-1 text-yellow-400"><Ban className="h-4 w-4" /> Sin Costo</span>
                return status
            }
        },
    ]

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            if (['ingresos_totales', 'unidades_vendidas', 'ganancia_neta', 'costo_total_compras', 'costo_mercaderia_vendida'].includes(column)) {
                setSortOrder('desc')
            } else {
                setSortOrder('asc')
            }
        }
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                Rentabilidad por Producto
            </h2>
            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={setFilterValue}
                rowKey="producto"
                compact={true}
            />
        </div>
    )
}

export default RentabilidadProductosView
