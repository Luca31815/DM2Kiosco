import React, { useState, useCallback } from 'react'
import {
    AlertTriangle, Coins, Package, Loader2, Edit2, Check, X, Plus, Info,
    Trash2, Zap, Sparkles, CheckCircle2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as api from '../../services/api'
import { OperationItemsTable, OperationPaymentsTable } from './OperationTables'

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

    const loadDetails = useCallback(async () => {
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
    }, [operacionId, tipoOperacion])

    React.useEffect(() => {
        loadDetails()
    }, [loadDetails])

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
            await api.crearMovimientoDinero({
                tipo: tipoOperacion === 'VENTA' ? 'ENTRADA' : 'SALIDA',
                monto: parseFloat(cabeceraOriginal),
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                metodo: 'Efectivo',
                notas: '[CONCILIADO MANUAL] Generado desde Auditoría para saldar descalce.',
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO'
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

    // 5. Eliminar Pago de Caja
    const handleDeletePayment = async (movimientoId) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro de pago de la caja?')) return
        setIsSaving(true)
        const loadingToast = toast.loading('Eliminando movimiento de caja...')
        try {
            await api.eliminarMovimientoDinero(movimientoId)
            toast.success('Movimiento de caja eliminado', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 6. Alinear Pago Único a la Cabecera
    const handleAlinearPagoACabecera = async () => {
        if (payments.length !== 1) return
        const payment = payments[0]
        const totalCabecera = parseFloat(cabeceraOriginal || 0)
        setIsSaving(true)
        const loadingToast = toast.loading('Alineando pago a cabecera...')
        try {
            await api.actualizarMovimientoDinero(payment.movimiento_id, { monto: totalCabecera })
            toast.success('Pago de caja corregido', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 7. Ajustar último pago para absorber la diferencia
    const handleAdjustLastPayment = async (diferencia) => {
        if (payments.length === 0) return
        const lastPayment = payments[payments.length - 1]
        const nuevoMonto = parseFloat(lastPayment.monto || 0) + diferencia
        if (nuevoMonto < 0) {
            return toast.error('El monto resultante para el pago sería negativo. Elimine el pago o ajuste manualmente.')
        }
        setIsSaving(true)
        const loadingToast = toast.loading('Ajustando el último pago para saldar la diferencia...')
        try {
            await api.actualizarMovimientoDinero(lastPayment.movimiento_id, { monto: nuevoMonto })
            toast.success('Último pago ajustado con éxito', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 8. Crear Pago por la Diferencia
    const handleCreateDifferencePayment = async (diferencia) => {
        if (diferencia <= 0) return
        setIsSaving(true)
        const loadingToast = toast.loading('Creando pago por la diferencia...')
        try {
            await api.crearMovimientoDinero({
                tipo: tipoOperacion === 'VENTA' ? 'ENTRADA' : 'SALIDA',
                monto: diferencia,
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                metodo: 'Efectivo',
                notas: '[CONCILIADO MANUAL] Pago por diferencia para saldar descalce.',
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO'
            })
            toast.success('Pago por la diferencia creado con éxito', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 9. Alinear cabecera a la suma de pagos
    const handleAlinearCabeceraAPagos = async (totalPagos) => {
        if (isNaN(totalPagos) || totalPagos < 0) return toast.error('Monto de pagos inválido')
        setIsSaving(true)
        const loadingToast = toast.loading('Alineando cabecera al total de pagos...')
        try {
            await api.actualizarCabeceraOperacion(tipoOperacion, operacionId, totalPagos)
            toast.success('Monto de cabecera alineado con los pagos', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 10. Reemplazar todos los pagos con uno único por la cabecera
    const handleResetAndCreateSinglePayment = async (totalCabecera) => {
        if (!window.confirm(`¿Estás seguro de eliminar todos los pagos actuales (${payments.length}) y reemplazarlos con un único pago de $${totalCabecera.toLocaleString('es-AR')}?`)) return
        setIsSaving(true)
        const loadingToast = toast.loading('Reemplazando pagos con pago único...')
        try {
            for (const p of payments) {
                await api.eliminarMovimientoDinero(p.movimiento_id)
            }
            await api.crearMovimientoDinero({
                tipo: tipoOperacion === 'VENTA' ? 'ENTRADA' : 'SALIDA',
                monto: totalCabecera,
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                metodo: 'Efectivo',
                notas: '[CONCILIADO MANUAL] Reemplazo de pagos múltiples para saldar descalce.',
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO'
            })
            toast.success('Pagos reemplazados con éxito', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
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

    const totalCabecera = parseFloat(cabeceraOriginal || 0)
    const totalPagos = payments.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
    const diferencia = totalCabecera - totalPagos
    const absDiferencia = Math.abs(diferencia)
    const isConciliado = absDiferencia < 0.01

    return (
        <div className="space-y-4 bg-slate-900/60 rounded-b-xl border-t border-slate-800/80 p-5">

            {/* Asistente de Conciliación Rápida */}
            <div className={`p-4 rounded-xl border transition-all duration-200 ${
                isConciliado 
                    ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-amber-950/10 border-amber-500/20 text-amber-300'
            }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <Zap className={`w-4 h-4 ${isConciliado ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                            <h4 className="text-xs font-bold uppercase tracking-wider">
                                Asistente de Conciliación Rápida
                            </h4>
                        </div>
                        {isConciliado ? (
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Esta operación está perfectamente conciliada. La cabecera y los movimientos de caja coinciden.
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Se detectó un desajuste de <span className="font-mono font-bold text-rose-450">${absDiferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>. 
                                La caja chica tiene {diferencia > 0 ? 'de menos' : 'de más'} dinero con respecto a la factura.
                            </p>
                        )}
                    </div>
                    {isConciliado ? (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase text-emerald-400 self-start sm:self-auto">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Conciliado</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold uppercase text-rose-400 self-start sm:self-auto">
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                            <span>Desajustado</span>
                        </div>
                    )}
                </div>

                {!isConciliado && (
                    <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-800/40">
                        {/* Option A: Align single payment to Cabecera (Case 1: exactly 1 payment) */}
                        {payments.length === 1 && (
                            <button type="button"
                                onClick={handleAlinearPagoACabecera}
                                disabled={isSaving}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all text-xs font-medium border border-emerald-500/20 shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Alinear pago a Cabecera (${totalCabecera.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                            </button>
                        )}

                        {/* Option B: Add payment for the difference (if diff > 0) */}
                        {diferencia > 0 && (
                            <button type="button"
                                onClick={() => handleCreateDifferencePayment(diferencia)}
                                disabled={isSaving}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-all text-xs font-medium border border-violet-500/20 shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Crear pago por la diferencia (${diferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                            </button>
                        )}

                        {/* Option C: Adjust last payment to absorb the difference (if payments.length > 0) */}
                        {payments.length > 0 && (
                            <button type="button"
                                onClick={() => handleAdjustLastPayment(diferencia)}
                                disabled={isSaving}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all text-xs font-medium border border-blue-500/20 shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Coins className="w-3.5 h-3.5" />
                                <span>Ajustar último pago</span>
                            </button>
                        )}

                        {/* Option D: Adjust Cabecera to Payments sum */}
                        <button type="button"
                            onClick={() => handleAlinearCabeceraAPagos(totalPagos)}
                            disabled={isSaving}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 transition-all text-xs font-medium border border-slate-700 shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Ajustar Cabecera a total pagos (${totalPagos.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                        </button>

                        {/* Option E: Reset and create single payment */}
                        {payments.length > 0 && (
                            <button type="button"
                                onClick={() => handleResetAndCreateSinglePayment(totalCabecera)}
                                disabled={isSaving}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 disabled:opacity-50 text-rose-300 transition-all text-xs font-medium border border-rose-500/25 shadow-md active:scale-95"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Reemplazar todo con pago único (${totalCabecera.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

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
                                        aria-label="Monto cabecera"
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 w-28 text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                                        value={cabeceraForm.total}
                                        onChange={e => setCabeceraForm({ total: e.target.value })}
                                        disabled={isSaving}
                                    />
                                    <button type="button" onClick={handleSaveCabecera} disabled={isSaving} aria-label="Guardar cabecera" className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button type="button" onClick={() => setEditingCabecera(false)} disabled={isSaving} aria-label="Cancelar edición cabecera" className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20">
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
                    <button type="button"
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
                <OperationItemsTable
                    items={items}
                    editingItemId={editingItemId}
                    setEditingItemId={setEditingItemId}
                    itemForm={itemForm}
                    setItemForm={setItemForm}
                    handleSaveItem={handleSaveItem}
                    isSaving={isSaving}
                />
                <OperationPaymentsTable
                    payments={payments}
                    editingPaymentId={editingPaymentId}
                    setEditingPaymentId={setEditingPaymentId}
                    paymentForm={paymentForm}
                    setPaymentForm={setPaymentForm}
                    handleSavePayment={handleSavePayment}
                    handleDeletePayment={handleDeletePayment}
                    handleCreatePayment={handleCreatePayment}
                    isSaving={isSaving}
                />
            </div>
        </div>
    )
}

export default OperationDetails
