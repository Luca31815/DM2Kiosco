import React, { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import { getHistorialBot } from '../services/api'
import { History, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const HistorialView = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    const columns = [
        { key: 'log_id', label: 'ID', render: (val) => <span className="text-gray-500">#{val}</span> },
        { key: 'fecha', label: 'Fecha', render: (val) => new Date(val).toLocaleString() },
        { key: 'tipo_accion', label: 'Acción', render: (val) => <span className="uppercase text-xs font-bold tracking-wider">{val}</span> },
        {
            key: 'estado', label: 'Estado', render: (val) => {
                if (val === 'exito') return <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> Exito</span>
                if (val === 'error') return <span className="flex items-center gap-1 text-red-400"><XCircle size={14} /> Error</span>
                return <span className="text-gray-400">{val}</span>
            }
        },
        { key: 'mensaje_enviado', label: 'Mensaje', render: (val) => <span className="text-gray-300 italic truncate max-w-xs block" title={val}>{val}</span> },
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
            const { data: newData } = await getHistorialBot({
                sortColumn,
                sortOrder,
                filterColumn: 'tipo_accion',
                filterValue
            })
            setData(newData || [])
        } catch (error) {
            console.error('Error fetching historial:', error)
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

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                <History className="h-8 w-8 text-purple-500" />
                Historial Bot
            </h2>
            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={setFilterValue}
                renderExpandedRow={(row) => <ExpandedRow row={row} />}
                rowKey="log_id"
            />
        </div>
    )
}

export default HistorialView
