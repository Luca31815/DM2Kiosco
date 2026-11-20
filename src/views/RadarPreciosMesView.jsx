import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { CandlestickChart, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getRadarPreciosUltimoMes, simularNuevoPrecioVenta } from '../services/comparadorApi'
import RadarHeaderControls from './radar-precios/RadarHeaderControls'
import RadarKpisAndSimulatorBar from './radar-precios/RadarKpisAndSimulatorBar'
import RadarPocketMarginTable from './radar-precios/RadarPocketMarginTable'
import ListaRemarcacionPanel from './radar-precios/ListaRemarcacionPanel'

const RadarPreciosMesView = () => {
    const { session, openLoginModal } = useAuth()
    const isAuthenticated = Boolean(session)

    // Controles del Radar (Pilar 2)
    const [dias, setDias] = useState(30)
    const [modo, setModo] = useState('ambos')
    const [categoria, setCategoria] = useState(null)
    const [appliedSearch, setAppliedSearch] = useState('')
    const [semaforoFilter, setSemaforoFilter] = useState('todos')
    const [incluirLogistica, setIncluirLogistica] = useState(true)

    // Ordenamiento de la tabla Pocket-Margin
    const [sortField, setSortField] = useState('impacto_mensual')
    const [sortDir, setSortDir] = useState('desc')

    // Simulador de Nuevo PV y Lista de Remarcación
    const [markupObjetivoPct, setMarkupObjetivoPct] = useState(50)
    const [redondeoMultiplo, setRedondeoMultiplo] = useState(50)
    const [customPvMap, setCustomPvMap] = useState({})
    const [selectedMap, setSelectedMap] = useState({})

    // Datos desde fn_radar_precios_ultimo_mes
    const [radarData, setRadarData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const requestIdRef = useRef(0)

    const loadRadar = useCallback(async () => {
        const reqId = ++requestIdRef.current
        setLoading(true)
        setError(null)
        try {
            const res = await getRadarPreciosUltimoMes({
                dias,
                modo,
                categoria,
                search: appliedSearch,
                incluirLogistica: isAuthenticated ? incluirLogistica : false
            })
            if (reqId !== requestIdRef.current) return
            setRadarData(res)
        } catch (err) {
            if (reqId !== requestIdRef.current) return
            setError(err?.message || 'Error al cargar el Radar de Costo vs Precio de Venta')
        } finally {
            if (reqId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }, [dias, modo, categoria, appliedSearch, incluirLogistica, isAuthenticated])

    useEffect(() => {
        let active = true
        Promise.resolve().then(() => {
            if (active) loadRadar()
        })
        return () => {
            active = false
            requestIdRef.current += 1
        }
    }, [loadRadar])

    const handleSort = useCallback((field) => {
        if (sortField === field) {
            setSortDir((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortField(field)
            setSortDir('desc')
        }
    }, [sortField])

    const filteredAndSortedItems = useMemo(() => {
        let list = radarData?.items ? [...radarData.items] : []
        if (semaforoFilter !== 'todos') {
            list = list.filter((it) => it.semaforo === semaforoFilter)
        }
        list.sort((a, b) => {
            const va = Number(a[sortField]) || 0
            const vb = Number(b[sortField]) || 0
            return sortDir === 'asc' ? va - vb : vb - va
        })
        return list
    }, [radarData, semaforoFilter, sortField, sortDir])

    const remarcacionItems = useMemo(() => {
        const allItems = radarData?.items || []
        const result = []
        for (const it of allItems) {
            if (selectedMap[it.producto]) {
                result.push({
                    ...it,
                    sim: simularNuevoPrecioVenta({
                        costoRealUnitario: it.costo_real_unitario,
                        pvActual: it.pv_actual,
                        unidadesVendidas: it.unidades_vendidas,
                        pvManual: customPvMap[it.producto],
                        markupObjetivoPct,
                        redondeoMultiplo
                    })
                })
            }
        }
        return result
    }, [radarData, selectedMap, customPvMap, markupObjetivoPct, redondeoMultiplo])

    const gananciaAdicionalTotal = useMemo(() => {
        return remarcacionItems.reduce(
            (acc, it) => acc + (Number(it.sim?.gananciaMensualAdicional) || 0),
            0
        )
    }, [remarcacionItems])

    const handleToggleSelectProduct = useCallback((prodName) => {
        setSelectedMap((prev) => ({
            ...prev,
            [prodName]: !prev[prodName]
        }))
    }, [])

    const handleChangeCustomPv = useCallback((prodName, newPv) => {
        setCustomPvMap((prev) => ({
            ...prev,
            [prodName]: newPv
        }))
        setSelectedMap((prev) => (prev[prodName] ? prev : {
            ...prev,
            [prodName]: true
        }))
    }, [])

    const handleSelectBySemaforo = useCallback((allowedSemaforos) => {
        const allowedSet = new Set(allowedSemaforos)
        const next = {}
        for (const it of radarData?.items || []) {
            if (allowedSet.has(it.semaforo)) {
                next[it.producto] = true
            }
        }
        setSelectedMap(next)
    }, [radarData])

    const handleSelectUrgentes = useCallback(() => {
        handleSelectBySemaforo(['urgente'])
    }, [handleSelectBySemaforo])

    const handleSelectUrgentesYRevisar = useCallback(() => {
        handleSelectBySemaforo(['urgente', 'revisar'])
    }, [handleSelectBySemaforo])

    const handleClearSimulation = useCallback(() => {
        setCustomPvMap({})
        setSelectedMap({})
    }, [])

    const handleClearFilters = useCallback(() => {
        setCategoria(null)
        setAppliedSearch('')
        setSemaforoFilter('todos')
    }, [])

    const handleApplySearch = useCallback((override) => {
        setAppliedSearch(typeof override === 'string' ? override : '')
    }, [])

    const handleToggleLogistica = useCallback(() => {
        setIncluirLogistica((v) => !v)
    }, [])

    const handleRemoveRemarcacionItem = useCallback((prod) => {
        setSelectedMap((prev) => {
            const copy = { ...prev }
            delete copy[prod]
            return copy
        })
    }, [])

    const handleClearRemarcacionList = useCallback(() => {
        setSelectedMap({})
    }, [])

    return (
        <div className="space-y-6 pb-10">
            {/* Encabezado Principal */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <CandlestickChart className="h-8 w-8 md:h-10 md:w-10 text-emerald-400" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-emerald-400">
                            Radar Costo vs Precio de Venta
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">
                        Análisis pocket-margin sin ruido histórico sobre productos con rotación reciente y prorrateo logístico 1×día.
                    </p>
                </div>
            </div>

            {/* Controles Superiores */}
            <RadarHeaderControls
                dias={dias}
                onChangeDias={setDias}
                modo={modo}
                onChangeModo={setModo}
                categoria={categoria}
                onChangeCategoria={setCategoria}
                searchInput={appliedSearch}
                onApplySearch={handleApplySearch}
                onClearFilters={handleClearFilters}
                semaforoFilter={semaforoFilter}
                onChangeSemaforoFilter={setSemaforoFilter}
                incluirLogistica={incluirLogistica}
                onToggleLogistica={handleToggleLogistica}
                isAuthenticated={isAuthenticated}
                onOpenLogin={openLoginModal}
                resumen={radarData?.resumen}
                loading={loading}
                onRefresh={loadRadar}
            />

            {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* KPIs Superiores y Barra del Simulador */}
            <RadarKpisAndSimulatorBar
                resumen={radarData?.resumen}
                gananciaAdicionalTotal={gananciaAdicionalTotal}
                cantidadSimulados={remarcacionItems.length}
                markupObjetivoPct={markupObjetivoPct}
                onChangeMarkupObjetivo={setMarkupObjetivoPct}
                redondeoMultiplo={redondeoMultiplo}
                onChangeRedondeoMultiplo={setRedondeoMultiplo}
                onSelectUrgentes={handleSelectUrgentes}
                onSelectUrgentesYRevisar={handleSelectUrgentesYRevisar}
                onClearSimulation={handleClearSimulation}
            />

            {/* Lista de Remarcación Planificada (Copiar / Exportar CSV) */}
            <ListaRemarcacionPanel
                remarcacionItems={remarcacionItems}
                gananciaAdicionalTotal={gananciaAdicionalTotal}
                onRemoveItem={handleRemoveRemarcacionItem}
                onClearList={handleClearRemarcacionList}
            />

            {/* Tabla Pocket-Margin Ordenable */}
            <RadarPocketMarginTable
                items={filteredAndSortedItems}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                selectedMap={selectedMap}
                onToggleSelectProduct={handleToggleSelectProduct}
                customPvMap={customPvMap}
                onChangeCustomPv={handleChangeCustomPv}
                markupObjetivoPct={markupObjetivoPct}
                redondeoMultiplo={redondeoMultiplo}
            />
        </div>
    )
}

export default RadarPreciosMesView
