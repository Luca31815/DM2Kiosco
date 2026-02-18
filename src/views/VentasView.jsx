import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useVentas, useVentasDetalles, useMovimientosDinero, useMovimientosStock } from '../hooks/useData'
import { Loader2 } from 'lucide-react'

const ExpandedRow = ({ row }) => {
    const { data: details, loading: loadingDetails } = useVentasDetalles(row.venta_id)
    const { data: dinero, loading: loadingDinero } = useMovimientosDinero(row.venta_id)
    const { data: stock, loading: loadingStock } = useMovimientosStock(row.venta_id)

    if (loadingDetails || loadingDinero || loadingStock) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mx-4 mb-4 space-y-6">
            <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Detalles de Venta (Productos)</h4>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Pagos / Movimientos de Dinero</h4>
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
                            <tr>
                                <th className="px-4 py-2">Fecha</th>
                                <th className="px-4 py-2">Metodo</th>
                                <th className="px-4 py-2 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {dinero.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 py-2 text-center text-gray-500 italic">Sin movimientos de dinero</td></tr>
                            ) : dinero.map((m) => (
                                <tr key={m.movimiento_id}>
                                    <td className="px-4 py-2">{new Date(m.fecha).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">{m.metodo}</td>
                                    <td className="px-4 py-2 text-right">${m.monto}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Movimientos de Stock (Retiros)</h4>
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
                            <tr>
                                <th className="px-4 py-2">Producto</th>
                                <th className="px-4 py-2 text-right">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {stock.length === 0 ? (
                                <tr><td colSpan="2" className="px-4 py-2 text-center text-gray-500 italic">Sin movimientos de stock</td></tr>
                            ) : stock.map((s) => (
                                <tr key={s.movimiento_id}>
                                    <td className="px-4 py-2">{s.producto}</td>
                                    <td className="px-4 py-2 text-right text-orange-400 font-medium">{s.cantidad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const VentasView = () => {
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('cliente')

    const { data, loading } = useVentas({
        sortColumn,
        sortOrder,
        filterColumn,
        filterValue
    })

    const searchColumns = [
        { key: 'cliente', label: 'Cliente' },
        { key: 'venta_id', label: 'ID Venta' },
        { key: 'notas', label: 'Notas' }
    ]

    const columns = [
        { key: 'venta_id', label: 'ID' },
        { key: 'fecha', label: 'Fecha', render: (val) => new Date(val).toLocaleString() },
        { key: 'cliente', label: 'Cliente' },
        { key: 'total_venta', label: 'Total', render: (val) => `$${val}` },
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
            <h2 className="text-3xl font-bold text-white mb-6">Ventas</h2>
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
                rowKey="venta_id"
            />
        </div>
    )
}

export default VentasView
