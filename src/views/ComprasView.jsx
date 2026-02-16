import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useCompras, useComprasDetalles } from '../hooks/useData'
import { Loader2 } from 'lucide-react'

const ExpandedRow = ({ row }) => {
    const { data: details, loading: loadingDetails } = useComprasDetalles(row.compra_id)

    if (loadingDetails) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mx-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Detalles de Compra</h4>
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
                    <tr>
                        <th className="px-4 py-2">Producto</th>
                        <th className="px-4 py-2 text-right">Cantidad</th>
                        <th className="px-4 py-2 text-right">Precio Unitario</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                    {details.map((detail) => (
                        <tr key={detail.id}>
                            <td className="px-4 py-2">{detail.producto}</td>
                            <td className="px-4 py-2 text-right">{detail.cantidad}</td>
                            <td className="px-4 py-2 text-right">${detail.precio_unitario}</td>
                            <td className="px-4 py-2 text-right">${detail.subtotal}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const ComprasView = () => {
    const [sortColumn, setSortColumn] = useState('Fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('proveedor')

    const { data, loading } = useCompras({
        sortColumn,
        sortOrder,
        filterColumn,
        filterValue
    })

    const searchColumns = [
        { key: 'proveedor', label: 'Proveedor' },
        { key: 'compra_id', label: 'ID Compra' },
        { key: 'notas', label: 'Notas' }
    ]

    const columns = [
        { key: 'compra_id', label: 'ID' },
        { key: 'Fecha', label: 'Fecha', render: (val) => new Date(val).toLocaleString() },
        { key: 'proveedor', label: 'Proveedor' },
        { key: 'total_compra', label: 'Total', render: (val) => `$${val}` },
        { key: 'notas', label: 'Notas' },
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
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">Compras</h2>
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
                rowKey="compra_id"
            />
        </div>
    )
}

export default ComprasView
