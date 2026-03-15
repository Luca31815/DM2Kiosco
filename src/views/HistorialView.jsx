import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useHistorialBot } from '../hooks/useData'
import { History, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const ExpandedRow = ({ row }) => {
    if (!row.detalle_error && !row.mensaje_inicial) return <div className="p-4 text-gray-500 italic">No hay detalles adicionales.</div>

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mx-4 mb-4 text-sm text-gray-300 space-y-2">
            {row.mensaje_inicial && (
                <div>
                    <span className="text-gray-500 uppercase text-xs font-bold block mb-1">Mensaje Inicial:</span>
                    <p className="bg-gray-800 p-2 rounded">{row.mensaje_inicial}</p>
                </div>
            )}
            {row.detalle_error && (
                <div>
                    <span className="text-red-500 uppercase text-xs font-bold block mb-1 flex items-center gap-1"><AlertCircle size={12} /> Detalle Error:</span>
                    <p className="bg-red-900/20 text-red-300 p-2 rounded border border-red-900/50 font-mono text-xs">{row.detalle_error}</p>
                </div>
            )}
        </div>
    )
}

const HistorialView = () => {
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('tipo_accion')

    const { data, loading } = useHistorialBot({
        sortColumn,
        sortOrder,
        filterColumn,
        filterValue
    })

    const searchColumns = [
        { key: 'tipo_accion', label: 'Acción' },
        { key: 'mensaje_enviado', label: 'Mensaje Enviado' },
        { key: 'mensaje_inicial', label: 'Mensaje Inicial' },
        { key: 'log_id', label: 'ID Log' },
    ]

    const columns = [
        { key: 'log_id', label: 'ID', width: 'w-24', render: (val) => <span className="text-gray-500">#{val}</span> },
        { key: 'fecha', label: 'Fecha', width: 'w-48', render: (val) => new Date(val).toLocaleString() },
        { key: 'tipo_accion', label: 'Acción', width: 'w-32', render: (val) => <span className="uppercase text-xs font-bold tracking-wider text-purple-400">{val}</span> },
        {
            key: 'estado', label: 'Estado', width: 'w-24', render: (val) => {
                if (val === 'exito') return <span className="flex items-center gap-1 text-green-400 font-bold"><CheckCircle size={14} /> EXITO</span>
                if (val === 'error') return <span className="flex items-center gap-1 text-red-400 font-bold"><XCircle size={14} /> ERROR</span>
                return <span className="text-gray-400">{val}</span>
            }
        },
        { key: 'mensaje_enviado', label: 'Mensaje', width: 'w-1/2', wrap: true, render: (val) => <span className="text-gray-300 italic text-sm block" title={val}>{val}</span> },
    ]

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <History className="h-10 w-10 text-purple-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                    Historial Operaciones
                </span>
            </h2>

            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={setFilterValue}
                searchColumns={searchColumns}
                searchColumn={filterColumn}
                onSearchColumnChange={setFilterColumn}
                renderExpandedRow={(row) => <ExpandedRow row={row} />}
                rowKey="log_id"
            />
        </div>
    )
}

export default HistorialView
