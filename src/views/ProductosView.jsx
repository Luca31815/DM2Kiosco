import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useProductos } from '../hooks/useData'
import { Edit2, Check, X, Loader2, Package, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const ProductosView = () => {
    const [sortColumn, setSortColumn] = useState('nombre')
    const [sortOrder, setSortOrder] = useState('asc')
    const [filterValue, setFilterValue] = useState('')
    const { mutate } = useSWRConfig()

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    const { data, loading } = useProductos({
        sortColumn,
        sortOrder,
        filterColumn: 'nombre',
        filterValue
    })

    const handleEditStart = (product) => {
        setEditingId(product.producto_id)
        setEditForm({ ...product })
    }

    const handleSave = async () => {
        const loadingToast = toast.loading('Procesando cambios...')
        setIsSaving(true)
        try {
            const result = await api.actualizarProducto(editForm)
            if (result.success) {
                // Refrescar lista de productos
                mutate(key => Array.isArray(key) && key[0] === 'productos')

                // Si hubo unificación o cambio de nombre, refrescar todo
                if (result.tipo_accion === 'MERGE' || result.renombrado) {
                    mutate('ventas')
                    mutate('compras')
                    mutate('reservas')
                }

                if (result.tipo_accion === 'MERGE') {
                    toast.success('¡Unificación exitosa! Los productos se han fusionado.', { id: loadingToast, duration: 5000 })
                } else {
                    toast.success('Producto actualizado correctamente', { id: loadingToast })
                }

                setEditingId(null)
            } else {
                toast.error('Error: ' + result.error, { id: loadingToast })
            }
        } catch (error) {
            toast.error('Error al actualizar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    const columns = [
        {
            key: 'nombre',
            label: 'Producto',
            render: (val, row) => (
                <div className="flex flex-col">
                    {editingId === row.producto_id ? (
                        <div className="min-w-[200px]">
                            <ProductAutocomplete
                                value={editForm.nombre}
                                onChange={v => setEditForm({ ...editForm, nombre: v })}
                                className="bg-slate-800/50 border-white/10"
                            />
                        </div>
                    ) : (
                        <span className="font-bold text-slate-200">{val}</span>
                    )}
                </div>
            )
        },
        {
            key: 'ultimo_precio_venta',
            label: 'Precio Venta',
            render: (val) => (
                <div className="flex items-center gap-1.5 font-black text-emerald-400 tabular-nums">
                    <TrendingUp className="h-3 w-3 opacity-50" />
                    ${val}
                </div>
            )
        },
        {
            key: 'ultimo_costo_compra',
            label: 'Precio Compra',
            render: (val) => (
                <div className="flex items-center gap-1.5 font-black text-slate-400 tabular-nums opacity-80">
                    <TrendingDown className="h-3 w-3 opacity-50" />
                    ${val}
                </div>
            )
        },
        {
            key: 'stock_actual',
            label: 'Stock',
            render: (val, row) => editingId === row.producto_id ? (
                <input
                    type="number"
                    className="bg-slate-800 border-none rounded-lg px-2 py-1 w-20 text-right text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                    value={editForm.stock_actual}
                    onChange={e => setEditForm({ ...editForm, stock_actual: e.target.value })}
                />
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((val / 20) * 100, 100)}%` }}
                            className={`h-full ${val < 10 ? 'bg-rose-500' : val < 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                    </div>
                    <span className={`font-black tabular-nums ${val < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {val}
                    </span>
                </div>
            )
        },
        {
            key: 'fecha_actualizacion',
            label: 'Actualización',
            render: (val) => val ? (
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(val).toLocaleDateString()}
                </div>
            ) : <span className="text-slate-700">-</span>
        },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (_, row) => (
                <div className="flex justify-center gap-1">
                    {editingId === row.producto_id ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all active:scale-95"
                                title="Guardar cambios"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                disabled={isSaving}
                                className="p-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all active:scale-95"
                                title="Cancelar"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleEditStart(row)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            title="Editar / Unificar"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ]

    const handleSort = (column) => {
        if (column === 'acciones') return
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Package className="h-10 w-10 text-amber-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Inventario
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Gestión de productos, precios y stock inteligente.</p>
                </div>

                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre..."
                        className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full outline-none backdrop-blur-md transition-all"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                    />
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
                rowKey="producto_id"
            />
        </motion.div>
    )
}

export default ProductosView
