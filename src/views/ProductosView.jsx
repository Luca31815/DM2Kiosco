import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useProductos } from '../hooks/useData'
import { Edit2, Check, X, Loader2 } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'

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
                    alert('¡Unificación exitosa! Los productos se han fusionado.')
                }

                setEditingId(null)
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            alert('Error al actualizar: ' + (error.message || 'Error desconocido'))
        } finally {
            setIsSaving(false)
        }
    }

    const columns = [
        {
            key: 'nombre',
            label: 'Producto',
            render: (val, row) => editingId === row.producto_id ? (
                <ProductAutocomplete
                    value={editForm.nombre}
                    onChange={v => setEditForm({ ...editForm, nombre: v })}
                />
            ) : val
        },
        {
            key: 'ultimo_precio_venta',
            label: 'Precio Venta',
            render: (val) => `$${val}`
        },
        {
            key: 'ultimo_costo_compra',
            label: 'Precio Compra',
            render: (val) => `$${val}`
        },
        {
            key: 'stock_actual',
            label: 'Stock',
            render: (val, row) => editingId === row.producto_id ? (
                <input
                    type="number"
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-20 text-right text-white"
                    value={editForm.stock_actual}
                    onChange={e => setEditForm({ ...editForm, stock_actual: e.target.value })}
                />
            ) : (
                <span className={`font-medium ${val < 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {val}
                </span>
            )
        },
        {
            key: 'fecha_actualizacion',
            label: 'Actualización',
            render: (val) => val ? new Date(val).toLocaleDateString() : '-'
        },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (_, row) => (
                <div className="flex justify-center gap-2">
                    {editingId === row.producto_id ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                                title="Guardar cambios y unificar si corresponde"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                disabled={isSaving}
                                className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                title="Cancelar"
                            >
                                <X size={16} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleEditStart(row)}
                            className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                            title="Editar / Unificar"
                        >
                            <Edit2 size={16} />
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Productos</h2>
                {isSaving && (
                    <div className="flex items-center text-blue-400 text-sm gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        <Loader2 className="animate-spin size-4" />
                        Procesando unificación y ajustes de stock...
                    </div>
                )}
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
        </div>
    )
}

export default ProductosView
