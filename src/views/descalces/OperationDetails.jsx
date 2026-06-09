import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle, Coins, Package, Loader2, Edit2, Check, X, Plus, Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as api from '../../services/api'

// ─────────────────────────────────────────────────────────────────────────────
// OperationDetails — Panel expandido con detalles de una operación en descalce.
// Carga los productos y pagos de la operación bajo demanda y permite editarlos.
// Extraído de DescalcesView para reducir el tamaño del archivo principal.
// ─────────────────────────────────────────────────────────────────────────────
const OperationDetails = ({ operacionId, tipoOperacion, onRefresh, cabeceraOriginal }) => {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([])
    const [payments, setPayments] = useState([])
    const [error, setError] = useState(null)

    // Estados de edición
    const [editingItemId, setEditingItemId] = useState(null)
    const [itemForm, setItemForm] = useState({ cantidad: '', precio_unitario: '' })

    const [editingPaymentId, setEditingPaymentId] = useState(null)
    const [paymentForm, setPaymentForm] = useState({ monto: '' })

    const [editingCabecera, setEditingCabecera] = useState(false)
    const [cabeceraForm, setCabeceraForm] = useState({ total: '' })

    const [isSaving, setIsSaving] = useState(false)

    const loadDetails = async () => {
        try {
            setLoading(true)
            const [itemsData, paymentsData] = await Promise.all([
                tipoOperacion === 'VENTA'
                    ? api.getVentasDetalles(operacionId)
                    : api.getComprasDetalles(operacionId),
                api.getMovimientosDinero(operacionId)
            ])
            setItems(itemsData)
            setPayments(paymentsData)
            setLoading(false)
        } catch (err) {
            console.error('Error loading details:', err)
            setError('Error al cargar los detalles de la base de datos.')
            setLoading(false)
        }
    }

    React.useEffect(() => {
        loadDetails()
    }, [operacionId, tipoOperacion])

    // --- ACCIONES DE EDICIÓN ---

    // 1. Guardar Cabecera
    const handleSaveCabecera = async () => {
        const nuevoTotal = parseFloat(cabeceraForm.total)
        if (isNaN(nuevoTotal) || nuevoTotal < 0) {
            return toast.error('Ingresá un monto de cabecera válido')
        }
        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando cabecera de la operación...')
        try {
            await api.actualizarCabeceraOperacion(tipoOperacion, operacionId, nuevoTotal)
            toast.success('Monto de cabecera actualizado', { id: loadingToast })
            setEditingCabecera(false)
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 2. Guardar Item (Producto)
    const handleSaveItem = async (originalItem) => {
        const nuevaCant = parseFloat(itemForm.cantidad)
        const nuevoPrecio = parseFloat(itemForm.precio_unitario)
        if (isNaN(nuevaCant) || nuevaCant <= 0) return toast.error('La cantidad debe ser mayor a 0')
        if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return toast.error('El precio unitario debe ser válido')
        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando productos y recalculando...')
        try {
            await api.corregirOperacion({
                id_final: operacionId,
                items: [{ producto: originalItem.producto, nuevo_nombre: originalItem.nombre || originalItem.producto, nueva_cantidad: nuevaCant, nuevo_precio: nuevoPrecio }]
            })
            toast.success('Detalle de producto guardado con éxito', { id: loadingToast })
            setEditingItemId(null)
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 3. Guardar Pago de Caja
    const handleSavePayment = async (paymentId) => {
        const nuevoMonto = parseFloat(paymentForm.monto)
        if (isNaN(nuevoMonto) || nuevoMonto < 0) return toast.error('Ingresá un monto de pago válido')
        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando movimiento de caja...')
        try {
            await api.actualizarMovimientoDinero(paymentId, { monto: nuevoMonto })
            toast.success('Pago de caja corregido', { id: loadingToast })
            setEditingPaymentId(null)
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 4. Crear Pago Manual
    const handleCreatePayment = async () => {
        setIsSaving(true)
        const loadingToast = toast.loading('Creando movimiento de caja compensatorio...')
        try {
            await api.crearRetiro({
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO',
                monto: parseFloat(cabeceraOriginal),
                motivo: `Conciliación manual descalce ${tipoOperacion}`,
                cuenta_caja: 'Caja Principal',
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                notas: '[CONCILIADO MANUAL] Generado desde Auditoría para saldar descalce.'
            })
            toast.success('Movimiento de caja creado y conciliado', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error al crear movimiento: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-8 col-span-2">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400 mr-2" />
            <span className="text-sm text-slate-400">Consultando detalles de la transacción...</span>
        </div>
    )

    if (error) return (
        <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg text-red-400 text-sm col-span-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />{error}
        </div>
    )

    return (
        <div className="space-y-4 bg-slate-900/60 rounded-b-xl border-t border-slate-800/80 p-5">

            {/* Ajuste de Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/45 p-4 rounded-xl border border-slate-850">
                <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Cabecera de Facturación</span>
                        <div className="flex items-center space-x-2">
                            {editingCabecera ? (
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-slate-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 w-28 text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                                        value={cabeceraForm.total}
                                        onChange={e => setCabeceraForm({ total: e.target.value })}
                                        disabled={isSaving}
                                    />
                                    <button onClick={handleSaveCabecera} disabled={isSaving} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingCabecera(false)} disabled={isSaving} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <span className="font-mono text-sm font-bold text-slate-100 mt-0.5">
                                    ${Number(cabeceraOriginal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {!editingCabecera && (
                    <button
                        onClick={() => { setEditingCabecera(true); setCabeceraForm({ total: cabeceraOriginal }) }}
                        disabled={isSaving}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-750"
                    >
                        <Edit2 className="w-3.5 h-3.5" /><span>Ajustar Cabecera</span>
                    </button>
                )}
            </div>

            {/* Grillas: Productos y Pagos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Columna 1: Productos */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-slate-350 font-semibold border-b border-slate-800 pb-2 text-[10px] uppercase tracking-wider">
                        <Package className="w-3.5 h-3.5 text-violet-400" />
                        <span>Productos registrados en la operación</span>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">Sin productos registrados en los detalles.</p>
                    ) : (
                        <div className="overflow-x-auto scroll-touch max-h-60 overflow-y-auto pr-1">
                            <table className="w-full text-left text-xs text-slate-350" style={{ minWidth: '450px' }}>
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-800/80 pb-1">
                                        <th className="py-1.5 font-normal">Producto</th>
                                        <th className="py-1.5 font-normal text-right">Cant.</th>
                                        <th className="py-1.5 font-normal text-right">Precio</th>
                                        <th className="py-1.5 font-normal text-right">Subtotal</th>
                                        <th className="py-1.5 font-normal text-center w-16">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {items.map((it, idx) => {
                                        const isEditing = editingItemId === it.id
                                        return (
                                            <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="py-2 text-slate-300 font-medium max-w-[150px] truncate" title={it.nombre || it.producto_id}>{it.nombre || it.producto_id}</td>
                                                <td className="py-2 text-right font-mono text-slate-400">
                                                    {isEditing
                                                        ? <input type="number" className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-12 text-right text-slate-100 font-mono focus:outline-none" value={itemForm.cantidad} onChange={e => setItemForm({ ...itemForm, cantidad: e.target.value })} disabled={isSaving} />
                                                        : it.cantidad
                                                    }
                                                </td>
                                                <td className="py-2 text-right font-mono text-slate-400">
                                                    {isEditing
                                                        ? <input type="number" className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-16 text-right text-slate-100 font-mono focus:outline-none" value={itemForm.precio_unitario} onChange={e => setItemForm({ ...itemForm, precio_unitario: e.target.value })} disabled={isSaving} />
                                                        : `$${Number(it.precio_unitario || it.precio || 0).toLocaleString('es-AR')}`
                                                    }
                                                </td>
                                                <td className="py-2 text-right font-mono text-slate-200 font-medium">
                                                    ${Number(it.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2 text-center">
                                                    {isEditing ? (
                                                        <div className="flex justify-center items-center space-x-1">
                                                            <button onClick={() => handleSaveItem(it)} disabled={isSaving} className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => setEditingItemId(null)} disabled={isSaving} className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => { setEditingItemId(it.id); setItemForm({ cantidad: it.cantidad, precio_unitario: it.precio_unitario || it.precio || '0' }) }} disabled={isSaving} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Columna 2: Pagos en Caja */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center space-x-2 text-slate-355 font-semibold text-[10px] uppercase tracking-wider">
                            <Coins className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Movimientos registrados en caja</span>
                        </div>
                        {payments.length === 0 && (
                            <button onClick={handleCreatePayment} disabled={isSaving} className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-350 transition-colors uppercase">
                                <Plus className="w-3 h-3" /><span>Crear Pago Compensante</span>
                            </button>
                        )}
                    </div>

                    {payments.length === 0 ? (
                        <div className="py-6 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
                            <p className="text-xs text-slate-500 italic">Sin registros de pago vinculados en caja.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto scroll-touch max-h-60 overflow-y-auto pr-1">
                            <table className="w-full text-left text-xs text-slate-350" style={{ minWidth: '450px' }}>
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-800/80 pb-1">
                                        <th className="py-1.5 font-normal">Caja / Cuenta</th>
                                        <th className="py-1.5 font-normal">Concepto</th>
                                        <th className="py-1.5 font-normal text-right">Monto</th>
                                        <th className="py-1.5 font-normal text-center w-16">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {payments.map((p, idx) => {
                                        const isEditing = editingPaymentId === p.movimiento_id
                                        return (
                                            <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="py-2 text-slate-300 font-medium">{p.cuenta_caja || p.tipo_movimiento || 'Caja Principal'}</td>
                                                <td className="py-2 text-slate-400 italic max-w-[130px] truncate" title={p.notas || ''}>{p.notas || '-'}</td>
                                                <td className="py-2 text-right font-mono text-emerald-400 font-medium">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <span className="text-[10px] text-slate-500">$</span>
                                                            <input type="number" className="bg-slate-805 border border-slate-700 rounded px-1.5 py-0.5 w-20 text-right text-emerald-400 font-mono font-medium focus:outline-none" value={paymentForm.monto} onChange={e => setPaymentForm({ monto: e.target.value })} disabled={isSaving} />
                                                        </div>
                                                    ) : `$${Number(p.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                                                </td>
                                                <td className="py-2 text-center">
                                                    {isEditing ? (
                                                        <div className="flex justify-center items-center space-x-1">
                                                            <button onClick={() => handleSavePayment(p.movimiento_id)} disabled={isSaving} className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => setEditingPaymentId(null)} disabled={isSaving} className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => { setEditingPaymentId(p.movimiento_id); setPaymentForm({ monto: p.monto || '0' }) }} disabled={isSaving} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Info de curación */}
                    <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px] flex items-start space-x-2">
                        <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                        <div className="text-slate-400 leading-relaxed">
                            {payments.length === 1 ? (
                                <p><span className="text-emerald-400 font-semibold">Auto-Curable:</span> Al contar con exactamente <span className="text-emerald-300">1 registro de pago</span>, el proceso automático reajustará el monto en caja para que coincida perfectamente con la cabecera sin alterar otros datos.</p>
                            ) : payments.length === 0 ? (
                                <p><span className="text-amber-400 font-semibold">Sin Pagos:</span> No hay movimientos en caja para esta operación. Podés usar el botón <span className="text-emerald-400">Crear Pago Compensante</span> arriba para saldarlo al instante.</p>
                            ) : (
                                <p><span className="text-rose-400 font-semibold">Pago Dividido:</span> Tiene múltiples pagos en caja. El sistema <span className="text-rose-300 font-semibold">no realiza corrección automática</span>. Requiere conciliación manual.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OperationDetails
