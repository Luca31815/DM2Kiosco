import React, { useState } from 'react'
import { useReservasDetalles, useMovimientosDinero, useMovimientosStock } from '../../hooks/useData'
import { Loader2, Edit2, Check, X, Calendar, Package, CreditCard, ChevronRight, Trash2 } from 'lucide-react'
import * as api from '../../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../ProductAutocomplete'
import { toast } from 'react-hot-toast'

export const ReservasExpandedRow = ({ row }) => {
    const { data: details, loading: loadingDetails } = useReservasDetalles(row.reserva_id)
    const { data: dinero, loading: loadingDinero } = useMovimientosDinero(row.reserva_id)
    const { data: stock, loading: loadingStock } = useMovimientosStock(row.reserva_id)
    const { mutate } = useSWRConfig()

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [editingPaymentId, setEditingPaymentId] = useState(null)
    const [editPaymentForm, setEditPaymentForm] = useState({})
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
                id_final: row.reserva_id,
                items: [{
                    id: originalDetail.id,
                    producto: originalDetail.producto,
                    nuevo_nombre: editForm.producto,
                    nueva_cantidad: editForm.cantidad,
                    nuevo_precio: editForm.precio_unitario
                }]
            })
            mutate(['reservas_detalles', row.reserva_id])
            mutate(['movimientos_dinero', row.reserva_id])
            mutate(['stock_movimientos', row.reserva_id])
            mutate(['reservas'])
            mutate(key => Array.isArray(key) && key[0] === 'productos')
            setEditingId(null)
            toast.success('Reserva actualizada correctamente', { id: loadingToast })
        } catch (error) {
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    const handleSavePayment = async (originalPayment) => {
        const loadingToast = toast.loading('Guardando pago...')
        setIsSaving(true)
        try {
            await api.corregirOperacion({
                id_final: row.reserva_id,
                pagos: [{
                    metodo: originalPayment.metodo,
                    nuevo_metodo: editPaymentForm.metodo,
                    nuevo_monto: parseFloat(editPaymentForm.monto)
                }]
            })
            mutate(['movimientos_dinero', row.reserva_id])
            mutate(['reservas'])
            setEditingPaymentId(null)
            toast.success('Pago actualizado correctamente', { id: loadingToast })
        } catch (error) {
            toast.error('Error al guardar pago: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeletePayment = async (originalPayment) => {
        if (!window.confirm('¿Estás seguro de eliminar este pago?')) return
        const loadingToast = toast.loading('Eliminando pago...')
        setIsSaving(true)
        try {
            await api.corregirOperacion({
                id_final: row.reserva_id,
                pagos: [{
                    metodo: originalPayment.metodo,
                    nuevo_metodo: originalPayment.metodo,
                    nuevo_monto: 0
                }]
            })
            mutate(['movimientos_dinero', row.reserva_id])
            mutate(['reservas'])
            setEditingPaymentId(null)
            toast.success('Pago eliminado correctamente', { id: loadingToast })
        } catch (error) {
            toast.error('Error al eliminar pago: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeliver = async () => {
        if (!window.confirm('¿Estás seguro de marcar esta reserva como ENTREGADA? Esto descontará los productos del stock.')) return
        const loadingToast = toast.loading('Entregando reserva y descontando stock...')
        setIsSaving(true)
        try {
            await api.entregarReserva(row.reserva_id)
            mutate(['stock_movimientos', row.reserva_id])
            mutate(['reservas'])
            mutate(key => Array.isArray(key) && key[0] === 'productos')
            toast.success('Reserva marcada como entregada correctamente', { id: loadingToast })
        } catch (error) {
            toast.error('Error al entregar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="p-6 space-y-8 bg-slate-900 rounded-2xl border border-white/5 shadow-2xl mx-2 mb-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-black text-slate-300">
                        Reserva: <span className="text-white font-mono">{row.reserva_id}</span>
                    </span>
                </div>
                {row.estado_entrega !== 'Entregado' && (
                    <button type="button"
                        onClick={handleDeliver}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-600/50 disabled:to-indigo-600/50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:pointer-events-none"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Marcar como Entregada
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Package className="h-4 w-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Productos Reservados</h4>
                        </div>
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
                                                    aria-label="Editar"
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

                <div className="w-full lg:w-96 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <CreditCard className="h-4 w-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Pagos / Señas</h4>
                        </div>
                        <div className="bg-slate-950/20 rounded-xl border border-white/5 p-4 divide-y divide-white/5">
                            {dinero.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center py-2 italic font-medium">Sin movimientos de dinero</p>
                            ) : dinero.map((m) => (
                                <div key={m.movimiento_id}>
                                    {editingPaymentId === m.movimiento_id ? (
                                        <div className="flex flex-col gap-2 py-2.5">
                                            <div className="flex gap-2">
                                                <select
                                                    value={editPaymentForm.metodo}
                                                    aria-label="Método de pago"
                                                    onChange={e => setEditPaymentForm({ ...editPaymentForm, metodo: e.target.value })}
                                                    className="bg-slate-900 border-none rounded-lg text-xs px-2 py-1 text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 w-1/2"
                                                >
                                                    <option value="Efectivo">Efectivo</option>
                                                    <option value="Tarjeta">Tarjeta</option>
                                                    <option value="Transferencia">Transferencia</option>
                                                </select>
                                                <div className="flex items-center bg-slate-900 rounded-lg px-2 py-1 w-1/2">
                                                    <span className="text-xs text-slate-500 mr-1">$</span>
                                                    <input
                                                        type="number"
                                                        aria-label="Monto"
                                                        value={editPaymentForm.monto}
                                                        onChange={e => setEditPaymentForm({ ...editPaymentForm, monto: e.target.value })}
                                                        className="bg-transparent border-none text-xs text-right text-slate-200 outline-none w-full tabular-nums"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-1">
                                                <button type="button"
                                                    onClick={() => handleSavePayment(m)}
                                                    className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-all"
                                                    title="Guardar"
                                                    aria-label="Guardar pago"
                                                >
                                                    <Check size={12} />
                                                </button>
                                                <button type="button"
                                                    onClick={() => handleDeletePayment(m)}
                                                    className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all"
                                                    title="Eliminar"
                                                    aria-label="Eliminar pago"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <button type="button"
                                                    onClick={() => setEditingPaymentId(null)}
                                                    className="p-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-all"
                                                    title="Cancelar"
                                                    aria-label="Cancelar edición"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center py-2.5 group/pay">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{m.metodo}</span>
                                                <span className="text-[10px] text-slate-600">{new Date(m.fecha).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-emerald-400 tabular-nums">${m.monto}</span>
                                                <button type="button"
                                                    onClick={() => {
                                                        setEditingPaymentId(m.movimiento_id)
                                                        setEditPaymentForm({ metodo: m.metodo, monto: m.monto })
                                                    }}
                                                    aria-label="Editar pago"
                                                    className="p-1 text-slate-600 hover:text-white hover:bg-white/5 rounded transition-all opacity-0 group-hover/pay:opacity-100"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ChevronRight className="h-4 w-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Entregas de Stock</h4>
                        </div>
                        <div className="bg-slate-950/20 rounded-xl border border-white/5 p-4 divide-y divide-white/5">
                            {stock.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center py-2 italic font-medium">Sin movimientos de stock</p>
                            ) : stock.map((s) => (
                                <div key={s.movimiento_id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                    <span className="text-xs font-bold text-slate-400 truncate max-w-[180px]">{s.producto}</span>
                                    <span className="text-sm font-black text-orange-400 tabular-nums">-{s.cantidad}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
