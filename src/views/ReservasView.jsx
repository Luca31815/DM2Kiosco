import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useReservas, useReservasDetalles, useMovimientosDinero, useMovimientosStock } from '../hooks/useData'
import { Loader2, Edit2, Check, X } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'

const ExpandedRow = ({ row }) => {
    const { data: details, loading: loadingDetails } = useReservasDetalles(row.reserva_id)
    const { data: dinero, loading: loadingDinero } = useMovimientosDinero(row.reserva_id)
    const { data: stock, loading: loadingStock } = useMovimientosStock(row.reserva_id)
    const { mutate } = useSWRConfig()

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    if (loadingDetails || loadingDinero || loadingStock) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

    const handleEditStart = (detail) => {
        setEditingId(detail.id)
        setEditForm({
            producto: detail.producto,
            cantidad: detail.cantidad,
            precio_unitario: detail.precio_unitario
        })
    }

    const handleSave = async (originalDetail) => {
        setIsSaving(true)
        try {
            await api.corregirOperacion({
                id_final: row.reserva_id,
                items: [{
                    producto: originalDetail.producto,
                    nuevo_nombre: editForm.producto,
                    nueva_cantidad: editForm.cantidad,
                    nuevo_precio: editForm.precio_unitario
                }]
            })
            mutate(['reservas_detalles', row.reserva_id])
            mutate(['movimientos_dinero', row.reserva_id])
            mutate(['stock_movimientos', row.reserva_id])
            mutate(['reservas']) // Refrescar para actualizar saldo_pendiente, etc.
            setEditingId(null)
        } catch (error) {
            alert('Error al guardar cambios: ' + (error.message || 'Error desconocido'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mx-4 mb-4 space-y-6 shadow-inner">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-gray-400">Detalles de Reserva (Productos)</h4>
                    {isSaving && <div className="flex items-center text-blue-400 text-xs gap-2"><Loader2 className="animate-spin size-3" /> Guardando...</div>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
                            <tr>
                                <th className="px-4 py-2">Producto</th>
                                <th className="px-4 py-2 text-right">Cantidad</th>
                                <th className="px-4 py-2 text-right">Precio Unitario</th>
                                <th className="px-4 py-2 text-right">Subtotal</th>
                                <th className="px-4 py-2 text-center w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {details.map((detail) => (
                                <tr key={detail.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2">
                                        {editingId === detail.id ? (
                                            <ProductAutocomplete
                                                value={editForm.producto}
                                                onChange={val => setEditForm({ ...editForm, producto: val })}
                                            />
                                        ) : detail.producto}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {editingId === detail.id ? (
                                            <input
                                                type="number"
                                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-20 text-right text-white"
                                                value={editForm.cantidad}
                                                onChange={e => setEditForm({ ...editForm, cantidad: e.target.value })}
                                            />
                                        ) : detail.cantidad}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {editingId === detail.id ? (
                                            <div className="flex items-center justify-end">
                                                <span className="mr-1">$</span>
                                                <input
                                                    type="number"
                                                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-24 text-right text-white"
                                                    value={editForm.precio_unitario}
                                                    onChange={e => setEditForm({ ...editForm, precio_unitario: e.target.value })}
                                                />
                                            </div>
                                        ) : `$${detail.precio_unitario}`}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-white">${detail.subtotal}</td>
                                    <td className="px-4 py-2 text-center">
                                        {editingId === detail.id ? (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleSave(detail)}
                                                    disabled={isSaving}
                                                    className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                                                    title="Guardar"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    disabled={isSaving}
                                                    className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditStart(detail)}
                                                className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Movimientos de Stock (Salidas/Entregas)</h4>
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

const ReservasView = () => {
    const [sortColumn, setSortColumn] = useState('fecha_creacion')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('cliente')
    const [showOpenOnly, setShowOpenOnly] = useState(true)

    const { data, loading } = useReservas({
        sortColumn,
        sortOrder,
        filterColumn,
        filterValue
    }, showOpenOnly)

    const searchColumns = [
        { key: 'cliente', label: 'Cliente' },
        { key: 'reserva_id', label: 'ID Reserva' },
        { key: 'estado_pago', label: 'Estado Pago' },
        { key: 'estado_entrega', label: 'Entrega' }
    ]

    const columns = [
        { key: 'reserva_id', label: 'ID' },
        { key: 'fecha_creacion', label: 'Fecha', render: (val) => val ? new Date(val).toLocaleString() : '' },
        {
            key: 'cliente',
            label: 'Cliente',
            render: (val, row) => val || row.Cliente || 'N/A'
        },
        { key: 'total_reserva', label: 'Total', render: (val) => `$${val}` },
        { key: 'total_pagado', label: 'Pagado', render: (val) => `$${val || 0}` },
        { key: 'saldo_pendiente', label: 'Saldo', render: (val) => `$${val}` },
        {
            key: 'estado_pago', label: 'Estado Pago', render: (val) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'Pagado' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                    {val}
                </span>
            )
        },
        { key: 'estado_entrega', label: 'Entrega' },
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Reservas</h2>
                <div className="flex gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                    <button
                        onClick={() => setShowOpenOnly(true)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${showOpenOnly ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Abiertas
                    </button>
                    <button
                        onClick={() => setShowOpenOnly(false)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!showOpenOnly ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Todas
                    </button>
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
                searchColumns={searchColumns}
                searchColumn={filterColumn}
                onSearchColumnChange={setFilterColumn}
                renderExpandedRow={(row) => <ExpandedRow row={row} />}
                rowKey="reserva_id"
            />
        </div>
    )
}

export default ReservasView
