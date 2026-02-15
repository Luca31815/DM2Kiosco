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
            const { data: fetchedData } = await getRentabilidadProductos({
                // Fetch by current sortColumn/sortOrder.
                // For initial load, this will be 'ganancia_neta' desc.
                sortColumn,
                sortOrder,
                filterColumn: 'producto',
                filterValue,
                pageSize: 1000 // Ensure we get enough items for client-side re-sorting if needed
            })

            if (fetchedData) {
                let processedData = [...fetchedData];

                // Apply custom client-side sort ONLY if the current sort is the default 'ganancia_neta' desc
                // This ensures user-initiated sorts on other columns are respected.
                if (sortColumn === 'ganancia_neta' && sortOrder === 'desc') {
                    // Client-side sort to prioritize OK (prioridad = 2)
                    // SQL Schema: 1=Perdida, 2=OK, 3=Falta Costo
                    // We want OK (2) first, then by gain desc.
                    processedData.sort((a, b) => {
                        const aOk = a.prioridad === 2
                        const bOk = b.prioridad === 2

                        // If 'a' is OK and 'b' is not, 'a' comes first
                        if (aOk && !bOk) return -1
                        // If 'b' is OK and 'a' is not, 'b' comes first
                        if (!aOk && bOk) return 1

                        // If both are OK or both are not OK, sort by ganancia_neta descending
                        return (b.ganancia_neta || 0) - (a.ganancia_neta || 0)
                    })
                }
                setData(processedData)
            } else {
                setData([])
            }

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
            // Default to descending for numerical columns that represent value/gain
            if (['ingresos_totales', 'unidades_vendidas', 'ganancia_neta', 'costo_total_compras', 'costo_mercaderia_vendida'].includes(column)) {
                setSortOrder('desc')
            } else {
                setSortOrder('asc') // Default to ascending for other columns (like text)
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
