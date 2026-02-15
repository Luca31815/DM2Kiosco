import React, { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import { getRentabilidadProductos } from '../services/api'
import { TrendingUp, AlertTriangle, CheckCircle, Ban } from 'lucide-react'

const RentabilidadProductosView = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortColumn, setSortColumn] = useState('ingresos_totales')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    const columns = [
        { key: 'producto', label: 'Producto' },
        { key: 'unidades_vendidas', label: 'U. Vendidas', render: (val) => val.toLocaleString() },
        { key: 'ingresos_totales', label: 'Ingresos', render: (val) => `$${val.toLocaleString()}` },
        { key: 'unidades_compradas', label: 'U. Compradas', render: (val) => val.toLocaleString() },
        { key: 'costo_total_compras', label: 'Costo Total', render: (val) => `$${val.toLocaleString()}` },
        { key: 'ppp_costo_unitario', label: 'Costo Unit.', render: (val) => `$${val}` },
        { key: 'costo_mercaderia_vendida', label: 'CMV', render: (val) => `$${val.toLocaleString()}` },
        { key: 'ganancia_neta', label: 'Ganancia', render: (val) => <span className={`font-bold ${val >= 0 ? 'text-green-500' : 'text-red-500'}`}>${val.toLocaleString()}</span> },
        {
            key: 'estado_del_dato',
            label: 'Estado',
            render: (val) => {
                if (val === 'OK') return <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> OK</span>
                if (val.includes('PÉRDIDA')) return <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-4 w-4" /> Pérdida</span>
                if (val.includes('FALTA COSTO')) return <span className="flex items-center gap-1 text-yellow-400"><Ban className="h-4 w-4" /> Sin Costo</span>
                return val
            }
        },
    ]

    useEffect(() => {
        fetchData()
        // Auto-refresh every minute
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [sortColumn, sortOrder, filterValue])

    const fetchData = async () => {
        // Only set loading on first load to avoid flickering on auto-refresh
        if (data.length === 0) setLoading(true)
        try {
            const { data } = await getRentabilidadProductos({
                sortColumn,
                sortOrder,
                filterColumn: 'producto',
                filterValue
            })
            setData(data || [])
        } catch (error) {
            console.error('Error fetching rentabilidad:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc') // Default to ascending for text, but for numbers descent makes more sense usually. 
            // However, sticking to consistent behavior.
            if (['ingresos_totales', 'unidades_vendidas', 'ganancia_neta'].includes(column)) {
                setSortOrder('desc')
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
            />
        </div>
    )
}

export default RentabilidadProductosView
