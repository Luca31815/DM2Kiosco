import React, { useState, useMemo, useCallback } from 'react'
import DataTable from '../components/DataTable'
import { useCompras, useComprasDetalles, useMovimientosDinero, useMovimientosStock } from '../hooks/useData'
import { 
    Loader2, 
    Edit2, 
    Check, 
    X, 
    Search, 
    Package, 
    Receipt, 
    CreditCard, 
    Users, 
    Scissors, 
    Trash2, 
    Plus, 
    MessageSquare,
    AlertCircle 
} from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const ExpandedRow = ({ row, onEditPurchase }) => {
    const { data: details, loading: loadingDetails } = useComprasDetalles(row.compra_id)
    const { data: dinero, loading: loadingDinero } = useMovimientosDinero(row.compra_id)
    const { data: stock, loading: loadingStock } = useMovimientosStock(row.compra_id)
    const { mutate } = useSWRConfig()

    const [editingId, setEditingId] = useState(null)
    const [editingSupplier, setEditingSupplier] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [supplierName, setSupplierName] = useState(row.proveedor || '')
    const [, setIsSaving] = useState(false)

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

    const handleSaveSupplier = async () => {
        const loadingToast = toast.loading('Actualizando proveedor...')
        setIsSaving(true)
        try {
            await api.corregirOperacion({
                id_final: row.compra_id,
                nuevo_proveedor: supplierName
            })
            mutate(['compras'])
            mutate(['movimientos_dinero', row.compra_id])
            setEditingSupplier(false)
            toast.success('Proveedor actualizado', { id: loadingToast })
        } catch (error) {
            toast.error('Error: ' + error.message, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
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
            mutate(key => Array.isArray(key) && key[0] === 'productos')
            setEditingId(null)
            toast.success('Compra actualizada correctamente', { id: loadingToast })
        } catch (error) {
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="p-6 space-y-8 bg-slate-900 rounded-2xl border border-white/5 shadow-2xl mx-2 mb-4">
            {/* Header: Supplier Edit & Edit Purchase Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                        <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    {editingSupplier ? (
                        <input 
                            type="text"
                            aria-label="Nombre del proveedor"
                            className="bg-slate-800 border border-blue-500/50 rounded-lg px-3 py-1.5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50 w-full sm:w-64"
                            value={supplierName}
                            onChange={e => setSupplierName(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Proveedor</h4>
                            <span className="text-lg font-black text-white">{row.proveedor || 'SIN PROVEEDOR'}</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {editingSupplier ? (
                        <>
                            <button type="button" 
                                onClick={handleSaveSupplier}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl text-xs font-black hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 min-h-[44px]"
                            >
                                <Check size={14} /> Confirmar
                            </button>
                            <button type="button" 
                                onClick={() => { setEditingSupplier(false); setSupplierName(row.proveedor); }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-xs font-black hover:bg-white/10 transition-all min-h-[44px]"
                            >
                                <X size={14} /> Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" 
                                onClick={() => setEditingSupplier(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-black hover:bg-blue-500/20 transition-all min-h-[44px]"
                            >
                                <Edit2 size={14} /> Editar Proveedor
                            </button>
                            {onEditPurchase && (
                                <button type="button" 
                                    onClick={() => onEditPurchase(row, details, dinero)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black hover:bg-emerald-500/20 transition-all min-h-[44px]"
                                >
                                    <Receipt size={14} /> Editar Compra Completa
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Product Details Section */}
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Package className="h-4 w-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Detalle de Productos</h4>
                        </div>
                        {onEditPurchase && (
                            <button 
                                type="button"
                                onClick={() => onEditPurchase(row, details, dinero)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
                            >
                                <Scissors size={12} /> Dividir / Agregar Items
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto scroll-touch rounded-xl border border-white/5 bg-slate-950/20">
                        <table className="w-full text-sm text-left" style={{ minWidth: '700px' }}>
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
                                                    aria-label="Cantidad"
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
                                                        aria-label="Precio unitario"
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
                                                    <button type="button"
                                                        onClick={() => handleSave(detail)}
                                                        aria-label="Guardar"
                                                        className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all active:scale-95"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button type="button"
                                                        onClick={() => setEditingId(null)}
                                                        aria-label="Cancelar"
                                                        className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all active:scale-95"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button type="button"
                                                    onClick={() => handleEditStart(detail)}
                                                    aria-label="Editar producto"
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
        </div>
    )
}

const ComprasView = () => {
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('proveedor')
    const [page, setPage] = useState(1)
    const pageSize = 20

    const [editingPurchase, setEditingPurchase] = useState(null)
    const [isSavingEdit, setIsSavingEdit] = useState(false)
    const { mutate } = useSWRConfig()

    const options = useMemo(() => ({
        sortColumn,
        sortOrder,
        filterColumn,
        filterValue,
        page,
        pageSize
    }), [sortColumn, sortOrder, filterColumn, filterValue, page, pageSize])

    const { data, count, loading } = useCompras(options)

    const searchColumns = useMemo(() => [
        { key: 'proveedor', label: 'Proveedor' },
        { key: 'lista_productos', label: 'Producto' },
        { key: 'compra_id', label: 'ID Compra' },
        { key: 'notas', label: 'Notas' }
    ], [])

    // [DASH-4] Inicio de edición y carga asíncrona del mensaje original de WhatsApp
    const startEditing = useCallback(async (purchase, existingDetails = null, existingPagos = null) => {
        let details = existingDetails;
        let pagos = existingPagos;

        try {
            if (!details) {
                const { data } = await supabase.from('compras_detalles').select('*').eq('compra_id', purchase.compra_id);
                details = data || [];
            }
            if (!pagos) {
                const { data } = await supabase.from('movimientos_dinero').select('*').eq('referencia_id', purchase.compra_id);
                pagos = data || [];
            }
        } catch (err) {
            console.error('Error fetching details for purchase edit:', err);
            details = details || [];
            pagos = pagos || [];
        }

        const mappedDetails = details.map(d => ({
            id: d.id,
            isNew: false,
            es_split: false,
            producto: d.producto || '',
            originalProduct: d.producto || '',
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal || Number((Number(d.cantidad) * Number(d.precio_unitario)).toFixed(2))
        }));

        const mappedPagos = (pagos && pagos.length > 0) ? pagos.map(p => ({
            movimiento_id: p.movimiento_id,
            metodo: p.metodo,
            monto: p.monto
        })) : [{ metodo: 'Efectivo', monto: purchase.total_compra || 0 }];

        setEditingPurchase({
            ...purchase,
            proveedor: purchase.proveedor || '',
            originalProveedor: purchase.proveedor || '',
            details: mappedDetails,
            pagos: mappedPagos,
            deletedDetails: [],
            mensajeOriginalWsp: null
        });

        // Consulta asíncrona no bloqueante a Supabase para el mensaje original de WhatsApp
        supabase
            .from('historial_bot')
            .select('mensaje_inicial')
            .eq('operacion_id', purchase.compra_id)
            .order('log_id', { ascending: true })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.mensaje_inicial) {
                    setEditingPurchase(prev => (prev && prev.compra_id === purchase.compra_id) ? { ...prev, mensajeOriginalWsp: data.mensaje_inicial } : prev);
                }
            })
            .catch(err => {
                console.error('Error al consultar historial_bot para mensaje original:', err);
            });
    }, []);

    const columns = useMemo(() => [
        { key: 'compra_id', label: 'ID', width: 'w-40', render: (val) => <span className="font-bold text-slate-500 truncate block">{val}</span> },
        {
            key: 'fecha', label: 'Fecha', width: 'w-44', render: (val) => {
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
        { key: 'proveedor', label: 'Proveedor', width: 'w-1/4', wrap: true, render: (val) => <span className="font-bold text-blue-400">{val || 'S/D'}</span> },
        { key: 'total_compra', label: 'Total', width: 'w-24', render: (val) => <span className="font-black text-emerald-400 tabular-nums">${val?.toLocaleString() || '0'}</span> },
        { key: 'notas', label: 'Notas', width: 'w-1/3', wrap: true, render: (val) => <span className="text-slate-400 italic text-xs">{val || '-'}</span> },
        {
            key: 'acciones',
            label: '',
            width: 'w-16',
            render: (_, row) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        startEditing(row);
                    }}
                    title="Editar compra completa"
                    aria-label={`Editar compra ${row.compra_id}`}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                >
                    <Edit2 size={16} />
                </button>
            )
        }
    ], [startEditing])

    const handleSort = (column) => {
        setPage(1)
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    const handleFilter = (val) => {
        setFilterValue(val)
        setPage(1)
    }

    // Funciones del Modal de Edición
    const handleDetailChange = (index, field, value) => {
        setEditingPurchase(prev => {
            if (!prev) return prev;
            const newDetails = [...prev.details];
            const item = { ...newDetails[index], [field]: value };

            const cant = parseFloat(field === 'cantidad' ? value : item.cantidad) || 0;
            const price = parseFloat(field === 'precio_unitario' ? value : item.precio_unitario) || 0;
            item.subtotal = Number((cant * price).toFixed(2));

            newDetails[index] = item;

            const newTotal = newDetails.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
            let newPagos = prev.pagos;
            if (newPagos && newPagos.length === 1) {
                newPagos = [{ ...newPagos[0], monto: Number(newTotal.toFixed(2)) }];
            }

            return {
                ...prev,
                details: newDetails,
                pagos: newPagos
            };
        });
    };

    const handleProductSelect = (index, productName) => {
        setEditingPurchase(prev => {
            if (!prev) return prev;
            const newDetails = [...prev.details];
            newDetails[index] = {
                ...newDetails[index],
                producto: productName
            };
            return {
                ...prev,
                details: newDetails
            };
        });
    };

    const handlePaymentChange = (pIndex, field, value) => {
        setEditingPurchase(prev => {
            if (!prev) return prev;
            const newPagos = [...prev.pagos];
            newPagos[pIndex] = {
                ...newPagos[pIndex],
                [field]: field === 'monto' ? (parseFloat(value) || 0) : value
            };
            return {
                ...prev,
                pagos: newPagos
            };
        });
    };

    // [DASH-1] Dividir renglón en 2 partes
    const handleSplitDetail = (index) => {
        if (!editingPurchase) return;
        const detail = editingPurchase.details[index];
        if (!detail) return;

        if (Number(detail.cantidad) < 2) {
            toast.error('La cantidad debe ser al menos 2 para dividir el renglón');
            return;
        }

        const cant1 = Math.floor(Number(detail.cantidad) / 2);
        const cant2 = Number(detail.cantidad) - cant1;
        const unitPrice = Number(detail.precio_unitario) || 0;

        const updatedDetail = {
            ...detail,
            cantidad: cant1,
            subtotal: Number((cant1 * unitPrice).toFixed(2)),
            es_split: true
        };

        const newSplitRow = {
            id: null,
            isNew: true,
            es_split: true,
            producto: detail.producto,
            originalProduct: '',
            cantidad: cant2,
            precio_unitario: unitPrice,
            subtotal: Number((cant2 * unitPrice).toFixed(2))
        };

        const newDetails = [...editingPurchase.details];
        newDetails.splice(index, 1, updatedDetail, newSplitRow);

        const newTotal = newDetails.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
        let newPagos = editingPurchase.pagos;
        if (newPagos && newPagos.length === 1) {
            newPagos = [{ ...newPagos[0], monto: Number(newTotal.toFixed(2)) }];
        }

        setEditingPurchase(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                details: newDetails,
                pagos: newPagos
            };
        });

        toast.success('Renglón dividido en 2 partes. Elegí el producto de cada mitad.');
    };

    // [DASH-2] Eliminar renglón
    const handleRemoveDetail = (index) => {
        if (!editingPurchase) return;
        if (editingPurchase.details.length <= 1) {
            toast.error('La operación debe tener al menos un producto');
            return;
        }

        const detail = editingPurchase.details[index];
        const newDeleted = [...(editingPurchase.deletedDetails || [])];
        if (!detail.isNew && detail.id) {
            newDeleted.push({
                id: detail.id,
                producto: detail.originalProduct || detail.producto,
                accion: 'eliminar'
            });
        }

        const newDetails = editingPurchase.details.filter((_, idx) => idx !== index);
        const newTotal = newDetails.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
        let newPagos = editingPurchase.pagos;
        if (newPagos && newPagos.length === 1) {
            newPagos = [{ ...newPagos[0], monto: Number(newTotal.toFixed(2)) }];
        }

        setEditingPurchase(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                details: newDetails,
                deletedDetails: newDeleted,
                pagos: newPagos
            };
        });

        toast.success('Renglón eliminado');
    };

    // [DASH-2] Agregar renglón de producto
    const handleAddDetail = () => {
        setEditingPurchase(prev => {
            if (!prev) return prev;
            const newRow = {
                id: null,
                isNew: true,
                es_split: false,
                producto: '',
                originalProduct: '',
                cantidad: 1,
                precio_unitario: 0,
                subtotal: 0
            };
            return {
                ...prev,
                details: [...prev.details, newRow]
            };
        });
    };

    const currentCalculatedTotal = useMemo(() => {
        if (!editingPurchase?.details) return 0;
        return editingPurchase.details.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
    }, [editingPurchase?.details]);

    // [DASH-3 Frontend] Payload exacto hacia corregir_operacion_v20
    const handleSaveEdit = async () => {
        if (!editingPurchase) return;

        // Validaciones
        for (let i = 0; i < editingPurchase.details.length; i++) {
            const d = editingPurchase.details[i];
            if (!d.producto || d.producto.trim() === '') {
                toast.error(`El renglón #${i + 1} no tiene producto seleccionado`);
                return;
            }
            if (Number(d.cantidad) <= 0) {
                toast.error(`El renglón #${i + 1} (${d.producto}) debe tener cantidad mayor a 0`);
                return;
            }
        }

        const itemsPayload = [
            ...editingPurchase.details.map(d => {
                if (d.isNew) {
                    return {
                        accion: 'agregar',
                        producto: d.producto.trim(),
                        nuevo_nombre: d.producto.trim(),
                        cantidad: parseFloat(d.cantidad),
                        precio_unitario: parseFloat(d.precio_unitario) || 0,
                        subtotal: parseFloat(d.subtotal) || 0,
                        es_split: !!d.es_split
                    };
                }
                return {
                    id: d.id,
                    producto: d.originalProduct,
                    nuevo_nombre: d.producto !== d.originalProduct ? d.producto.trim() : undefined,
                    cantidad: parseFloat(d.cantidad),
                    precio_unitario: parseFloat(d.precio_unitario) || 0,
                    subtotal: parseFloat(d.subtotal) || 0,
                    es_split: !!d.es_split
                };
            }),
            ...(editingPurchase.deletedDetails || []).map(del => ({
                id: del.id,
                producto: del.producto,
                accion: 'eliminar'
            }))
        ];

        const payload = {
            id_final: editingPurchase.compra_id,
            items: itemsPayload
        };

        if (editingPurchase.proveedor && editingPurchase.proveedor.trim() !== (editingPurchase.originalProveedor || '').trim()) {
            payload.nuevo_proveedor = editingPurchase.proveedor.trim();
        }

        if (editingPurchase.pagos && editingPurchase.pagos.length > 0) {
            payload.pagos = editingPurchase.pagos.map(p => ({
                metodo: p.metodo,
                nuevo_metodo: p.metodo,
                nuevo_monto: parseFloat(p.monto) || 0
            }));
        }

        const toastId = toast.loading('Guardando correcciones...');
        setIsSavingEdit(true);

        try {
            await api.corregirOperacion(payload);
            mutate(['compras']);
            mutate(['compras_detalles', editingPurchase.compra_id]);
            mutate(['movimientos_dinero', editingPurchase.compra_id]);
            mutate(['stock_movimientos', editingPurchase.compra_id]);
            mutate(key => Array.isArray(key) && key[0] === 'productos');

            toast.success('Compra corregida con éxito', { id: toastId });
            setEditingPurchase(null);
        } catch (error) {
            console.error('Error al guardar corrección de compra:', error);
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'), { id: toastId });
        } finally {
            setIsSavingEdit(false);
        }
    };

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
                    className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full outline-none transition-all"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Receipt className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Compras
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">Gestión de facturas y entrada de mercadería.</p>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={handleFilter}
                searchColumns={searchColumns}
                searchColumn={filterColumn}
                onSearchColumnChange={(col) => { setFilterColumn(col); setPage(1); }}
                renderSearchInput={renderSearchInput}
                renderExpandedRow={(row) => <ExpandedRow row={row} onEditPurchase={(r, d, m) => startEditing(r, d, m)} />}
                rowKey="compra_id"
                serverSide={true}
                totalCount={count}
                currentPage={page}
                onPageChange={setPage}
                itemsPerPage={pageSize}
                minWidth="800px"
            />

            {/* Modal de Edición de Compra */}
            {editingPurchase && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-purchase-title"
                >
                    <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 my-8 flex flex-col max-h-[90vh]">
                        {/* Header del Modal */}
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                                    <Receipt className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 id="modal-purchase-title" className="text-lg font-black text-white flex items-center gap-2">
                                        Editar Compra <span className="text-slate-500 font-mono text-sm">#{editingPurchase.compra_id}</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Modificá productos, dividí renglones o ajustá importes</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingPurchase(null)}
                                disabled={isSavingEdit}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                aria-label="Cerrar modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contenido scrolleable */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* [DASH-4] Visor del Mensaje Original de WhatsApp */}
                            {editingPurchase.mensajeOriginalWsp && (
                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.08)',
                                    border: '1px solid rgba(59, 130, 246, 0.25)',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    marginBottom: '14px',
                                    fontSize: '0.82rem',
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.45
                                }}>
                                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        💬 Mensaje original de WhatsApp
                                    </div>
                                    <div style={{ userSelect: 'all', whiteSpace: 'pre-wrap' }}>
                                        {editingPurchase.mensajeOriginalWsp}
                                    </div>
                                </div>
                            )}

                            {/* Proveedor */}
                            <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5">
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                    Proveedor
                                </label>
                                <input
                                    type="text"
                                    aria-label="Nombre del proveedor"
                                    value={editingPurchase.proveedor}
                                    onChange={(e) => setEditingPurchase(prev => ({ ...prev, proveedor: e.target.value }))}
                                    placeholder="Nombre del proveedor..."
                                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            {/* Sección de Productos */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-emerald-400" />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
                                            Productos ({editingPurchase.details.length})
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddDetail}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[36px]"
                                    >
                                        <Plus size={14} />
                                        <span>Agregar Producto</span>
                                    </button>
                                </div>

                                {/* Tabla de Productos editables */}
                                <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            <tr>
                                                <th className="px-3 py-2.5">Producto</th>
                                                <th className="px-3 py-2.5 text-right w-24">Cantidad</th>
                                                <th className="px-3 py-2.5 text-right w-28">Precio Unit.</th>
                                                <th className="px-3 py-2.5 text-right w-28">Subtotal</th>
                                                <th className="px-3 py-2.5 text-center w-24">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {editingPurchase.details.map((detail, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-3 py-2">
                                                        <ProductAutocomplete
                                                            value={detail.producto}
                                                            onChange={(val) => handleProductSelect(idx, val)}
                                                            className="w-full bg-slate-800/70 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        />
                                                        {detail.es_split && (
                                                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                                ✂️ Renglón dividido
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="any"
                                                            aria-label={`Cantidad del producto ${detail.producto || idx + 1}`}
                                                            value={detail.cantidad}
                                                            onChange={(e) => handleDetailChange(idx, 'cantidad', e.target.value)}
                                                            className="w-20 bg-slate-800/70 border border-white/10 rounded-lg px-2 py-1.5 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <div className="flex items-center justify-end">
                                                            <span className="mr-1 text-slate-500 font-bold">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="any"
                                                                aria-label={`Precio unitario del producto ${detail.producto || idx + 1}`}
                                                                value={detail.precio_unitario}
                                                                onChange={(e) => handleDetailChange(idx, 'precio_unitario', e.target.value)}
                                                                className="w-24 bg-slate-800/70 border border-white/10 rounded-lg px-2 py-1.5 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-black text-emerald-400 tabular-nums font-mono">
                                                        ${detail.subtotal}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSplitDetail(idx)}
                                                                disabled={Number(detail.cantidad) < 2}
                                                                title="Dividir renglón en 2 variedades"
                                                                aria-label={`Dividir renglón ${detail.producto || idx + 1}`}
                                                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                                            >
                                                                <Scissors size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveDetail(idx)}
                                                                title="Eliminar renglón de la operación"
                                                                aria-label={`Eliminar renglón ${detail.producto || idx + 1}`}
                                                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagos y Totales */}
                            <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-blue-400" />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
                                            Pagos / Total Calculado
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Operación</span>
                                        <span className="text-base font-black text-emerald-400 tabular-nums font-mono">
                                            ${currentCalculatedTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {editingPurchase.pagos && editingPurchase.pagos.map((pago, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-xs font-bold text-slate-400 w-28 uppercase">{pago.metodo || 'Pago'}</span>
                                        <div className="flex items-center ml-auto">
                                            <span className="mr-1 text-slate-500 font-bold text-xs">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                aria-label={`Monto del pago ${pago.metodo || pIdx + 1}`}
                                                value={pago.monto}
                                                onChange={(e) => handlePaymentChange(pIdx, 'monto', e.target.value)}
                                                className="w-28 bg-slate-800/80 border border-white/10 rounded-lg px-2.5 py-1 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer con botones Guardar / Cancelar */}
                        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/40">
                            <button
                                type="button"
                                onClick={() => setEditingPurchase(null)}
                                disabled={isSavingEdit}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all min-h-[40px]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 min-h-[40px]"
                            >
                                {isSavingEdit ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Guardar Cambios</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ComprasView
