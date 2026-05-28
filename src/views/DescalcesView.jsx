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
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDescalcesPagos } from '../hooks/useData'
import * as api from '../services/api'

// Sub-componente para cargar los detalles bajo demanda cuando se expande una fila
const OperationDetails = ({ operacionId, tipoOperacion }) => {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([])
    const [payments, setPayments] = useState([])
    const [error, setError] = useState(null)

    React.useEffect(() => {
        let isMounted = true
        const loadDetails = async () => {
            try {
                setLoading(true)
                const [itemsData, paymentsData] = await Promise.all([
                    tipoOperacion === 'VENTA' 
                        ? api.getVentasDetalles(operacionId) 
                        : api.getComprasDetalles(operacionId),
                    api.getMovimientosDinero(operacionId)
                ])
                if (isMounted) {
                    setItems(itemsData)
                    setPayments(paymentsData)
                    setLoading(false)
                }
            } catch (err) {
                console.error("Error loading details:", err)
                if (isMounted) {
                    setError("Error al cargar los detalles de la base de datos.")
                    setLoading(false)
                }
            }
        }
        loadDetails()
        return () => {
            isMounted = false
        }
    }, [operacionId, tipoOperacion])

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-900/60 rounded-b-xl border-t border-slate-800/80">
            {/* Columna 1: Productos (Detalles) */}
            <div className="space-y-3">
                <div className="flex items-center space-x-2 text-slate-300 font-medium border-b border-slate-800 pb-2 text-xs uppercase tracking-wider">
                    <Package className="w-4 h-4 text-violet-400" />
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {items.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="py-2 text-slate-300 font-medium max-w-[200px] truncate" title={it.nombre || it.producto_id}>
                                            {it.nombre || it.producto_id}
                                        </td>
                                        <td className="py-2 text-right font-mono text-slate-400">{it.cantidad}</td>
                                        <td className="py-2 text-right font-mono text-slate-400">${Number(it.precio_unitario || it.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="py-2 text-right font-mono text-slate-200 font-medium">${Number(it.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Columna 2: Pagos en Caja */}
            <div className="space-y-3">
                <div className="flex items-center space-x-2 text-slate-300 font-medium border-b border-slate-800 pb-2 text-xs uppercase tracking-wider">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Movimientos registrados en caja</span>
                </div>
                {payments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">Sin registros de pago vinculados en caja.</p>
                ) : (
                    <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                        <table className="w-full text-left text-xs text-slate-350">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-800/80 pb-1">
                                    <th className="py-1.5 font-normal">Caja / Cuenta</th>
                                    <th className="py-1.5 font-normal">Concepto</th>
                                    <th className="py-1.5 font-normal text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {payments.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="py-2 text-slate-300 font-medium">
                                            {p.cuenta_caja || p.tipo_movimiento || 'Caja Principal'}
                                        </td>
                                        <td className="py-2 text-slate-400 italic max-w-[160px] truncate" title={p.notas || ''}>
                                            {p.notas || '-'}
                                        </td>
                                        <td className="py-2 text-right font-mono text-emerald-400 font-medium">${Number(p.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
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
                                <span className="text-amber-400 font-semibold">Sin Pagos:</span> No hay movimientos en caja para esta operación. Se requiere revisar el flujo y registrar el cobro/pago correspondiente en caja.
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
    )
}

const DescalcesView = () => {
    const { data: rawDescalces, loading, error, mutate } = useDescalcesPagos()
    const [searchTerm, setSearchTerm] = useState('')
    const [tipoFilter, setTipoFilter] = useState('TODOS')
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
            return matchesSearch && matchesTipo
        })
    }, [rawDescalces, searchTerm, tipoFilter])

    // Estadísticas
    const stats = useMemo(() => {
        if (!rawDescalces) return { total: 0, totalDiferenciaPagos: 0, autocurables: 0, manuales: 0 }
        
        let totalDiferenciaPagos = 0
        let autocurables = 0
        let manuales = 0

        rawDescalces.forEach(d => {
            totalDiferenciaPagos += Math.abs(d.diferencia_cabecera_pagos || 0)
            
            // Asumimos que si no hay pagos o la diferencia es curable en bd, contamos cómo
            // En la bd, fn_auditar_descalces_pagos hace COUNT(*) de pagos. Si es 1, cura.
            // Aquí en la vista no tenemos el count de pagos directamente de la consulta básica de la vista, 
            // pero podemos estimarlo o dejar que se clasifiquen al abrir. 
            // Para las stats rápidas, si la diferencia existe pero no conocemos el count, podemos enfocarnos en el total de descalces.
        })

        return {
            total: rawDescalces.length,
            totalDiferenciaPagos,
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
                    <span className="text-xs text-slate-450 uppercase font-semibold tracking-wider block">Regla de Negocio Crítica</span>
                    <span className="text-sm font-semibold text-emerald-400 mt-3 block flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
                        Ajuste de Pago Único Activo
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block leading-relaxed">
                        Se realinean automáticamente operaciones directas con un solo pago
                    </span>
                </div>
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
                            No se detectaron discrepancias de montos entre cabeceras, detalles y movimientos de caja en el inventario actual.
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
                    <span>Guía y Protocolo de Consiliación</span>
                </div>
                <p>
                    Los desajustes de pagos ocurren habitualmente cuando una operación de compra o venta se asume cancelada por completo en el momento del registro en el punto de venta (Cabecera), pero el movimiento de dinero asociado en la Caja Chica no se generó o se guardó con una cantidad discrepante.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <span className="font-semibold text-slate-300 block">¿Cómo funciona la auto-curación?</span>
                        <span>
                            La función de base de datos evalúa cada desajuste. Si la transacción cuenta con exactamente un pago (o sea, no está dividida), el sistema entiende que fue un error puntual de tipeo y sobrescribe el pago de caja para alinearlo con el total facturado.
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
