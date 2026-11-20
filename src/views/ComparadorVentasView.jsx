import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { Scale, AlertCircle } from 'lucide-react'
import {
    computePeriodPreset,
    compararVentasPeriodosCategorias,
    compararPreciosYCausasCategoria,
    getTicketsDrilldownComparador
} from '../services/comparadorApi'
import ComparadorHeaderControls from './comparador/ComparadorHeaderControls'
import CalidadDatosBanner from './comparador/CalidadDatosBanner'
import ComparadorKpisGrid from './comparador/ComparadorKpisGrid'
import CategoriaRankingTable from './comparador/CategoriaRankingTable'
import TicketsDrilldownDrawer from './comparador/TicketsDrilldownDrawer'

const WaterfallDualLensSection = React.lazy(() => import('./comparador/WaterfallDualLensSection'))
const CategoriaPreciosDrilldown = React.lazy(() => import('./comparador/CategoriaPreciosDrilldown'))

const ComparadorVentasView = () => {
    const [initialRange] = useState(() => computePeriodPreset('ultimos_7_vs_7'))

    const [presetId, setPresetId] = useState(initialRange.presetId)
    const [inicioA, setInicioA] = useState(initialRange.inicioA)
    const [finA, setFinA] = useState(initialRange.finA)
    const [inicioB, setInicioB] = useState(initialRange.inicioB)
    const [finB, setFinB] = useState(initialRange.finB)
    const [normalizeByActiveDay, setNormalizeByActiveDay] = useState(false)

    // Filtros Matriz 4 Cuadrantes
    const [categoria, setCategoria] = useState(null)
    const [appliedSearch, setAppliedSearch] = useState('')

    // Datos principales (RPC 1)
    const [comparadorData, setComparadorData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const requestIdRef = useRef(0)

    // Drill-down de Categoría (RPC 2)
    const [selectedDrillCategoria, setSelectedDrillCategoria] = useState(null)
    const [drilldownData, setDrilldownData] = useState(null)
    const [loadingDrilldown, setLoadingDrilldown] = useState(false)

    // Drawer de Tickets Reales (RPC 3)
    const [drawerState, setDrawerState] = useState({
        isOpen: false,
        period: 'B',
        categoria: null,
        producto: null
    })
    const [ticketsData, setTicketsData] = useState(null)
    const [loadingTickets, setLoadingTickets] = useState(false)

    const loadComparador = useCallback(async () => {
        if (!inicioA || !finA || !inicioB || !finB) return
        const reqId = ++requestIdRef.current
        setLoading(true)
        setError(null)
        try {
            const res = await compararVentasPeriodosCategorias({
                inicioA,
                finA,
                inicioB,
                finB,
                categoria,
                search: appliedSearch
            })
            if (reqId !== requestIdRef.current) return
            setComparadorData(res)
        } catch (err) {
            if (reqId !== requestIdRef.current) return
            setError(err?.message || 'Error al cargar el comparador de ventas')
        } finally {
            if (reqId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }, [inicioA, finA, inicioB, finB, categoria, appliedSearch])

    useEffect(() => {
        let active = true
        Promise.resolve().then(() => {
            if (active) loadComparador()
        })
        return () => {
            active = false
            requestIdRef.current += 1
        }
    }, [loadComparador])

    // Cargar drill-down de productos cuando se selecciona una categoría
    useEffect(() => {
        if (!selectedDrillCategoria) return
        let cancelled = false
        const fetchDrill = async () => {
            setLoadingDrilldown(true)
            try {
                const res = await compararPreciosYCausasCategoria({
                    inicioA,
                    finA,
                    inicioB,
                    finB,
                    categoria: selectedDrillCategoria,
                    search: appliedSearch
                })
                if (!cancelled) setDrilldownData(res)
            } catch (err) {
                console.error('Error cargando drill-down categoría:', err)
            } finally {
                if (!cancelled) setLoadingDrilldown(false)
            }
        }
        fetchDrill()
        return () => {
            cancelled = true
        }
    }, [selectedDrillCategoria, inicioA, finA, inicioB, finB, appliedSearch])

    // Cargar tickets reales cuando se abre el drawer
    useEffect(() => {
        if (!drawerState.isOpen) return
        let cancelled = false
        const fetchTickets = async () => {
            setLoadingTickets(true)
            try {
                const isA = drawerState.period === 'A'
                const res = await getTicketsDrilldownComparador({
                    inicio: isA ? inicioA : inicioB,
                    fin: isA ? finA : finB,
                    categoria: drawerState.categoria,
                    producto: drawerState.producto,
                    limit: 60
                })
                if (!cancelled) setTicketsData(res)
            } catch (err) {
                console.error('Error cargando tickets drill-down:', err)
            } finally {
                if (!cancelled) setLoadingTickets(false)
            }
        }
        fetchTickets()
        return () => {
            cancelled = true
        }
    }, [drawerState, inicioA, finA, inicioB, finB])

    const handleSelectPreset = useCallback((newPresetId) => {
        setPresetId(newPresetId)
        if (newPresetId !== 'personalizado') {
            const computed = computePeriodPreset(newPresetId)
            setInicioA(computed.inicioA)
            setFinA(computed.finA)
            setInicioB(computed.inicioB)
            setFinB(computed.finB)
        }
    }, [])

    const handleChangeDate = useCallback((field, value) => {
        setPresetId('personalizado')
        if (field === 'inicioA') setInicioA(value)
        if (field === 'finA') setFinA(value)
        if (field === 'inicioB') setInicioB(value)
        if (field === 'finB') setFinB(value)
    }, [])

    const handleToggleNormalize = useCallback(() => {
        setNormalizeByActiveDay((v) => !v)
    }, [])

    const handleChangeCategoria = useCallback((val) => {
        setCategoria(val)
        if (val) setSelectedDrillCategoria(val)
    }, [])

    const handleApplySearch = useCallback((overrideVal) => {
        setAppliedSearch(typeof overrideVal === 'string' ? overrideVal : '')
    }, [])

    const handleClearFilters = useCallback(() => {
        setCategoria(null)
        setAppliedSearch('')
        setSelectedDrillCategoria(null)
    }, [])

    const handleToggleDrillCategoria = useCallback((catName) => {
        setSelectedDrillCategoria((prev) => (prev === catName ? null : catName))
    }, [])

    const handleCloseDrillCategoria = useCallback(() => {
        setSelectedDrillCategoria(null)
    }, [])

    const handleOpenTickets = useCallback((period = 'B', targetCat = null, targetProd = null) => {
        setDrawerState({
            isOpen: true,
            period,
            categoria: targetCat ?? categoria,
            producto: targetProd
        })
    }, [categoria])

    const handleOpenTicketsProducto = useCallback((cat, prod) => {
        setDrawerState({
            isOpen: true,
            period: 'B',
            categoria: cat,
            producto: prod
        })
    }, [])

    const handleOpenTicketsCategoria = useCallback((catName) => {
        setDrawerState({
            isOpen: true,
            period: 'B',
            categoria: catName,
            producto: null
        })
    }, [])

    const handleCloseDrawer = useCallback(() => {
        setDrawerState((prev) => ({ ...prev, isOpen: false }))
    }, [])

    const handleSwitchDrawerPeriod = useCallback((newPeriod) => {
        setDrawerState((prev) => ({ ...prev, period: newPeriod }))
    }, [])

    return (
        <div className="space-y-6 pb-10">
            {/* Título Principal */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Scale className="h-8 w-8 md:h-10 md:w-10 text-blue-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-blue-400">
                            Comparador de Ventas, Precios y Causas
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">
                        Descomposición Laspeyres (Precio vs Gente vs Canasta vs Mix), elasticidad por producto y auditoría de tickets.
                    </p>
                </div>
            </div>

            {/* Controles Superiores y Matriz de 4 Cuadrantes */}
            <ComparadorHeaderControls
                presetId={presetId}
                onSelectPreset={handleSelectPreset}
                inicioA={inicioA}
                finA={finA}
                inicioB={inicioB}
                finB={finB}
                onChangeDate={handleChangeDate}
                normalizeByActiveDay={normalizeByActiveDay}
                onToggleNormalize={handleToggleNormalize}
                categoria={categoria}
                onChangeCategoria={handleChangeCategoria}
                searchInput={appliedSearch}
                onApplySearch={handleApplySearch}
                onClearFilters={handleClearFilters}
                onRefresh={loadComparador}
                loading={loading}
                meta={comparadorData?.meta}
            />

            {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Banner de Insights & Calidad del Dato */}
            <CalidadDatosBanner
                calidadDatos={comparadorData?.calidad_datos}
                descomposicionGlobal={comparadorData?.descomposicion_global}
                meta={comparadorData?.meta}
                onOpenTicketsPeriod={handleOpenTickets}
            />

            {/* KPIs Globales A vs B */}
            <ComparadorKpisGrid
                kpis={comparadorData?.kpis_globales}
                meta={comparadorData?.meta}
                normalizeByActiveDay={normalizeByActiveDay}
            />

            {/* Waterfall Dual-Lens + Tráfico vs Canasta + Franjas y Días */}
            <Suspense fallback={<div className="h-72 rounded-2xl bg-slate-900/50 border border-slate-800/80 animate-pulse" />}>
                <WaterfallDualLensSection
                    descomposicionGlobal={comparadorData?.descomposicion_global}
                    franjasHorarias={comparadorData?.franjas_horarias}
                    diasSemana={comparadorData?.dias_semana}
                />
            </Suspense>

            {/* Drill-down de Precios, Costos y Elasticidad cuando hay una categoría activa */}
            {selectedDrillCategoria && (
                <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-900/50 border border-blue-500/30 animate-pulse" />}>
                    <CategoriaPreciosDrilldown
                        categoria={selectedDrillCategoria}
                        drilldownData={drilldownData}
                        loading={loadingDrilldown}
                        onClose={handleCloseDrillCategoria}
                        onOpenTicketsProducto={handleOpenTicketsProducto}
                    />
                </Suspense>
            )}

            {/* Ranking Multi-Categoría */}
            <CategoriaRankingTable
                categorias={comparadorData?.categorias}
                selectedCategoria={selectedDrillCategoria}
                onSelectCategoria={handleToggleDrillCategoria}
                onOpenTicketsCategoria={handleOpenTicketsCategoria}
            />

            {/* Drawer de Tickets Reales */}
            <TicketsDrilldownDrawer
                isOpen={drawerState.isOpen}
                onClose={handleCloseDrawer}
                activePeriod={drawerState.period}
                onSwitchPeriod={handleSwitchDrawerPeriod}
                inicioA={inicioA}
                finA={finA}
                inicioB={inicioB}
                finB={finB}
                categoria={drawerState.categoria}
                producto={drawerState.producto}
                ticketsData={ticketsData}
                loading={loadingTickets}
            />
        </div>
    )
}

export default ComparadorVentasView
