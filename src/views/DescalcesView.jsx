import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle, Coins, ShieldCheck, RefreshCcw,
    ChevronDown, ChevronUp, Calendar, User, Info,
    Search, TrendingDown, Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDescalcesPagos } from '../hooks/useData'
import * as api from '../services/api'
import OperationDetails from './descalces/OperationDetails'

// ─────────────────────────────────────────────────────────────────────────────
// DescalcesView — Vista de Conciliación y Auditoría de Pagos
// El sub-componente de edición se encuentra en src/views/descalces/OperationDetails.jsx
// ─────────────────────────────────────────────────────────────────────────────
const DescalcesView = () => {
    const { data: rawDescalces, loading, error, mutate } = useDescalcesPagos()
    const [searchTerm, setSearchTerm] = useState('')
    const [tipoFilter, setTipoFilter] = useState('TODOS')
    const [activeTab, setActiveTab] = useState('todas')
    const [auditing, setAuditing] = useState(false)
    const [expandedIds, setExpandedIds] = useState(new Set())

    const toggleExpand = (id) => {
        const next = new Set(expandedIds)
        if (next.has(id)) { next.delete(id) } else { next.add(id) }
        setExpandedIds(next)
    }

    // Filtrado de descalces
    const descalces = useMemo(() => {
        if (!rawDescalces) return []
        return rawDescalces.filter(d => {
            const matchesSearch =
                d.operacion_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.entidad?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesTipo = tipoFilter === 'TODOS' || d.tipo_operacion === tipoFilter
            const matchesTab = activeTab === 'todas' || d.cantidad_pagos !== 1
            return matchesSearch && matchesTipo && matchesTab
        })
    }, [rawDescalces, searchTerm, tipoFilter, activeTab])

    // Estadísticas globales
    const stats = useMemo(() => {
        if (!rawDescalces) return { total: 0, totalDiferenciaPagos: 0, manualesCount: 0 }
        let totalDiferenciaPagos = 0
        let manualesCount = 0
        rawDescalces.forEach(d => {
            totalDiferenciaPagos += Math.abs(d.diferencia_cabecera_pagos || 0)
            if (d.cantidad_pagos !== 1) manualesCount += 1
        })
        return { total: rawDescalces.length, totalDiferenciaPagos, manualesCount }
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
                mutate()
            } else {
                toast.error('La auditoría finalizó con advertencias o estructura inválida.', { id: loadingToast })
            }
        } catch (err) {
            console.error('Error al ejecutar la auditoría:', err)
            toast.error(`Error al ejecutar auditoría: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setAuditing(false)
        }
    }

    if (error) return (
        <div className="p-6 text-slate-100 min-h-screen">
            <div className="bg-red-950/20 border border-red-800/60 rounded-2xl p-8 max-w-2xl mx-auto mt-12 text-center shadow-2xl backdrop-blur-md">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-xl font-bold text-red-400 mb-2">Error al conectar con la auditoría</h2>
                <p className="text-slate-400 text-sm mb-6">No se pudo obtener la vista de conciliación de pagos. Asegurate de que el servidor o la base de datos Supabase estén activos.</p>
                <button type="button" onClick={() => mutate()} className="px-5 py-2.5 bg-red-900/60 hover:bg-red-800/80 border border-red-700/60 text-red-100 rounded-xl transition-all duration-200 font-medium">
                    Reintentar Conexión
                </button>
            </div>
        </div>
    )

    return (
        <div className="p-6 text-slate-100 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/35 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.08)] shrink-0">
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h1 className="text-lg sm:text-2xl font-bold text-slate-100">Conciliación de Pagos</h1>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                        Detección dinámica de desajustes entre el total de las facturas (Cabecera), la suma de los productos (Detalles) y las transacciones de Caja (Pagos).
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button type="button"
                        onClick={handleRunAudit}
                        disabled={auditing || loading}
                        className="w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 disabled:cursor-not-allowed text-white font-medium border border-violet-500/30 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.2)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.3)] hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
                    >
                        <RefreshCcw className={`w-4 h-4 ${auditing ? 'animate-spin' : ''} shrink-0`} />
                        <span>{auditing ? 'Auditando...' : <><span className="hidden sm:inline">Ejecutar Conciliación y Auto-Curación</span><span className="sm:hidden">Ejecutar Auditoría</span></>}</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Transacciones Desajustadas', value: loading ? '...' : stats.total, icon: AlertTriangle, color: 'text-amber-400' },
                    { label: 'Diferencia Acumulada en Caja', value: loading ? '...' : `$${stats.totalDiferenciaPagos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, icon: Coins, color: 'text-rose-400' },
                    { label: 'Revisión Manual Requerida', value: loading ? '...' : stats.manualesCount, icon: ShieldCheck, color: 'text-emerald-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="p-4 sm:p-5 bg-slate-900/40 rounded-2xl border border-slate-800/60 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-200 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                            <Icon className="w-24 h-24" />
                        </div>
                        <span className="text-xs text-slate-450 uppercase font-semibold tracking-wider block">{label}</span>
                        <span className={`text-2xl sm:text-3xl font-mono font-bold ${color} mt-2 block`}>{value}</span>
                    </div>
                ))}
            </div>

            {/* Pestañas */}
            <div className="flex flex-col sm:flex-row border-b border-slate-800 gap-1 sm:gap-0">
                <button type="button"
                    onClick={() => setActiveTab('todas')}
                    className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 text-center sm:text-left transition-all ${activeTab === 'todas' ? 'border-violet-500 text-violet-400 bg-violet-500/[0.02]' : 'border-transparent text-slate-450 hover:text-slate-200'}`}
                >
                    Todas las Inconsistencias
                    {!loading && stats.total > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">{stats.total}</span>}
                </button>
                <button type="button"
                    onClick={() => setActiveTab('revisar')}
                    className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 text-center sm:text-left transition-all ${activeTab === 'revisar' ? 'border-rose-500 text-rose-450 bg-rose-500/[0.02]' : 'border-transparent text-slate-450 hover:text-slate-200'}`}
                >
                    Revisión Manual Obligatoria (No Curables)
                    {!loading && stats.manualesCount > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">{stats.manualesCount}</span>}
                </button>
            </div>

            {/* Filtros */}
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
                            <button type="button" key={t} onClick={() => setTipoFilter(t)} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${tipoFilter === t ? 'bg-slate-800 text-slate-100 shadow-inner' : 'text-slate-450 hover:text-slate-200'}`}>{t}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Listado */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 rounded-2xl border border-slate-800/40">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-3" />
                        <span className="text-sm text-slate-400">Analizando registros financieros...</span>
                    </div>
                ) : descalces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-900/10 rounded-2xl border border-slate-800/40 text-center px-4">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 mb-4">
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
                                        className={`bg-slate-900/20 border rounded-2xl transition-all duration-200 overflow-hidden hover:border-slate-700/60 ${isExpanded ? 'border-slate-750 bg-slate-900/30' : 'border-slate-800/50'}`}
                                    >
                                        {/* Card Header */}
                                        <div onClick={() => toggleExpand(d.operacion_id)} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none">
                                            <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                                                <div className={`mt-0.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isVenta ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>{d.tipo_operacion}</div>
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

                                            <div className="grid grid-cols-3 gap-6 lg:gap-8 pr-2">
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Cabecera</span>
                                                    <span className="text-sm font-mono font-bold text-slate-200 block mt-0.5">${Number(d.monto_cabecera).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Detalles</span>
                                                    <span className={`text-sm font-mono font-bold block mt-0.5 ${hasDetalleMismatch ? 'text-amber-400 font-semibold' : 'text-slate-350'}`}>${Number(d.monto_detalles).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Caja (Pagos)</span>
                                                    <span className={`text-sm font-mono font-bold block mt-0.5 ${hasPagoMismatch ? 'text-rose-400 font-semibold' : 'text-slate-350'}`}>${Number(d.monto_pagos).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between lg:justify-end gap-3.5 border-t border-slate-800/40 lg:border-t-0 pt-3 lg:pt-0">
                                                <div className="flex flex-wrap gap-2">
                                                    {hasPagoMismatch && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><TrendingDown className="w-3 h-3 mr-1" />Caja: ${Math.abs(d.diferencia_cabecera_pagos).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>}
                                                    {hasDetalleMismatch && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Detalle: ${Math.abs(d.diferencia_cabecera_detalles).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>}
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
                                                    initial={{ scaleY: 0, opacity: 0 }}
                                                    animate={{ scaleY: 1, opacity: 1 }}
                                                    exit={{ scaleY: 0, opacity: 0 }}
                                                    style={{ originY: 0 }}
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

            {/* Leyenda */}
            <div className="p-5 bg-slate-900/15 border border-slate-800/40 rounded-2xl text-xs space-y-3 leading-relaxed text-slate-400">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                    <Info className="w-4 h-4 text-violet-400" />
                    <span>Guía y Protocolo de Conciliación</span>
                </div>
                <p>Los desajustes de pagos ocurren habitualmente cuando una operación de compra o venta se asume cancelada por completo en el momento del registro en el punto de venta (Cabecera), pero el movimiento de dinero asociado en la Caja Chica no se generó o se guardó con una cantidad discrepante.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <span className="font-semibold text-slate-300 block">¿Cómo funciona la auto-curación?</span>
                        <span>La función de base de datos evalúa cada desajuste. Si la transacción cuenta con exactamente un pago (o sea, no está dividida), el sistema entiende que fue un error de tipeo y sobrescribe el pago de caja para alinearlo con el total facturado.</span>
                    </div>
                    <div className="space-y-1">
                        <span className="font-semibold text-slate-300 block">¿Cómo auditar transacciones manuales?</span>
                        <span>Haciendo clic sobre cualquier registro desajustado, podés desglosar los productos registrados en sus detalles y comparar con los movimientos de caja reales. Las operaciones con múltiples pagos o sin pagos deben ser resueltas a través de los editores correspondientes de Ventas o Compras.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DescalcesView
