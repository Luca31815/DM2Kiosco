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
import { CarteraCronAuditPanel } from './cartera/CarteraCronAuditPanel'
import { CarteraMovementsPanel } from './cartera/CarteraMovementsPanel'
import { CarteraSummaryCards } from './cartera/CarteraSummaryCards'

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
            <CarteraSummaryCards
                totalEfectivo={totalEfectivo}
                totalDigital={totalDigital}
                totalCartera={totalCartera}
                formatCurrency={formatCurrency}
            />

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
                    <CarteraMovementsPanel
                        searchVal={searchVal}
                        setSearchVal={setSearchVal}
                        setPage={setPage}
                        loadingMovements={loadingMovements}
                        movements={movements}
                        editingMovId={editingMovId}
                        showCustomInput={showCustomInput}
                        editMethodVal={editMethodVal}
                        setEditMethodVal={setEditMethodVal}
                        setShowCustomInput={setShowCustomInput}
                        setCustomMethodVal={setCustomMethodVal}
                        uniqueMethods={uniqueMethods}
                        customMethodVal={customMethodVal}
                        handleSaveMethod={handleSaveMethod}
                        setEditingMovId={setEditingMovId}
                        handleEditStart={handleEditStart}
                        formatCurrency={formatCurrency}
                        totalPages={totalPages}
                        page={page}
                    />
                </div>
            </div>

            {/* Cron & Auditor Management (Full Width) */}
            <CarteraCronAuditPanel
                handleRunCron={handleRunCron}
                isExecutingCron={isExecutingCron}
                cronResult={cronResult}
            />
        </div>
    )
}

export default CarteraView;
