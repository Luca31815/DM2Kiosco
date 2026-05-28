import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Coins, 
  Package, 
  RefreshCcw, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User, 
  Info,
  ShieldCheck,
  Search,
  ArrowRight,
  TrendingDown,
  ExternalLink,
  Loader2,
  Edit2,
  Check,
  X,
  Plus
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDescalcesPagos } from '../hooks/useData'
import * as api from '../services/api'

// Sub-componente para cargar y editar los detalles bajo demanda
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
            console.error("Error loading details:", err)
            setError("Error al cargar los detalles de la base de datos.")
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
            onRefresh() // Refresca la vista principal
            await loadDetails() // Recarga los detalles locales
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

        if (isNaN(nuevaCant) || nuevaCant <= 0) {
            return toast.error('La cantidad debe ser mayor a 0')
        }
        if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
            return toast.error('El precio unitario debe ser válido')
        }

        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando productos y recalculando...')
        try {
            await api.corregirOperacion({
                id_final: operacionId,
                items: [{
                    producto: originalItem.producto,
                    nuevo_nombre: originalItem.nombre || originalItem.producto,
                    nueva_cantidad: nuevaCant,
                    nuevo_precio: nuevoPrecio
                }]
            })
            toast.success('Detalle de producto guardado con éxito', { id: loadingToast })
            setEditingItemId(null)
            onRefresh() // Refresca la vista principal
            await loadDetails() // Recarga los detalles locales
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 3. Guardar Pago de Caja
    const handleSavePayment = async (paymentId) => {
        const nuevoMonto = parseFloat(paymentForm.monto)
        if (isNaN(nuevoMonto) || nuevoMonto < 0) {
            return toast.error('Ingresá un monto de pago válido')
        }

        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando movimiento de caja...')
        try {
            await api.actualizarMovimientoDinero(paymentId, { monto: nuevoMonto })
            toast.success('Pago de caja corregido', { id: loadingToast })
            setEditingPaymentId(null)
            onRefresh() // Refresca la vista principal
            await loadDetails() // Recarga los detalles locales
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 4. Crear Pago Manual (Si no tiene)
    const handleCreatePayment = async () => {
        setIsSaving(true)
        const loadingToast = toast.loading('Creando movimiento de caja compensatorio...')
        try {
            // Creamos un nuevo movimiento en movimientos_dinero
            const response = await api.crearRetiro({
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO',
                monto: parseFloat(cabeceraOriginal),
                motivo: `Conciliación manual descalce ${tipoOperacion}`,
                cuenta_caja: 'Caja Principal',
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                notas: `[CONCILIADO MANUAL] Generado desde Auditoría para saldar descalce.`
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 col-span-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400 mr-2" />
                <span className="text-sm text-slate-400">Consultando detalles de la transacción...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg text-red-400 text-sm col-span-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-4 bg-slate-900/60 rounded-b-xl border-t border-slate-800/80 p-5">
            
            {/* Sección Rápida de Ajuste de Cabecera */}
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
                                    <button 
                                        onClick={handleSaveCabecera}
                                        disabled={isSaving}
                                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setEditingCabecera(false)}
                                        disabled={isSaving}
                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                                    >
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
                        onClick={() => {
                            setEditingCabecera(true)
                            setCabeceraForm({ total: cabeceraOriginal })
                        }}
                        disabled={isSaving}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-750"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Ajustar Cabecera</span>
                    </button>
                )}
            </div>

            {/* Dos Grillas de Conciliación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Columna 1: Productos (Detalles) */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-slate-350 font-semibold border-b border-slate-800 pb-2 text-[10px] uppercase tracking-wider">
                        <Package className="w-3.5 h-3.5 text-violet-400" />
                        <span>Productos registrados en la operación</span>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">Sin productos registrados en los detalles.</p>
                    ) : (
                        <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                            <table className="w-full text-left text-xs text-slate-350">
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
                                                <td className="py-2 text-slate-300 font-medium max-w-[150px] truncate" title={it.nombre || it.producto_id}>
                                                    {it.nombre || it.producto_id}
                                                </td>
                                                
                                                {/* Cantidad */}
                                                <td className="py-2 text-right font-mono text-slate-400">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-12 text-right text-slate-100 font-mono focus:outline-none"
                                                            value={itemForm.cantidad}
                                                            onChange={e => setItemForm({ ...itemForm, cantidad: e.target.value })}
                                                            disabled={isSaving}
                                                        />
                                                    ) : (
                                                        it.cantidad
                                                    )}
                                                </td>
                                                
                                                {/* Precio Unitario */}
                                                <td className="py-2 text-right font-mono text-slate-400">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-16 text-right text-slate-100 font-mono focus:outline-none"
                                                            value={itemForm.precio_unitario}
                                                            onChange={e => setItemForm({ ...itemForm, precio_unitario: e.target.value })}
                                                            disabled={isSaving}
                                                        />
                                                    ) : (
                                                        `$${Number(it.precio_unitario || it.precio || 0).toLocaleString('es-AR')}`
                                                    )}
                                                </td>
                                                
                                                {/* Subtotal */}
                                                <td className="py-2 text-right font-mono text-slate-200 font-medium">
                                                    ${Number(it.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </td>

                                                {/* Botones de acción */}
                                                <td className="py-2 text-center">
                                                    {isEditing ? (
                                                        <div className="flex justify-center items-center space-x-1">
                                                            <button 
                                                                onClick={() => handleSaveItem(it)}
                                                                disabled={isSaving}
                                                                className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditingItemId(null)}
                                                                disabled={isSaving}
                                                                className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                setEditingItemId(it.id)
                                                                setItemForm({ 
                                                                    cantidad: it.cantidad, 
                                                                    precio_unitario: it.precio_unitario || it.precio || '0' 
                                                                })
                                                            }}
                                                            disabled={isSaving}
                                                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                                                        >
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
                            <button
                                onClick={handleCreatePayment}
                                disabled={isSaving}
                                className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-350 transition-colors uppercase"
                            >
                                <Plus className="w-3 h-3" />
                                <span>Crear Pago Compensante</span>
                            </button>
                        )}
                    </div>
                    {payments.length === 0 ? (
                        <div className="py-6 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
                            <p className="text-xs text-slate-500 italic">Sin registros de pago vinculados en caja.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                            <table className="w-full text-left text-xs text-slate-350">
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
                                                <td className="py-2 text-slate-300 font-medium">
                                                    {p.cuenta_caja || p.tipo_movimiento || 'Caja Principal'}
                                                </td>
                                                <td className="py-2 text-slate-400 italic max-w-[130px] truncate" title={p.notas || ''}>
                                                    {p.notas || '-'}
                                                </td>
                                                
                                                {/* Monto de pago */}
                                                <td className="py-2 text-right font-mono text-emerald-400 font-medium">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <span className="text-[10px] text-slate-500">$</span>
                                                            <input
                                                                type="number"
                                                                className="bg-slate-805 border border-slate-700 rounded px-1.5 py-0.5 w-20 text-right text-emerald-400 font-mono font-medium focus:outline-none"
                                                                value={paymentForm.monto}
                                                                onChange={e => setPaymentForm({ monto: e.target.value })}
                                                                disabled={isSaving}
                                                            />
                                                        </div>
                                                    ) : (
                                                        `$${Number(p.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                                    )}
                                                </td>

                                                {/* Botones de acción */}
                                                <td className="py-2 text-center">
                                                    {isEditing ? (
                                                        <div className="flex justify-center items-center space-x-1">
                                                            <button 
                                                                onClick={() => handleSavePayment(p.movimiento_id)}
                                                                disabled={isSaving}
                                                                className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditingPaymentId(null)}
                                                                disabled={isSaving}
                                                                className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                setEditingPaymentId(p.movimiento_id)
                                                                setPaymentForm({ monto: p.monto || '0' })
                                                            }}
                                                            disabled={isSaving}
                                                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                                                        >
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

                    {/* Resumen explicativo de curación */}
                    <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px] flex items-start space-x-2">
                        <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                        <div className="text-slate-400 leading-relaxed">
                            {payments.length === 1 ? (
                                <p>
                                    <span className="text-emerald-400 font-semibold">Auto-Curable:</span> Al contar con exactamente <span className="text-emerald-300">1 registro de pago</span>, el proceso automático reajustará el monto en caja para que coincida perfectamente con la cabecera sin alterar otros datos.
                                </p>
                            ) : payments.length === 0 ? (
                                <p>
                                    <span className="text-amber-400 font-semibold">Sin Pagos:</span> No hay movimientos en caja para esta operación. Se requiere revisar el flujo y registrar el cobro/pago correspondiente en caja. Puedes usar el botón <span className="text-emerald-400">Crear Pago Compensante</span> arriba para saldarlo al instante.
                                </p>
                            ) : (
                                <p>
                                    <span className="text-rose-400 font-semibold">Pago Dividido:</span> Tiene múltiples pagos en caja. Para resguardar la distribución original en cada cuenta de origen, el sistema <span className="text-rose-300 font-semibold">no realiza corrección automática</span>. Requiere conciliación manual.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const DescalcesView = () => {
    const { data: rawDescalces, loading, error, mutate } = useDescalcesPagos()
    const [searchTerm, setSearchTerm] = useState('')
    const [tipoFilter, setTipoFilter] = useState('TODOS')
    
    // Pestañas de Conciliación
    // 'todas' = Todas las inconsistencias
    // 'revisar' = Solo las que no puede curar el cron job (cantidad_pagos != 1)
    const [activeTab, setActiveTab] = useState('todas')
    
    const [auditing, setAuditing] = useState(false)
    const [expandedIds, setExpandedIds] = useState(new Set())

    // Alternar expansión de fila
    const toggleExpand = (id) => {
        const next = new Set(expandedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setExpandedIds(next)
    }

    // Filtrado de descalces
    const descalces = useMemo(() => {
        if (!rawDescalces) return []
        return rawDescalces.filter(d => {
            const matchesSearch = 
                d.operacion_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.entidad?.toLowerCase().includes(searchTerm.toLowerCase())
            
            const matchesTipo = 
                tipoFilter === 'TODOS' || 
                d.tipo_operacion === tipoFilter
            
            // Filtro por pestaña (cron no puede corregir si cantidad_pagos != 1)
            const matchesTab =
                activeTab === 'todas' ||
                d.cantidad_pagos !== 1
                
            return matchesSearch && matchesTipo && matchesTab
        })
    }, [rawDescalces, searchTerm, tipoFilter, activeTab])

    // Estadísticas
    const stats = useMemo(() => {
        if (!rawDescalces) return { total: 0, totalDiferenciaPagos: 0, manualesCount: 0 }
        
        let totalDiferenciaPagos = 0
        let manualesCount = 0

        rawDescalces.forEach(d => {
            totalDiferenciaPagos += Math.abs(d.diferencia_cabecera_pagos || 0)
            if (d.cantidad_pagos !== 1) {
                manualesCount += 1
            }
        })

        return {
            total: rawDescalces.length,
            totalDiferenciaPagos,
            manualesCount
        }
    }, [rawDescalces])

    // Ejecutar auditoría y auto-curación
    const handleRunAudit = async () => {
        setAuditing(true)
        const loadingToast = toast.loading('Ejecutando auditoría inteligente de pagos y auto-curación de descalces...')
        
        try {
            const result = await api.auditarDescalcesPagos()
            if (result && result.success) {
                toast.success(
                    `Auditoría finalizada. Se auto-curaron ${result.auto_curados} operaciones y se generaron ${result.alertas_manuales} alertas de revisión manual.`, 
                    { id: loadingToast, duration: 6000 }
                )
                mutate() // Refrescar los descalces desde la base de datos
            } else {
                toast.error(`La auditoría finalizó con advertencias o estructura inválida.`, { id: loadingToast })
            }
        } catch (err) {
            console.error("Error al ejecutar la auditoría:", err)
            toast.error(`Error al ejecutar auditoría: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setAuditing(false)
        }
    }

    if (error) {
        return (
            <div className="p-6 text-slate-100 min-h-screen">
                <div className="bg-red-950/20 border border-red-800/60 rounded-2xl p-8 max-w-2xl mx-auto mt-12 text-center shadow-2xl backdrop-blur-md">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error al conectar con la auditoría</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        No se pudo obtener la vista de conciliación de pagos. Asegurate de que el servidor o la base de datos Supabase estén activos.
                    </p>
                    <button 
                        onClick={() => mutate()} 
                        className="px-5 py-2.5 bg-red-900/60 hover:bg-red-800/80 border border-red-700/60 text-red-100 rounded-xl transition-all duration-200 font-medium"
                    >
                        Reintentar Conexión
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 text-slate-100 space-y-6">
            
            {/* Header de la pantalla */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/35 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100">Conciliación y Auditoría de Pagos</h1>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                        Detección dinámica de desajustes entre el total de las facturas (Cabecera), la suma de los productos (Detalles) y las transacciones de Caja (Pagos).
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRunAudit}
                        disabled={auditing || loading}
                        className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 disabled:cursor-not-allowed text-white font-medium border border-violet-500/30 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.2)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <RefreshCcw className={`w-4 h-4 ${auditing ? 'animate-spin' : ''}`} />
                        <span>{auditing ? 'Auditando...' : 'Ejecutar Conciliación y Auto-Curación'}</span>
                    </button>
                </div>
            </div>

            {/* Ficha de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800/60 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-200 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                        <AlertTriangle className="w-24 h-24" />
                    </div>
                    <span className="text-xs text-slate-450 uppercase font-semibold tracking-wider block">Transacciones Desajustadas</span>
                    <span className="text-3xl font-mono font-bold text-amber-400 mt-2 block">
                        {loading ? '...' : stats.total}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                        Operaciones de compra o venta con alertas
                    </span>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800/60 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-200 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                        <Coins className="w-24 h-24" />
                    </div>
                    <span className="text-xs text-slate-450 uppercase font-semibold tracking-wider block">Diferencia Acumulada en Caja</span>
                    <span className="text-3xl font-mono font-bold text-rose-400 mt-2 block">
                        {loading ? '...' : `$${stats.totalDiferenciaPagos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                        Monto neto fuera de balance financiero
                    </span>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800/60 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-200 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck className="w-24 h-24" />
                    </div>
                    <span className="text-xs text-slate-450 uppercase font-semibold tracking-wider block">Revisión Manual Requerida</span>
                    <span className="text-3xl font-mono font-bold text-emerald-400 mt-2 block">
                        {loading ? '...' : stats.manualesCount}
                    </span>
                    <span className="text-xs text-slate-550 mt-1 block">
                        Operaciones que no puede curar el cron job
                    </span>
                </div>
            </div>

            {/* Pestañas de Selección */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('todas')}
                    className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all relative ${
                        activeTab === 'todas'
                            ? 'border-violet-500 text-violet-400 bg-violet-500/[0.02]'
                            : 'border-transparent text-slate-450 hover:text-slate-200'
                    }`}
                >
                    Todas las Inconsistencias
                    {!loading && stats.total > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
                            {stats.total}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('revisar')}
                    className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all relative ${
                        activeTab === 'revisar'
                            ? 'border-rose-500 text-rose-450 bg-rose-500/[0.02]'
                            : 'border-transparent text-slate-450 hover:text-slate-200'
                    }`}
                >
                    Revisión Manual Obligatoria (No Curables)
                    {!loading && stats.manualesCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                            {stats.manualesCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-900/20 p-4 rounded-xl border border-slate-800/40">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por ID de operación o entidad (Cliente/Proveedor)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Filtrar Tipo:</span>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {['TODOS', 'VENTA', 'COMPRA'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTipoFilter(t)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    tipoFilter === t 
                                        ? 'bg-slate-800 text-slate-100 shadow-inner' 
                                        : 'text-slate-450 hover:text-slate-200'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cuerpo / Listado */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 rounded-2xl border border-slate-800/40">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-3" />
                        <span className="text-sm text-slate-400">Analizando registros financieros...</span>
                    </div>
                ) : descalces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-900/10 rounded-2xl border border-slate-800/40 text-center px-4">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-200">¡Todo en Orden!</h3>
                        <p className="text-slate-400 text-sm max-w-md mt-1 leading-relaxed">
                            {activeTab === 'todas'
                                ? 'No se detectaron discrepancias de montos entre cabeceras, detalles y movimientos de caja en el inventario actual.'
                                : 'No hay inconsistencias obligatorias para revisión manual. El cron job puede auto-curar todo lo restante.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {descalces.map((d) => {
                                const isExpanded = expandedIds.has(d.operacion_id)
                                const isVenta = d.tipo_operacion === 'VENTA'
                                const hasPagoMismatch = d.diferencia_cabecera_pagos !== 0
                                const hasDetalleMismatch = d.diferencia_cabecera_detalles !== 0

                                return (
                                    <motion.div
                                        key={d.operacion_id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`bg-slate-900/20 border rounded-2xl transition-all duration-200 overflow-hidden hover:border-slate-700/60 ${
                                            isExpanded ? 'border-slate-750 bg-slate-900/30' : 'border-slate-800/50'
                                        }`}
                                    >
                                        {/* Card Header clickable */}
                                        <div 
                                            onClick={() => toggleExpand(d.operacion_id)}
                                            className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                                        >
                                            {/* ID, Info Básica */}
                                            <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                                                <div className={`mt-0.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                    isVenta 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                                }`}>
                                                    {d.tipo_operacion}
                                                </div>
                                                <div className="space-y-0.5 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-slate-200 truncate">{d.operacion_id}</span>
                                                        <span className="text-[10px] text-slate-500">•</span>
                                                        <span className="text-xs text-slate-450 flex items-center">
                                                            <Calendar className="w-3.5 h-3.5 mr-1" />
                                                            {new Date(d.fecha_operacion).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className="truncate">{d.entidad || 'Consumidor Final'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Comparación de cifras */}
                                            <div className="grid grid-cols-3 gap-6 lg:gap-8 pr-2">
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Cabecera</span>
                                                    <span className="text-sm font-mono font-bold text-slate-200 block mt-0.5">
                                                        ${Number(d.monto_cabecera).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Detalles</span>
                                                    <span className={`text-sm font-mono font-bold block mt-0.5 ${
                                                        hasDetalleMismatch ? 'text-amber-400 font-semibold' : 'text-slate-350'
                                                    }`}>
                                                        ${Number(d.monto_detalles).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Caja (Pagos)</span>
                                                    <span className={`text-sm font-mono font-bold block mt-0.5 ${
                                                        hasPagoMismatch ? 'text-rose-400 font-semibold' : 'text-slate-350'
                                                    }`}>
                                                        ${Number(d.monto_pagos).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Badges de Desviación y flecha */}
                                            <div className="flex items-center justify-between lg:justify-end gap-3.5 border-t border-slate-800/40 lg:border-t-0 pt-3 lg:pt-0">
                                                <div className="flex flex-wrap gap-2">
                                                    {hasPagoMismatch && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                            <TrendingDown className="w-3 h-3 mr-1" />
                                                            Caja: ${Math.abs(d.diferencia_cabecera_pagos).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                    {hasDetalleMismatch && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            Detalle: ${Math.abs(d.diferencia_cabecera_detalles).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-slate-450 hover:text-slate-200 transition-colors">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detalle Expandible */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <OperationDetails 
                                                        operacionId={d.operacion_id} 
                                                        tipoOperacion={d.tipo_operacion} 
                                                        cabeceraOriginal={d.monto_cabecera}
                                                        onRefresh={() => mutate()}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Panel de Leyenda Explicativa al pie */}
            <div className="p-5 bg-slate-900/15 border border-slate-800/40 rounded-2xl text-xs space-y-3 leading-relaxed text-slate-400">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                    <Info className="w-4 h-4 text-violet-400" />
                    <span>Guía y Protocolo de Conciliación</span>
                </div>
                <p>
                    Los desajustes de pagos ocurren habitualmente cuando una operación de compra o venta se asume cancelada por completo en el momento del registro en el punto de venta (Cabecera), pero el movimiento de dinero asociado en la Caja Chica no se generó o se guardó con una cantidad discrepante.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <span className="font-semibold text-slate-300 block">¿Cómo funciona la auto-curación?</span>
                        <span>
                            La función de base de datos evalúa cada desajuste. Si la transacción cuenta con exactamente un pago (o sea, no está dividida), el sistema entiende que fue un error de tipeo y sobrescribe el pago de caja para alinearlo con el total facturado.
                        </span>
                    </div>
                    <div className="space-y-1">
                        <span className="font-semibold text-slate-300 block">¿Cómo auditar transacciones manuales?</span>
                        <span>
                            Haciendo clic sobre cualquier registro desajustado, podés desglosar los productos registrados en sus detalles y comparar con los movimientos de caja reales. Las operaciones con múltiples pagos o sin pagos deben ser resueltas a través de los editores correspondientes de Ventas o Compras.
                        </span>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default DescalcesView
