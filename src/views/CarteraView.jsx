import React, { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import * as api from '../services/api'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { 
    Wallet, 
    CreditCard, 
    ArrowUpRight, 
    ArrowDownLeft, 
    AlertCircle, 
    Trash2, 
    RefreshCw, 
    Pencil, 
    Check, 
    X, 
    Calendar, 
    Search, 
    ArrowRight, 
    ShieldCheck,
    Coins,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { CarteraRulesPanel } from './cartera/CarteraRulesPanel'
import { CarteraDetailsGrid } from './cartera/CarteraDetailsGrid'

const currencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

// Helper to format currency
const formatCurrency = (val) => {
    const num = parseFloat(val) || 0
    return currencyFormatter.format(num)
}

const CarteraView = () => {
    const { mutate } = useSWRConfig()

    // ── Local State ──
    const [editingMovId, setEditingMovId] = useState(null)
    const [editMethodVal, setEditMethodVal] = useState('')
    const [customMethodVal, setCustomMethodVal] = useState('')
    const [showCustomInput, setShowCustomInput] = useState(false)

    // Form states for new replacement rule
    const [origMethodRule, setOrigMethodRule] = useState('')
    const [destMethodRule, setDestMethodRule] = useState('')
    const [customOrigRule, setCustomOrigRule] = useState('')
    const [customDestRule, setCustomDestRule] = useState('')
    const [showCustomOrig, setShowCustomOrig] = useState(false)
    const [showCustomDest, setShowCustomDest] = useState(false)

    // Movements Table States (Pagination, sorting, search)
    const [page, setPage] = useState(1)
    const pageSize = 15
    const [searchVal, setSearchVal] = useState('')
    const sortColumn = 'fecha'
    const sortOrder = 'desc'

    // Cron manual execution states
    const [isExecutingCron, setIsExecutingCron] = useState(false)
    const [cronResult, setCronResult] = useState(null)

    // ── SWR Data Fetching ──
    const { data: cartera, isLoading: loadingCartera } = useSWR(
        'cartera_actual', 
        api.getCarteraActual
    )

    const { data: reglas, isLoading: loadingReglas } = useSWR(
        'reemplazos_metodos_pago', 
        api.getReemplazosMetodosPago
    )

    const { data: movementsData, isLoading: loadingMovements } = useSWR(
        ['movimientos_dinero_paginados', page, sortColumn, sortOrder, searchVal],
        () => api.fetchTableData('movimientos_dinero', {
            page,
            pageSize,
            sortColumn,
            sortOrder,
            filterColumn: 'metodo',
            filterValue: searchVal
        })
    )

    const movements = movementsData?.data || []
    const movementsCount = movementsData?.count || 0
    const totalPages = Math.ceil(movementsCount / pageSize)

    // Derived lists
    const uniqueMethods = cartera ? cartera.map(c => c.metodo) : []

    // ── Handlers ──
    const handleEditStart = (mov) => {
        setEditingMovId(mov.movimiento_id)
        setEditMethodVal(mov.metodo)
        setCustomMethodVal('')
        setShowCustomInput(false)
    }

    const handleSaveMethod = async (movId) => {
        const finalMethod = showCustomInput ? customMethodVal.trim() : editMethodVal
        if (!finalMethod) {
            toast.error('El método de pago no puede estar vacío')
            return
        }

        try {
            await api.actualizarMovimientoDinero(movId, { metodo: finalMethod })
            toast.success('Método de pago actualizado')
            setEditingMovId(null)
            mutate('cartera_actual')
            mutate(['movimientos_dinero_paginados', page, sortColumn, sortOrder, searchVal])
        } catch (error) {
            toast.error('Error al guardar cambio: ' + error.message)
        }
    }

    const handleCreateRule = async (e) => {
        e.preventDefault()
        const origen = showCustomOrig ? customOrigRule.trim() : origMethodRule
        const destino = showCustomDest ? customDestRule.trim() : destMethodRule

        if (!origen || !destino) {
            toast.error('Ambos campos son obligatorios')
            return
        }

        if (origen.toLowerCase() === destino.toLowerCase()) {
            toast.error('El método de origen y destino deben ser diferentes')
            return
        }

        try {
            const loadToast = toast.loading('Creando regla y actualizando registros masivamente...')
            await api.crearReemplazoMetodoPago(origen, destino)
            toast.dismiss(loadToast)
            toast.success(`Regla creada: '${origen}' ahora se reemplazará por '${destino}'`)
            
            // Clear inputs
            setOrigMethodRule('')
            setDestMethodRule('')
            setCustomOrigRule('')
            setCustomDestRule('')
            setShowCustomOrig(false)
            setShowCustomDest(false)

            // Mutate lists
            mutate('reemplazos_metodos_pago')
            mutate('cartera_actual')
            mutate(['movimientos_dinero_paginados', page, sortColumn, sortOrder, searchVal])
        } catch (error) {
            toast.error('Error al crear regla: ' + error.message)
        }
    }

    const handleDeleteRule = async (origen) => {
        if (!confirm(`¿Estás seguro de eliminar la regla para '${origen}'?\nEsto no deshará los cambios en registros existentes.`)) return

        try {
            await api.eliminarReemplazoMetodoPago(origen)
            toast.success('Regla de reemplazo eliminada')
            mutate('reemplazos_metodos_pago')
        } catch (error) {
            toast.error('Error al eliminar regla: ' + error.message)
        }
    }

    const handleRunCron = async () => {
        setIsExecutingCron(true)
        setCronResult(null)
        try {
            const result = await api.ejecutarCronReemplazosManual()
            setCronResult(result)
            if (result.movimientos_actualizados > 0) {
                toast.success(`Auditoría completa: se corrigieron ${result.movimientos_actualizados} registros obsoletos!`)
                mutate('cartera_actual')
                mutate(['movimientos_dinero_paginados', page, sortColumn, sortOrder, searchVal])
            } else {
                toast.success('Auditoría completa: no se encontraron transacciones obsoletas.')
            }
        } catch (error) {
            toast.error('Error en auditoría: ' + error.message)
        } finally {
            setIsExecutingCron(false)
        }
    }

    // Consolidated calculations for summary cards
    const totalEfectivo = cartera?.find(c => c.metodo.toLowerCase() === 'efectivo' || c.metodo.toLowerCase() === 'caja')?.balance_neto || 
                          cartera?.find(c => c.metodo === 'Efectivo')?.balance_neto || 0

    const totalCartera = cartera?.reduce((sum, item) => sum + (parseFloat(item.balance_neto) || 0), 0) || 0
    const totalDigital = totalCartera - totalEfectivo

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">Cartera & Métodos de Pago</h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">
                        Monitorea fondos, edita transacciones y automatiza reemplazos masivos de métodos de pago.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" 
                        onClick={() => {
                            mutate('cartera_actual')
                            mutate('reemplazos_metodos_pago')
                            mutate(['movimientos_dinero_paginados', page, sortColumn, sortOrder, searchVal])
                            toast.success('Datos actualizados')
                        }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95 flex items-center gap-2 font-bold text-xs"
                    >
                        <RefreshCw size={14} />
                        Sincronizar
                    </button>
                </div>
            </div>

            {/* Balances Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cash Balance */}
                <m.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/10 flex items-center justify-between"
                >
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Efectivo en Caja</span>
                        <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                            {formatCurrency(totalEfectivo)}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                        <Coins className="size-6" />
                    </div>
                </m.div>

                {/* Digital / Bank Balance */}
                <m.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/10 flex items-center justify-between"
                >
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Digital Consolidado</span>
                        <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                            {formatCurrency(totalDigital)}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                        <CreditCard className="size-6" />
                    </div>
                </m.div>

                {/* Grand Total Portfolio */}
                <m.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/10 flex items-center justify-between"
                >
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Total en Cartera</span>
                        <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                            {formatCurrency(totalCartera)}
                        </h3>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                        <Wallet className="size-6" />
                    </div>
                </m.div>
            </div>

            {/* Detailed Wallet Grid */}
            <CarteraDetailsGrid loadingCartera={loadingCartera} cartera={cartera} formatCurrency={formatCurrency} />

            {/* Split Operations: Rules & Single Edit */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left panel: Replacement Rules (5 cols) */}
                <div className="lg:col-span-5">
                    <CarteraRulesPanel
                        handleCreateRule={handleCreateRule}
                        origMethodRule={origMethodRule}
                        setOrigMethodRule={setOrigMethodRule}
                        showCustomOrig={showCustomOrig}
                        setShowCustomOrig={setShowCustomOrig}
                        customOrigRule={customOrigRule}
                        setCustomOrigRule={setCustomOrigRule}
                        destMethodRule={destMethodRule}
                        setDestMethodRule={setDestMethodRule}
                        showCustomDest={showCustomDest}
                        setShowCustomDest={setShowCustomDest}
                        customDestRule={customDestRule}
                        setCustomDestRule={setCustomDestRule}
                        uniqueMethods={uniqueMethods}
                        loadingReglas={loadingReglas}
                        reglas={reglas}
                        handleDeleteRule={handleDeleteRule}
                    />
                </div>

                {/* Right panel: Movements & Edit (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Historial de Movimientos</h3>
                                <p className="text-xs text-slate-500 mt-1">Busca y modifica individualmente los métodos de pago asignados.</p>
                            </div>
                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-3.5 w-3.5 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar método..."
                                    className="bg-slate-800 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs text-white w-full sm:w-48 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    value={searchVal}
                                    onChange={(e) => { setSearchVal(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>

                        {loadingMovements ? (
                            <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" /></div>
                        ) : movements.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 italic bg-white/3 rounded-xl border border-white/5 text-xs">
                                No se encontraron transacciones con ese método de pago.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/3">
                                    <table className="w-full text-xs text-left" style={{ minWidth: '600px' }}>
                                        <thead className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5">
                                            <tr>
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3 text-center">Tipo</th>
                                                <th className="px-4 py-3">Operación</th>
                                                <th className="px-4 py-3">Método</th>
                                                <th className="px-4 py-3 text-right">Monto</th>
                                                <th className="px-4 py-3 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-slate-300">
                                            {movements.map((mov) => {
                                                const isEditing = editingMovId === mov.movimiento_id
                                                return (
                                                    <tr key={mov.movimiento_id} className="hover:bg-white/5 transition-all">
                                                        <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                                                            {new Date(mov.fecha).toLocaleDateString('es-AR')}
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                                                                mov.tipo === 'ENTRADA' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                                {mov.tipo}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="font-bold text-slate-200 uppercase tracking-tighter text-[10px] bg-white/5 px-2 py-0.5 rounded mr-1">
                                                                {mov.referencia_tipo}
                                                            </span>
                                                            <span className="font-semibold text-slate-400 text-[10px]">{mov.referencia_id}</span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {isEditing ? (
                                                                !showCustomInput ? (
                                                                    <div className="flex gap-1.5 items-center">
                                                                        <select
                                                                            value={editMethodVal}
                                                                            aria-label="Editar método de pago"
                                                                            onChange={e => {
                                                                                if (e.target.value === '__custom__') {
                                                                                    setShowCustomInput(true);
                                                                                    setEditMethodVal('');
                                                                                } else {
                                                                                    setEditMethodVal(e.target.value);
                                                                                }
                                                                            }}
                                                                            className="bg-slate-800 border-none rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                                        >
                                                                            {/* List all active unique methods so user has the other options */}
                                                                            {uniqueMethods.map(m => (
                                                                                <option key={m} value={m}>{m}</option>
                                                                            ))}
                                                                            <option value="__custom__">Escribir otro...</option>
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1.5 items-center">
                                                                        <input
                                                                            type="text"
                                                                            aria-label="Otro método de pago"
                                                                            className="bg-slate-800 border-none rounded px-2 py-1 text-xs text-white w-28 focus:ring-1 focus:ring-blue-500 outline-none"
                                                                            placeholder="Otro método..."
                                                                            value={customMethodVal}
                                                                            onChange={e => setCustomMethodVal(e.target.value)}
                                                                        />
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => { setShowCustomInput(false); setCustomMethodVal(''); setEditMethodVal(mov.metodo); }}
                                                                            aria-label="Cancelar edición de método"
                                                                            className="p-1 hover:bg-slate-700 rounded text-slate-400"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <span className="font-bold text-slate-200">{mov.metodo}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-white whitespace-nowrap tabular-nums">
                                                            {formatCurrency(mov.monto)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            {isEditing ? (
                                                                <div className="flex justify-center gap-1.5">
                                                                    <button type="button"
                                                                        onClick={() => handleSaveMethod(mov.movimiento_id)}
                                                                        className="p-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded transition-all"
                                                                        title="Guardar"
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                    <button type="button"
                                                                        onClick={() => setEditingMovId(null)}
                                                                        className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all"
                                                                        title="Cancelar"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button type="button"
                                                                    onClick={() => handleEditStart(mov)}
                                                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-blue-400 rounded transition-all"
                                                                    title="Editar método de pago"
                                                                >
                                                                    <Pencil size={12} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            Página {page} de {totalPages}
                                        </span>
                                        <div className="flex gap-1">
                                            <button type="button"
                                                disabled={page === 1}
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-all text-xs font-bold"
                                            >
                                                Anterior
                                            </button>
                                            <button type="button"
                                                disabled={page === totalPages}
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-all text-xs font-bold"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cron & Auditor Management (Full Width) */}
            <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Cron de Auditoría</h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                                <ShieldCheck size={10} />
                                Programado pg_cron
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            La tarea automática `auditoria_reemplazos_metodos_pago_diaria` se ejecuta a las 3:15 AM y corrige desvíos residuales.
                        </p>
                    </div>
                    <button type="button"
                        onClick={handleRunCron}
                        disabled={isExecutingCron}
                        className="px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/10 text-blue-400 disabled:opacity-50 hover:text-blue-300 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isExecutingCron ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                        Forzar Auditoría Manual
                    </button>
                </div>

                {/* Audit details / logs output */}
                <AnimatePresence>
                    {cronResult && (
                        <m.div
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            style={{ originY: 0 }}
                            className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-3"
                        >
                            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                                <span className="flex items-center gap-1.5 text-slate-300">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    Auditoría finalizada con éxito.
                                </span>
                                <span>Ejecutado: {new Date(cronResult.ejecutado_en).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white">{cronResult.movimientos_actualizados}</span>
                                <span className="text-xs text-slate-400 font-medium">registros obsoletos corregidos y alineados.</span>
                            </div>

                            {cronResult.detalles?.length > 0 && (
                                <div className="pt-2 border-t border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bitácora de cambios</span>
                                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar text-[11px]">
                                        {cronResult.detalles.map((det, di) => (
                                            <div key={di} className="flex justify-between items-center py-1 bg-white/3 px-3 rounded-lg border border-white/5">
                                                <div>
                                                    <span className="font-bold text-slate-300 uppercase text-[9px] bg-slate-800 px-1 rounded mr-1">
                                                        {det.referencia_tipo}
                                                    </span>
                                                    <span className="text-slate-500 font-semibold mr-2">{det.referencia_id}</span>
                                                    <span className="text-slate-400">ID Movimiento: {det.movimiento_id}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-red-400 font-bold">{det.metodo_anterior}</span>
                                                    <ArrowRight size={10} className="text-slate-500" />
                                                    <span className="text-green-400 font-bold">{det.metodo_nuevo}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </m.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default CarteraView;
