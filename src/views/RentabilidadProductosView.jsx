import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useRentabilidadProductos } from '../hooks/useData'
import { TrendingUp, AlertTriangle, CheckCircle, Ban } from 'lucide-react'
import { motion } from 'framer-motion'

const RentabilidadProductosView = () => {
    const [sortColumn, setSortColumn] = useState('ingresos_totales')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    const { data: fetchedData, loading } = useRentabilidadProductos({
        sortColumn,
        sortOrder,
        filterColumn: 'producto',
        filterValue,
        pageSize: 1000
    })

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
        { key: 'producto', label: 'Producto', render: (val) => <span className="font-bold text-slate-200">{val}</span> },
        { key: 'unidades_vendidas', label: 'U. Vendidas', render: (val) => <span className="tabular-nums font-semibold">{(val || 0).toLocaleString()}</span> },
        { key: 'ingresos_totales', label: 'Ingresos', render: (val) => <span className="tabular-nums text-blue-400 font-bold">${(val || 0).toLocaleString()}</span> },
        { key: 'unidades_compradas', label: 'U. Compradas', render: (val) => <span className="tabular-nums text-slate-400">{(val || 0).toLocaleString()}</span> },
        { key: 'costo_total_compras', label: 'Costo Total', render: (val) => <span className="tabular-nums text-slate-400">${(val || 0).toLocaleString()}</span> },
        { key: 'ppp_costo_unitario', label: 'Costo Unit.', render: (val) => <span className="tabular-nums text-slate-500">${val || 0}</span> },
        { key: 'costo_mercaderia_vendida', label: 'CMV', render: (val) => <span className="tabular-nums text-slate-500">${(val || 0).toLocaleString()}</span> },
        { key: 'ganancia_neta', label: 'Ganancia', render: (val) => <span className={`font-black tracking-tight tabular-nums text-lg ${(val || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${(val || 0).toLocaleString()}</span> },
        {
            key: 'estado_del_dato',
            label: 'Estado',
            render: (val) => {
                const status = val || ''
                if (status === 'OK') return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-tighter border border-green-500/20"><CheckCircle className="h-3 w-3" /> OK</span>
                if (status.includes('PÉRDIDA')) return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-tighter border border-red-500/20"><AlertTriangle className="h-3 w-3" /> Pérdida</span>
                if (status.includes('FALTA COSTO')) return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-black uppercase tracking-tighter border border-yellow-500/20"><Ban className="h-3 w-3" /> Sin Costo</span>
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
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="h-10 w-10 text-green-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">Rentabilidad</span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Análisis profundo de márgenes por producto.</p>
                </div>
            </div>

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
        </motion.div>
    )
}

export default RentabilidadProductosView
