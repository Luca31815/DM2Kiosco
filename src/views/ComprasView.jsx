import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useCompras, useComprasDetalles, useMovimientosDinero, useMovimientosStock } from '../hooks/useData'
import { Loader2, Edit2, Check, X, Search, Package, Receipt, CreditCard } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const ExpandedRow = ({ row }) => {
    const { data: details, loading: loadingDetails } = useComprasDetalles(row.compra_id)
    const { data: dinero, loading: loadingDinero } = useMovimientosDinero(row.compra_id)
    const { data: stock, loading: loadingStock } = useMovimientosStock(row.compra_id)
    const { mutate } = useSWRConfig()

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    if (loadingDetails || loadingDinero || loadingStock) {
        return (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                <span className="text-slate-500 font-medium animate-pulse text-sm">Cargando detalles...</span>
            </div>
        )
    }

    const handleEditStart = (detail) => {
        setEditingId(detail.id)
        setEditForm({
            producto: detail.producto,
            cantidad: detail.cantidad,
            precio_unitario: detail.precio_unitario
        })
    }

    const handleSave = async (originalDetail) => {
        const loadingToast = toast.loading('Guardando cambios...')
        setIsSaving(true)
        try {
            await api.corregirOperacion({
                id_final: row.compra_id,
                items: [{
                    producto: originalDetail.producto,
                    nuevo_nombre: editForm.producto,
                    nueva_cantidad: editForm.cantidad,
                    nuevo_precio: editForm.precio_unitario
                }]
            })
            mutate(['compras_detalles', row.compra_id])
            mutate(['movimientos_dinero', row.compra_id])
            mutate(['stock_movimientos', row.compra_id])
            mutate(['compras'])
            setEditingId(null)
            toast.success('Compra actualizada correctamente', { id: loadingToast })
        } catch (error) {
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 space-y-8 bg-slate-900/40 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md mx-2 mb-4"
        >
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Product Details Section */}
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Package className="h-4 w-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Detalle de Productos</h4>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-950/20">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                    <th className="px-4 py-3 text-center w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {details.map((detail) => (
                                    <tr key={detail.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3">
                                            {editingId === detail.id ? (
                                                <ProductAutocomplete
                                                    value={editForm.producto}
                                                    onChange={val => setEditForm({ ...editForm, producto: val })}
                                                />
                                            ) : (
                                                <span className="font-bold text-slate-300">{detail.producto}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {editingId === detail.id ? (
                                                <input
                                                    type="number"
                                                    className="bg-slate-800 border-none rounded-lg px-2 py-1 w-16 text-right text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                    value={editForm.cantidad}
                                                    onChange={e => setEditForm({ ...editForm, cantidad: e.target.value })}
                                                />
                                            ) : (
                                                <span className="font-medium text-slate-400 tabular-nums">{detail.cantidad}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {editingId === detail.id ? (
                                                <div className="flex items-center justify-end">
                                                    <span className="mr-1 text-slate-500">$</span>
                                                    <input
                                                        type="number"
                                                        className="bg-slate-800 border-none rounded-lg px-2 py-1 w-20 text-right text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                        value={editForm.precio_unitario}
                                                        onChange={e => setEditForm({ ...editForm, precio_unitario: e.target.value })}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 tabular-nums">${detail.precio_unitario}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-blue-400 tabular-nums">${detail.subtotal}</td>
                                        <td className="px-4 py-3 flex justify-center">
                                            {editingId === detail.id ? (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleSave(detail)}
                                                        className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all active:scale-95"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all active:scale-95"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditStart(detail)}
                                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Payments and Stock */}
                <div className="w-full lg:w-96 space-y-6">
                    {/* Payments */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <CreditCard className="h-4 w-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Pagos Relacionados</h4>
                        </div>
                        <div className="bg-slate-950/20 rounded-xl border border-white/5 p-4 divide-y divide-white/5">
                            {dinero.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center py-2 italic font-medium">Sin movimientos de dinero</p>
                            ) : dinero.map((m) => (
                                <div key={m.movimiento_id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{m.metodo}</span>
                                        <span className="text-[10px] text-slate-600">{new Date(m.fecha).toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-sm font-black text-emerald-400 tabular-nums">${m.monto}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stock Movements */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Receipt className="h-4 w-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Ingreso a Stock</h4>
                        </div>
                        <div className="bg-slate-950/20 rounded-xl border border-white/5 p-4 divide-y divide-white/5">
                            {stock.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center py-2 italic font-medium">Sin movimientos de stock</p>
                            ) : stock.map((s) => (
                                <div key={s.movimiento_id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                    <span className="text-xs font-bold text-slate-400 truncate max-w-[180px]">{s.producto}</span>
                                    <span className="text-sm font-black text-blue-400 tabular-nums">+{s.cantidad}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

const ComprasView = () => {
    const [sortColumn, setSortColumn] = useState('fecha')
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
        { key: 'lista_productos', label: 'Producto' },
        { key: 'compra_id', label: 'ID Compra' },
        { key: 'notas', label: 'Notas' }
    ]

    const columns = [
        { key: 'compra_id', label: 'ID', render: (val) => <span className="font-bold text-slate-500">{val}</span> },
        {
            key: 'fecha', label: 'Fecha', render: (val) => {
                if (!val) return ''
                const date = new Date(val)
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-300">{date.toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs</span>
                    </div>
                )
            }
        },
        { key: 'proveedor', label: 'Proveedor', render: (val) => <span className="font-bold text-blue-400">{val}</span> },
        { key: 'total_compra', label: 'Total', render: (val) => <span className="font-black text-emerald-400 tabular-nums">${val}</span> },
        { key: 'notas', label: 'Notas', render: (val) => <span className="text-slate-400 italic text-xs">{val || '-'}</span> },
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
        if (filterColumn === 'lista_productos') {
            return (
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 z-10" />
                    <ProductAutocomplete
                        value={value}
                        onChange={onChange}
                        className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200"
                    />
                </div>
            )
        }
        return (
            <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
                <input
                    type="text"
                    placeholder={`Buscar por ${searchColumns.find(c => c.key === filterColumn)?.label.toLowerCase()}...`}
                    className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full outline-none backdrop-blur-md transition-all"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Receipt className="h-10 w-10 text-emerald-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Compras
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Gestión de facturas y entrada de mercadería.</p>
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
                rowKey="compra_id"
            />
        </motion.div>
    )
}

export default ComprasView
