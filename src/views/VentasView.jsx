import React, { useState, useMemo, useCallback } from 'react'
import DataTable from '../components/DataTable'
import { useVentas, useVentasDetalles, useMovimientosDinero, useMovimientosStock, invalidateVentas, invalidateProductos } from '../hooks/useData'
import { 
    Loader2, 
    Edit2, 
    Check, 
    X, 
    Search, 
    Scissors, 
    Trash2, 
    Plus, 
    Package, 
    CreditCard, 
    ShoppingCart 
} from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import ClientAutocomplete from '../components/ClientAutocomplete'
import { m } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useIsMobile } from '../hooks/useIsMobile'
import { supabase } from '../lib/supabase'

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
})

const TABLE_MIN_WIDTH_STYLE = { minWidth: '700px' }

const WSP_BOX_STYLE = {
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '14px',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45
}

const WSP_HEADER_STYLE = {
    fontWeight: 600,
    color: '#60a5fa',
    marginBottom: '4px',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
}

const WSP_TEXT_STYLE = { userSelect: 'all', whiteSpace: 'pre-wrap' }

const ExpandedRow = ({ row, onEditSale }) => {
    const { data: details, loading: loadingDetails } = useVentasDetalles(row.venta_id)
    const { data: dinero, loading: loadingDinero } = useMovimientosDinero(row.venta_id)
    const { data: stock, loading: loadingStock } = useMovimientosStock(row.venta_id)
    const { mutate } = useSWRConfig()

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    if (loadingDetails || loadingDinero || loadingStock) {
        return (
            <div className="p-4 flex justify-center">
                <Loader2 className="animate-spin text-blue-500" />
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
        setIsSaving(true)
        try {
            await api.corregirOperacion({
                id_final: row.venta_id,
                items: [{
                    id: originalDetail.id,
                    producto: originalDetail.producto,
                    nuevo_nombre: editForm.producto,
                    nueva_cantidad: editForm.cantidad,
                    nuevo_precio: editForm.precio_unitario
                }]
            })
            mutate(['ventas_detalles', row.venta_id])
            mutate(['movimientos_dinero', row.venta_id])
            mutate(['stock_movimientos', row.venta_id])
            invalidateVentas()
            invalidateProductos()
            setEditingId(null)
            toast.success('Venta actualizada correctamente')
        } catch (error) {
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <m.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
                <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="h-4 w-4 text-blue-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Detalles de Operación</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {onEditSale && (
                                <button
                                    type="button"
                                    onClick={() => onEditSale(row, details, dinero)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-xs font-bold transition-all min-h-[38px] active:scale-95"
                                >
                                    <Edit2 size={14} />
                                    <span>Editar Venta Completa</span>
                                </button>
                            )}
                            {isSaving && (
                                <div className="flex items-center text-blue-400 text-xs font-bold gap-2">
                                    <Loader2 className="animate-spin size-3" /> Procesando...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto scroll-touch rounded-xl border border-white/5">
                        <table className="w-full text-sm text-left" style={TABLE_MIN_WIDTH_STYLE}>
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
                                                    aria-label="Cantidad"
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
                                                        aria-label="Precio unitario"
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
                                                    <button type="button"
                                                        onClick={() => handleSave(detail)}
                                                        disabled={isSaving}
                                                        aria-label="Guardar"
                                                        className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-all active:scale-90"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button type="button"
                                                        onClick={() => setEditingId(null)}
                                                        disabled={isSaving}
                                                        aria-label="Cancelar"
                                                        className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all active:scale-90"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button type="button"
                                                    onClick={() => handleEditStart(detail)}
                                                    aria-label="Editar producto"
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
                                        <td className="px-4 py-2 text-slate-400 font-medium">{m.fecha ? dateFormatter.format(new Date(m.fecha)) : '-'}</td>
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
        </m.div>
    )
}

const VentasView = () => {
    const isMobile = useIsMobile()
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('cliente')
    const [page, setPage] = useState(1)
    const pageSize = isMobile ? 10 : 20

    const [editingSale, setEditingSale] = useState(null)
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

    const { data, count, loading } = useVentas(options)

    const searchColumns = useMemo(() => [
        { key: 'cliente', label: 'Cliente' },
        { key: 'lista_productos', label: 'Producto' },
        { key: 'venta_id', label: 'ID Venta' },
        { key: 'notas', label: 'Notas' }
    ], [])

    // [DASH-4] Inicio de edición y carga asíncrona del mensaje original de WhatsApp
    const startEditing = useCallback(async (sale, existingDetails = null, existingPagos = null) => {
        let details = existingDetails;
        let pagos = existingPagos;

        try {
            const [detailsRes, pagosRes] = await Promise.all([
                !details
                    ? supabase.from('ventas_detalles').select('*').eq('venta_id', sale.venta_id)
                    : Promise.resolve({ data: details }),
                !pagos
                    ? supabase.from('movimientos_dinero').select('*').eq('referencia_id', sale.venta_id)
                    : Promise.resolve({ data: pagos })
            ]);
            details = detailsRes.data || [];
            pagos = pagosRes.data || [];
        } catch (err) {
            console.error('Error fetching details for sale edit:', err);
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
        })) : [{ metodo: 'Efectivo', monto: sale.total_venta || 0 }];

        setEditingSale({
            ...sale,
            cliente: sale.cliente || '',
            originalCliente: sale.cliente || '',
            details: mappedDetails,
            pagos: mappedPagos,
            deletedDetails: [],
            mensajeOriginalWsp: null
        });

        // Consulta asíncrona no bloqueante a Supabase para el mensaje original de WhatsApp
        supabase
            .from('historial_bot')
            .select('mensaje_inicial')
            .eq('operacion_id', sale.venta_id)
            .order('log_id', { ascending: true })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.mensaje_inicial) {
                    setEditingSale(prev => (prev && prev.venta_id === sale.venta_id) ? { ...prev, mensajeOriginalWsp: data.mensaje_inicial } : prev);
                }
            })
            .catch(err => {
                console.error('Error al consultar historial_bot para mensaje original de venta:', err);
            });
    }, []);

    const columns = useMemo(() => [
        { key: 'venta_id', label: 'ID', width: 'w-40', render: (val) => <span className="font-black text-slate-500 truncate block">#{val}</span> },
        { key: 'fecha', label: 'Fecha', width: 'w-56', render: (val) => <span className="font-semibold text-slate-400">{val ? dateTimeFormatter.format(new Date(val)) : '-'}</span> },
        { key: 'cliente', label: 'Cliente', width: 'w-1/4', wrap: true, render: (val) => <span className="font-bold text-slate-200">{val || 'N/A'}</span> },
        { key: 'total_venta', label: 'Total', width: 'w-32', render: (val) => <span className="font-black text-blue-400 text-lg tabular-nums">${val?.toLocaleString() || '0'}</span> },
        { key: 'notas', label: 'Notas', width: 'w-1/3', wrap: true, render: (val) => <span className="text-xs italic text-slate-500">{val || '-'}</span> },
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
                    title="Editar venta completa"
                    aria-label={`Editar venta ${row.venta_id}`}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
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

    // Funciones del Modal de Edición de Venta
    const handleDetailChange = (index, field, value) => {
        setEditingSale(prev => {
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
        setEditingSale(prev => {
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
        setEditingSale(prev => {
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
        if (!editingSale) return;
        const detail = editingSale.details[index];
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

        const newDetails = [...editingSale.details];
        newDetails.splice(index, 1, updatedDetail, newSplitRow);

        const newTotal = newDetails.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
        let newPagos = editingSale.pagos;
        if (newPagos && newPagos.length === 1) {
            newPagos = [{ ...newPagos[0], monto: Number(newTotal.toFixed(2)) }];
        }

        setEditingSale(prev => {
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
        if (!editingSale) return;
        if (editingSale.details.length <= 1) {
            toast.error('La operación debe tener al menos un producto');
            return;
        }

        const detail = editingSale.details[index];
        const newDeleted = [...(editingSale.deletedDetails || [])];
        if (!detail.isNew && detail.id) {
            newDeleted.push({
                id: detail.id,
                producto: detail.originalProduct || detail.producto,
                accion: 'eliminar'
            });
        }

        const newDetails = editingSale.details.filter((_, idx) => idx !== index);
        const newTotal = newDetails.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
        let newPagos = editingSale.pagos;
        if (newPagos && newPagos.length === 1) {
            newPagos = [{ ...newPagos[0], monto: Number(newTotal.toFixed(2)) }];
        }

        setEditingSale(prev => {
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
        setEditingSale(prev => {
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
        if (!editingSale?.details) return 0;
        return editingSale.details.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
    }, [editingSale]);

    // [DASH-3 Frontend] Payload exacto hacia corregir_operacion_v20
    const handleSaveEdit = async () => {
        if (!editingSale) return;

        // Validaciones
        for (let i = 0; i < editingSale.details.length; i++) {
            const d = editingSale.details[i];
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
            ...editingSale.details.map(d => {
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
            ...(editingSale.deletedDetails || []).map(del => ({
                id: del.id,
                producto: del.producto,
                accion: 'eliminar'
            }))
        ];

        const payload = {
            id_final: editingSale.venta_id,
            items: itemsPayload
        };

        if (editingSale.cliente && editingSale.cliente.trim() !== (editingSale.originalCliente || '').trim()) {
            payload.nuevo_cliente = editingSale.cliente.trim();
        }

        if (editingSale.pagos && editingSale.pagos.length > 0) {
            payload.pagos = editingSale.pagos.map(p => ({
                metodo: p.metodo,
                nuevo_metodo: p.metodo,
                nuevo_monto: parseFloat(p.monto) || 0
            }));
        }

        const toastId = toast.loading('Guardando correcciones...');
        setIsSavingEdit(true);

        try {
            await api.corregirOperacion(payload);
            invalidateVentas();
            mutate(['ventas_detalles', editingSale.venta_id]);
            mutate(['movimientos_dinero', editingSale.venta_id]);
            mutate(['stock_movimientos', editingSale.venta_id]);
            invalidateProductos();

            toast.success('Venta corregida con éxito', { id: toastId });
            setEditingSale(null);
        } catch (error) {
            console.error('Error al guardar corrección de venta:', error);
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'), { id: toastId });
        } finally {
            setIsSavingEdit(false);
        }
    };

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

    const renderExpandedRow = useCallback(
        (row) => <ExpandedRow row={row} onEditSale={startEditing} />,
        [startEditing]
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">Historial de Ventas</h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">Gestión detallada de transacciones.</p>
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
                renderExpandedRow={renderExpandedRow}
                rowKey="venta_id"
                serverSide={true}
                totalCount={count}
                currentPage={page}
                onPageChange={setPage}
                itemsPerPage={pageSize}
                minWidth="850px"
            />

            {/* Modal de Edición de Venta */}
            {editingSale && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-sale-title"
                >
                    <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 my-8 flex flex-col max-h-[90vh]">
                        {/* Header del Modal */}
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 id="modal-sale-title" className="text-lg font-black text-white flex items-center gap-2">
                                        Editar Venta <span className="text-slate-500 font-mono text-sm">#{editingSale.venta_id}</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Modificá productos, dividí renglones o ajustá importes</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingSale(null)}
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
                            {editingSale.mensajeOriginalWsp && (
                                <div style={WSP_BOX_STYLE}>
                                    <div style={WSP_HEADER_STYLE}>
                                        💬 Mensaje original de WhatsApp
                                    </div>
                                    <div style={WSP_TEXT_STYLE}>
                                        {editingSale.mensajeOriginalWsp}
                                    </div>
                                </div>
                            )}

                            {/* Cliente */}
                            <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5">
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                    Cliente
                                </label>
                                <ClientAutocomplete
                                    value={editingSale.cliente}
                                    onChange={(val) => setEditingSale(prev => ({ ...prev, cliente: val }))}
                                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            {/* Sección de Productos */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-400" />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
                                            Productos ({editingSale.details.length})
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddDetail}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[36px]"
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
                                            {editingSale.details.map((detail, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-3 py-2">
                                                        <ProductAutocomplete
                                                            value={detail.producto}
                                                            onChange={(val) => handleProductSelect(idx, val)}
                                                            className="w-full bg-slate-800/70 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                                            className="w-20 bg-slate-800/70 border border-white/10 rounded-lg px-2 py-1.5 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
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
                                                                className="w-24 bg-slate-800/70 border border-white/10 rounded-lg px-2 py-1.5 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-black text-blue-400 tabular-nums font-mono">
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
                                        <CreditCard className="h-4 w-4 text-emerald-400" />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
                                            Cobros / Total Calculado
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Operación</span>
                                        <span className="text-base font-black text-blue-400 tabular-nums font-mono">
                                            ${currentCalculatedTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {editingSale.pagos && editingSale.pagos.map((pago, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-xs font-bold text-slate-400 w-28 uppercase">{pago.metodo || 'Cobro'}</span>
                                        <div className="flex items-center ml-auto">
                                            <span className="mr-1 text-slate-500 font-bold text-xs">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                aria-label={`Monto del cobro ${pago.metodo || pIdx + 1}`}
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
                                onClick={() => setEditingSale(null)}
                                disabled={isSavingEdit}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all min-h-[40px]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 min-h-[40px]"
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

export default VentasView
