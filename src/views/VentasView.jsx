import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useVentas, useVentasDetalles, useMovimientosDinero, useMovimientosStock } from '../hooks/useData'
import { Loader2, Edit2, Check, X, Search } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import ClientAutocomplete from '../components/ClientAutocomplete'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

const ExpandedRow = ({ row }) => {
    const { data: details, loading: loadingDetails } = useVentasDetalles(row.venta_id)
    const { data: dinero, loading: loadingDinero } = useMovimientosDinero(row.venta_id)
    const { data: stock, loading: loadingStock } = useMovimientosStock(row.venta_id)
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
                id_final: row.venta_id,
                items: [{
                    producto: originalDetail.producto,
                    nuevo_nombre: editForm.producto,
                    nueva_cantidad: editForm.cantidad,
                    nuevo_precio: editForm.precio_unitario
                }]
            })
            mutate(['ventas_detalles', row.venta_id])
            mutate(['movimientos_dinero', row.venta_id])
            mutate(['stock_movimientos', row.venta_id])
            mutate(['ventas'])
            setEditingId(null)
            toast.success('Venta actualizada correctamente')
        } catch (error) {
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Detalles de Operación</h4>
                    {isSaving && <div className="flex items-center text-blue-400 text-xs font-bold gap-2"><Loader2 className="animate-spin size-3" /> Procesando...</div>}
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5">
                            <tr>
                                <th className="px-6 py-3">Producto</th>
                                <th className="px-6 py-3 text-right">Cantidad</th>
                                <th className="px-6 py-3 text-right">Precio Unitario</th>
                                <th className="px-6 py-3 text-right">Subtotal</th>
                                <th className="px-6 py-3 text-center w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/5">
                            {details.map((detail) => (
                                <tr key={detail.id} className="hover:bg-white/5 transition-all">
                                    <td className="px-6 py-3 font-semibold text-slate-300">
                                        {editingId === detail.id ? (
                                            <ProductAutocomplete
                                                value={editForm.producto}
                                                onChange={val => setEditForm({ ...editForm, producto: val })}
                                            />
                                        ) : detail.producto}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {editingId === detail.id ? (
                                            <input
                                                type="number"
                                                className="bg-slate-800 border-none rounded-lg px-2 py-1.5 w-20 text-right text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                                value={editForm.cantidad}
                                                onChange={e => setEditForm({ ...editForm, cantidad: e.target.value })}
                                            />
                                        ) : <span className="font-bold tabular-nums text-slate-300">{detail.cantidad}</span>}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {editingId === detail.id ? (
                                            <div className="flex items-center justify-end">
                                                <span className="mr-1 text-slate-500 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    className="bg-slate-800 border-none rounded-lg px-2 py-1.5 w-24 text-right text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                                    value={editForm.precio_unitario}
                                                    onChange={e => setEditForm({ ...editForm, precio_unitario: e.target.value })}
                                                />
                                            </div>
                                        ) : <span className="tabular-nums text-slate-400">${detail.precio_unitario}</span>}
                                    </td>
                                    <td className="px-6 py-3 text-right font-black text-white tabular-nums tracking-tight">${detail.subtotal}</td>
                                    <td className="px-6 py-3 text-center">
                                        {editingId === detail.id ? (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleSave(detail)}
                                                    disabled={isSaving}
                                                    className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-all active:scale-90"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    disabled={isSaving}
                                                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all active:scale-90"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditStart(detail)}
                                                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all active:scale-90"
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
                <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Flujo de Fondos</h4>
                    <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-slate-500">
                            <tr>
                                <th className="px-4 py-2 border-none">Fecha</th>
                                <th className="px-4 py-2 border-none">Metodo</th>
                                <th className="px-4 py-2 border-none text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {dinero.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-500 italic">Sin movimientos registrados</td></tr>
                            ) : dinero.map((m) => (
                                <tr key={m.movimiento_id}>
                                    <td className="px-4 py-2 text-slate-400 font-medium">{new Date(m.fecha).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 font-bold text-slate-300">{m.metodo}</td>
                                    <td className="px-4 py-2 text-right font-black text-white">${m.monto}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Impacto en Inventario</h4>
                    <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-slate-500">
                            <tr>
                                <th className="px-4 py-2">Producto</th>
                                <th className="px-4 py-2 text-right">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stock.length === 0 ? (
                                <tr><td colSpan="2" className="px-4 py-4 text-center text-slate-500 italic">Sin impacto reportado</td></tr>
                            ) : stock.map((s) => (
                                <tr key={s.movimiento_id}>
                                    <td className="px-4 py-2 text-slate-300 font-bold">{s.producto}</td>
                                    <td className="px-4 py-2 text-right text-orange-400 font-black tabular-nums">-{s.cantidad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
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
        { key: 'lista_productos', label: 'Producto' },
        { key: 'venta_id', label: 'ID Venta' },
        { key: 'notas', label: 'Notas' }
    ]

    const columns = [
        { key: 'venta_id', label: 'ID', render: (val) => <span className="font-black text-slate-500">#{val}</span> },
        { key: 'fecha', label: 'Fecha', render: (val) => <span className="font-semibold text-slate-400">{new Date(val).toLocaleString()}</span> },
        { key: 'cliente', label: 'Cliente', render: (val) => <span className="font-bold text-slate-200">{val}</span> },
        { key: 'total_venta', label: 'Total', render: (val) => <span className="font-black text-blue-400 text-lg tabular-nums">${val.toLocaleString()}</span> },
        { key: 'notas', label: 'Notas', render: (val) => <span className="text-xs italic text-slate-500">{val}</span> },
    ]

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    const renderSearchInput = (value, onChange) => {
        const inputClass = "pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full sm:w-80 outline-none backdrop-blur-md transition-all"

        if (filterColumn === 'lista_productos') {
            return (
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 z-10 group-focus-within:text-blue-400 transition-colors" />
                    <ProductAutocomplete
                        value={value}
                        onChange={onChange}
                        className={inputClass}
                    />
                </div>
            )
        }
        if (filterColumn === 'cliente') {
            return (
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 z-10 group-focus-within:text-blue-400 transition-colors" />
                    <ClientAutocomplete
                        value={value}
                        onChange={onChange}
                        className={inputClass}
                    />
                </div>
            )
        }
        return (
            <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Escribe para filtrar..."
                    className={inputClass}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Historial de Ventas</h2>
                    <p className="text-slate-400 font-medium mt-1">Gestión detallada de transacciones.</p>
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
                renderSearchInput={renderSearchInput}
                renderExpandedRow={(row) => <ExpandedRow row={row} />}
                rowKey="venta_id"
            />
        </motion.div>
    )
}

export default VentasView
