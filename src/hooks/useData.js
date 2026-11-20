import { useMemo, useState, useEffect, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { aggregateBySections } from '../utils/categoryCategorizer'

const loadMock = () => import('../services/mockData')

const EMPTY_ARRAY = []
const EMPTY_OBJ = {}
const NOOP_MUTATE = () => {}
const FULL_PAGE_OPTIONS = { pageSize: 2000 }

const isMobile = () => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
)

const isMeteredOrSlow = () => {
    if (typeof navigator === 'undefined') return false
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (!connection) return false
    return Boolean(
        connection.saveData ||
        ['slow-2g', '2g', '3g'].includes(connection.effectiveType)
    )
}

const getLiveSWROptions = () => {
    const mobile = isMobile()
    return {
        refreshInterval: isMeteredOrSlow() ? 0 : (mobile ? 300000 : 60000),
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,
        keepPreviousData: true,
        shouldRetryOnError: false,
    }
}

const getStaticSWROptions = () => ({
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    keepPreviousData: true,
    shouldRetryOnError: false,
})

// --- HELPERS DE INVALIDACIÓN SWR ---
const getKeyHead = (k) => (Array.isArray(k) ? k[0] : typeof k === 'string' ? k : null)

const VENTAS_KEYS = new Set([
    'ventas',
    'ventas_detalles',
    'reporte_diario',
    'reporte_semanal',
    'reporte_mensual',
    'reporte-ventas-periodico',
    'rentabilidad_productos',
    'analisis_horario_diario',
    'analisis_horario_semanal',
    'analisis_horario_mensual',
    'hitos_view_data',
    'descalces_pagos',
    'reporte_secciones_datos'
])

const COMPRAS_KEYS = new Set([
    'compras',
    'compras_detalles',
    'reporte_diario',
    'reporte_semanal',
    'reporte_mensual',
    'descalces_pagos',
    'historial_compras_detallado',
    'resumen_productos_proveedor',
    'proveedores',
    'reporte_secciones_datos'
])

const RESERVAS_KEYS = new Set([
    'reservas',
    'reservas_abiertas',
    'reservas_detalles'
])

const PRODUCTOS_KEYS = new Set([
    'productos',
    'productos_por_ids',
    'categorias_disponibles',
    'triage_products',
    'triage_pending_count',
    'rentabilidad_productos',
    'duplicados_trigram',
    'productos_sinonimos',
    'reporte_secciones_datos'
])

const PROVEEDORES_KEYS = new Set([
    'proveedores',
    'resumen_productos_proveedor',
    'historial_compras_detallado'
])

export const invalidateVentas = () => mutate((k) => VENTAS_KEYS.has(getKeyHead(k)))
export const invalidateCompras = () => mutate((k) => COMPRAS_KEYS.has(getKeyHead(k)))
export const invalidateReservas = () => mutate((k) => RESERVAS_KEYS.has(getKeyHead(k)))
export const invalidateProductos = () => mutate((k) => PRODUCTOS_KEYS.has(getKeyHead(k)))
export const invalidateProveedores = () => mutate((k) => PROVEEDORES_KEYS.has(getKeyHead(k)))

export function useVentas(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['ventas', options] : 'demo_ventas',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_VENTAS, count: mock.MOCK_VENTAS.length }
            }
            return api.getVentas(options)
        },
        getLiveSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useVentasDetalles(ventaId) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && ventaId) ? ['ventas_detalles', ventaId] : null,
        () => api.getVentasDetalles(ventaId),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, loading: false }

    return {
        data: data || EMPTY_ARRAY,
        loading: isLoading,
        error
    }
}

export function useProductos(options = EMPTY_OBJ, enabled = true) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !enabled ? null : (!isDemoMode ? ['productos', options] : 'demo_productos'),
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_PRODUCTOS, count: mock.MOCK_PRODUCTOS.length }
            }
            return api.getProductos(options)
        },
        getStaticSWROptions()
    )

    if (!enabled) {
        return { data: EMPTY_ARRAY, count: 0, loading: false, error: null }
    }

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useCategorias() {
    const { isDemoMode: _isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        'categorias_disponibles',
        () => api.getCategoriasDisponibles(),
        {
            ...getStaticSWROptions(),
            revalidateIfStale: false
        }
    )

    return {
        categorias: data?.categorias || EMPTY_ARRAY,
        subcategoriasPorCategoria: data?.subcategoriasPorCategoria || EMPTY_OBJ,
        loading: isLoading,
        error
    }
}

export function useProductosDuplicadosTrigram() {
    const { isDemoMode } = useAuth()
    const staticOptions = getStaticSWROptions()

    const { data: rawDups, isLoading, error } = useSWR(
        !isDemoMode ? 'duplicados_trigram' : null,
        () => api.getDuplicadosTrigram(),
        staticOptions
    )

    // Deterministic sorted ID list for stable SWR cache key
    const productIds = useMemo(() => {
        if (!rawDups || rawDups.length === 0) return null
        const ids = [...new Set(rawDups.flatMap(d => [d.id1, d.id2]).filter(Boolean))].sort()
        return ids.length > 0 ? ids : null
    }, [rawDups])

    // Only fetch the specific products involved in duplicates (not all 5000)
    const { data: involvedProducts } = useSWR(
        (!isDemoMode && productIds && productIds.length > 0) ? ['productos_por_ids', productIds] : null,
        () => api.getProductosPorIds(productIds),
        staticOptions
    )

    const [ignoredPairs, setIgnoredPairs] = useState(() => {
        try {
            const saved = localStorage.getItem('ignoredDuplicatesTrigram:v1');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        try {
            localStorage.setItem('ignoredDuplicatesTrigram:v1', JSON.stringify(ignoredPairs));
        } catch { /* storage unavailable */ }
    }, [ignoredPairs]);

    const ignoreDuplicate = useCallback((id1, id2) => {
        const pair = [String(id1), String(id2)].sort().join('|');
        setIgnoredPairs(prev => (prev.includes(pair) ? prev : [...prev, pair]));
    }, []);

    const duplicados = useMemo(() => {
        if (!rawDups || !involvedProducts) return EMPTY_ARRAY
        const ignoredSet = new Set(ignoredPairs)
        const productMap = new Map(involvedProducts.map(p => [String(p.producto_id), p]))
        return rawDups.flatMap(d => {
            const id1 = String(d.id1)
            const id2 = String(d.id2)
            const p1 = productMap.get(id1)
            const p2 = productMap.get(id2)
            if (!p1 || !p2) return []
            const pairKey = id1 <= id2 ? `${id1}|${id2}` : `${id2}|${id1}`
            if (ignoredSet.has(pairKey)) return []
            return [{ p1, p2, reason: `Similitud SQL: ${Math.round(d.similitud * 100)}%` }]
        })
    }, [rawDups, involvedProducts, ignoredPairs])

    return { data: duplicados, loading: isLoading, error, ignoreDuplicate, ignoredPairs }
}

export function useCompras(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['compras', options] : 'demo_compras',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_COMPRAS, count: mock.MOCK_COMPRAS.length }
            }
            return api.getCompras(options)
        },
        getLiveSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useComprasDetalles(compraId) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && compraId) ? ['compras_detalles', compraId] : null,
        () => api.getComprasDetalles(compraId),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, loading: false }

    return {
        data: data || EMPTY_ARRAY,
        loading: isLoading,
        error
    }
}

export function useReservas(options = EMPTY_OBJ, openOnly = false) {
    const { isDemoMode } = useAuth()
    const key = openOnly ? 'reservas_abiertas' : 'reservas'
    const fetcher = openOnly ? api.getReservasAbiertas : api.getReservas

    const { data, error, isLoading } = useSWR(
        !isDemoMode ? [key, options] : 'demo_reservas',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_RESERVAS, count: mock.MOCK_RESERVAS.length }
            }
            return fetcher(options)
        },
        getLiveSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReservasDetalles(reservaId) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && reservaId) ? ['reservas_detalles', reservaId] : null,
        () => api.getReservasDetalles(reservaId),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, loading: false }

    return {
        data: data || EMPTY_ARRAY,
        loading: isLoading,
        error
    }
}

export function useHistorialBot(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading, mutate: swrMutate } = useSWR(
        !isDemoMode ? ['historial_bot', options] : 'demo_historial',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_HISTORIAL, count: mock.MOCK_HISTORIAL.length }
            }
            return api.getHistorialBot(options)
        },
        getLiveSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error,
        mutate: isDemoMode ? NOOP_MUTATE : swrMutate
    }
}

export function useRentabilidadProductos(options = EMPTY_OBJ, enabled = true) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !enabled ? null : (!isDemoMode ? ['rentabilidad_productos', options] : 'demo_rentabilidad'),
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_RENTABILIDAD, count: mock.MOCK_RENTABILIDAD.length }
            }
            return api.getRentabilidadProductos(options)
        },
        getStaticSWROptions()
    )

    if (!enabled) {
        return { data: EMPTY_ARRAY, count: 0, loading: false, error: null }
    }

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReporte(type = 'diario', options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    let key = 'reporte_diario'
    let fetcher = api.getReporteDiario

    if (type === 'semanal') {
        key = 'reporte_semanal'
        fetcher = api.getReporteSemanal
    } else if (type === 'mensual') {
        key = 'reporte_mensual'
        fetcher = api.getReporteMensual
    }

    const swrOptions = type === 'diario' ? getLiveSWROptions() : getStaticSWROptions()

    const { data, error, isLoading } = useSWR(
        !isDemoMode ? [key, options] : 'demo_reporte',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_REPORTE_DIARIO, count: mock.MOCK_REPORTE_DIARIO.length }
            }
            return fetcher(options)
        },
        swrOptions
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useAnalisisHorarios(type = 'diario', options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    let key = 'analisis_horario_diario'
    let fetcher = api.getAnalisisHorarioDiario

    if (type === 'semanal') {
        key = 'analisis_horario_semanal'
        fetcher = api.getAnalisisHorarioSemanal
    } else if (type === 'mensual') {
        key = 'analisis_horario_mensual'
        fetcher = api.getAnalisisHorarioMensual
    }

    const { data, error, isLoading } = useSWR(
        !isDemoMode ? [key, options] : 'demo_analisis_horarios',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_ANALISIS_HORARIOS, count: mock.MOCK_ANALISIS_HORARIOS.length }
            }
            return fetcher(options)
        },
        getStaticSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useHitosViewData(page = 1, enabled = true) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !enabled ? null : (!isDemoMode ? ['hitos_view_data', page] : 'demo_hitos_view_data'),
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { hitos: EMPTY_ARRAY, dailyReports: mock.MOCK_REPORTE_DIARIO, allSales: EMPTY_ARRAY, count: 0 }
            }

            const pageSize = 14

            // 1. Obtener los 14 reportes diarios de la página (orden DESC por api.getReporteDiario base)
            const dailyReports = await api.getReporteDiario({
                page,
                pageSize,
                sortColumn: 'fecha',
                sortOrder: 'desc'
            })

            if (!dailyReports.data?.length) return { hitos: EMPTY_ARRAY, dailyReports: EMPTY_ARRAY, allSales: EMPTY_ARRAY, count: 0 }

            // 2. Determinar el rango de fechas
            const dates = dailyReports.data.map(d => d.fecha)
            const minDate = dates[dates.length - 1]
            const maxDate = dates[0]

            // 3. Obtener hitos y ventas filtrados por ese rango
            const [hitos, allSales] = await Promise.all([
                api.getHitosVentas({
                    dateColumn: 'dia',
                    dateRange: { start: minDate, end: maxDate }
                }),
                api.getVentas({
                    dateColumn: 'fecha',
                    dateRange: { start: minDate, end: maxDate },
                    pageSize: 1000 // Traer suficientes ventas para este rango
                })
            ])

            return {
                hitos: hitos.data || EMPTY_ARRAY,
                dailyReports: dailyReports.data || EMPTY_ARRAY,
                allSales: allSales.data || EMPTY_ARRAY,
                count: dailyReports.count || 0
            }
        },
        getStaticSWROptions()
    )

    if (!enabled) {
        return { data: undefined, loading: false, error: null }
    }

    return {
        data,
        loading: isLoading,
        error
    }
}

export function useMovimientosDinero(referenciaId) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && referenciaId) ? ['movimientos_dinero', referenciaId] : null,
        () => api.getMovimientosDinero(referenciaId),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, loading: false }

    return {
        data: data || EMPTY_ARRAY,
        loading: isLoading,
        error
    }
}

export function useMovimientosStock(referenciaId) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && referenciaId) ? ['stock_movimientos', referenciaId] : null,
        () => api.getMovimientosStock(referenciaId),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, loading: false }

    return {
        data: data || EMPTY_ARRAY,
        loading: isLoading,
        error
    }
}

export function useClientes(options = EMPTY_OBJ, enabled = true) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && enabled) ? ['clientes', options] : null,
        () => api.getClientes(options),
        getStaticSWROptions()
    )

    if (isDemoMode || !enabled) return { data: EMPTY_ARRAY, count: 0, loading: false }

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReporteVentasPeriodico(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['reporte-ventas-periodico', options] : null,
        () => api.getReporteVentasPeriodico(options),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, count: 0, loading: false }

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export const useRetiros = (options = EMPTY_OBJ) => {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['retiros', options] : 'demo_retiros',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_RETIROS, count: mock.MOCK_RETIROS.length }
            }
            return api.getRetiros(options)
        },
        getStaticSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useProveedores(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['proveedores', options] : 'demo_proveedores',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_PROVEEDORES, count: mock.MOCK_PROVEEDORES.length }
            }
            return api.getProveedores(options)
        },
        getStaticSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useResumenProductosProveedor(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && options.filterValue) ? ['resumen_productos_proveedor', options] : null,
        () => api.getResumenProductosProveedor(options),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, count: 0, loading: false }

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useHistorialCompras(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode
            ? ((options.filterValue || options.producto) ? ['historial_compras_detallado', options] : null)
            : ['demo_historial_compras', options.filterColumn, options.filterValue],
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                let filtered = mock.MOCK_HISTORIAL_COMPRAS
                if (options.filterColumn === 'proveedor' && options.filterValue) {
                    filtered = filtered.filter(h => h.proveedor === options.filterValue)
                }
                if (options.filterColumn === 'producto' && options.filterValue) {
                    filtered = filtered.filter(h => h.producto === options.filterValue)
                }
                return { data: filtered, count: filtered.length }
            }
            return api.getHistorialCompras(options)
        },
        getStaticSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function usePredictiveStock(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['predictive_stock', options] : null,
        () => api.getPredictiveStock(options),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, count: 0, loading: false }

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

// NOTE: useUnifiedFeed removed — was triggering 4 redundant parallel API calls (ventas, compras, retiros, reservas)
// with no active consumers in the codebase. If needed in the future, re-implement using a single
// server-side aggregation endpoint to avoid the N+1 network request pattern.
export function useProductosSinonimos() {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? 'productos_sinonimos' : null,
        () => api.getProductosSinonimos(),
        getStaticSWROptions()
    )

    if (isDemoMode) return { data: EMPTY_ARRAY, loading: false }

    return {
        data: data || EMPTY_ARRAY,
        loading: isLoading,
        error
    }
}

export function useDescalcesPagos(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading, mutate: swrMutate } = useSWR(
        !isDemoMode ? ['descalces_pagos', options] : 'demo_descalces',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { data: mock.MOCK_DESCALCES, count: mock.MOCK_DESCALCES.length }
            }
            return api.getDescalcesPagos(options)
        },
        getStaticSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error,
        mutate: swrMutate
    }
}

export function useReporteSecciones(options = EMPTY_OBJ) {
    const { isDemoMode } = useAuth()
    const { periodDays = 30, targetCoverageDays = 7, minVentasPeriodo = 1, minComprasMes, customRules } = options
    const staticOptions = getStaticSWROptions()

    const { data: rentList, loading: loadingRent, error: errorRent } = useRentabilidadProductos(
        FULL_PAGE_OPTIONS,
        !isDemoMode
    )

    const { data: prodList, loading: loadingProd, error: errorProd } = useProductos(
        FULL_PAGE_OPTIONS,
        !isDemoMode
    )

    const { data: seccionesRes, error: seccionesError, isLoading: loadingSecciones, mutate: mutateSecciones } = useSWR(
        !isDemoMode ? ['reporte_secciones_datos', periodDays] : 'demo_reporte_secciones_datos',
        async () => {
            if (isDemoMode) {
                const mock = await loadMock()
                return { mockRentabilidad: mock.MOCK_RENTABILIDAD }
            }
            return api.getReporteSeccionesDatos(periodDays)
        },
        staticOptions
    )

    const sections = useMemo(() => {
        let rawList = []
        if (isDemoMode) {
            const mockRent = seccionesRes?.mockRentabilidad || EMPTY_ARRAY
            rawList = mockRent.map(r => ({
                producto: r.producto,
                ingresos_totales: r.ingreso_total,
                costo_mercaderia_vendida: r.costo_total,
                ganancia_neta: r.ganancia,
                unidades_vendidas: r.unidades_vendidas,
                stock_actual: 15,
                ultimo_costo_compra: r.costo_total / (r.unidades_vendidas || 1)
            }))
        } else {
            const comprasCountsRes = seccionesRes?.conteoCompras || EMPTY_OBJ
            const ventasPeriodoRes = seccionesRes?.ventasPeriodo || EMPTY_OBJ
            const ventas7dRes = seccionesRes?.ventas7d || EMPTY_OBJ
            const ventas30dRes = seccionesRes?.ventas30d || EMPTY_OBJ

            const prodMap = new Map()
            prodList.forEach(p => {
                const normName = (p.nombre || '').toLowerCase().trim()
                prodMap.set(normName, p)
            })

            rawList = rentList.map(r => {
                const normName = (r.producto || '').toLowerCase().trim()
                const prodInfo = prodMap.get(normName) || EMPTY_OBJ
                const comprasCount = comprasCountsRes[normName] || 0
                const periodSales = ventasPeriodoRes[normName] || { unidades: 0, ingresos: 0, ventasCount: 0 }
                const sales7d = ventas7dRes[normName] || { unidades: 0, ventasCount: 0 }
                const sales30d = ventas30dRes[normName] || { unidades: 0, ventasCount: 0 }

                const costoUnitario = prodInfo.ultimo_costo_compra || r.ppp_costo_unitario || 0
                const unidadesVendidasPeriodo = periodSales.unidades
                const ingresosTotalesPeriodo = periodSales.ingresos
                const cmvPeriodo = unidadesVendidasPeriodo * costoUnitario
                const gananciaNetaPeriodo = ingresosTotalesPeriodo - cmvPeriodo

                return {
                    ...r,
                    unidades_vendidas: unidadesVendidasPeriodo,
                    unidades_vendidas_7d: sales7d.unidades,
                    unidades_vendidas_30d: sales30d.unidades,
                    ventas_count: periodSales.ventasCount || 0,
                    ventas_count_7d: sales7d.ventasCount || 0,
                    ventas_count_30d: sales30d.ventasCount || 0,
                    ingresos_totales: ingresosTotalesPeriodo,
                    costo_mercaderia_vendida: cmvPeriodo,
                    ganancia_neta: gananciaNetaPeriodo,
                    compras_count: comprasCount,
                    stock_actual: prodInfo.stock_actual !== undefined ? prodInfo.stock_actual : 0,
                    ultimo_costo_compra: costoUnitario,
                    ultimo_precio_venta: prodInfo.ultimo_precio_venta || 0,
                    categoria: prodInfo.categoria || r.categoria || '',
                    subcategoria: prodInfo.subcategoria || r.subcategoria || ''
                }
            })
        }

        let filteredList = rawList
        const threshold = minVentasPeriodo !== undefined ? minVentasPeriodo : (minComprasMes || 0)
        if (threshold > 0 && !isDemoMode) {
            filteredList = rawList.filter(r => (r.ventas_count || 0) >= (minVentasPeriodo || minComprasMes || 0) || (r.unidades_vendidas || 0) >= (minVentasPeriodo || minComprasMes || 0) || (r.stock_actual <= 0 && (r.unidades_vendidas || 0) > 0))
        }

        const lotesRes = seccionesRes?.lotesCompras || EMPTY_OBJ
        return aggregateBySections(filteredList, { periodDays, targetCoverageDays, customRules, lotesMap: lotesRes })
    }, [isDemoMode, rentList, prodList, seccionesRes, periodDays, targetCoverageDays, minVentasPeriodo, minComprasMes, customRules])

    const totals = useMemo(() => {
        return sections.reduce((acc, sec) => {
            acc.totalIngresos += sec.ingresosTotales
            acc.totalGanancia += sec.gananciaNeta
            acc.totalCMV += sec.costoMercaderiaVendida
            acc.totalUnidadesVendidas += sec.unidadesVendidas
            acc.totalStockActual += sec.stockActualTotal
            acc.totalUnidadesAReponer += sec.unidadesAReponer
            acc.totalPresupuestoReposicion += sec.presupuestoReposicion
            acc.totalProductosCriticos += sec.productosCriticosCount
            return acc
        }, {
            totalIngresos: 0,
            totalGanancia: 0,
            totalCMV: 0,
            totalUnidadesVendidas: 0,
            totalStockActual: 0,
            totalUnidadesAReponer: 0,
            totalPresupuestoReposicion: 0,
            totalProductosCriticos: 0
        })
    }, [sections])

    return {
        sections,
        totals,
        loading: isDemoMode ? loadingSecciones : (loadingRent || loadingProd || loadingSecciones),
        error: errorRent || errorProd || seccionesError || null,
        mutate: mutateSecciones
    }
}

export function useTriageProducts(tab = 'criticos') {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading, mutate: swrMutate } = useSWR(
        !isDemoMode ? ['triage_products', tab] : null,
        () => api.getTriageProducts(tab),
        getStaticSWROptions()
    )

    return {
        data: data?.data || EMPTY_ARRAY,
        count: data?.count || 0,
        loading: isLoading,
        error,
        mutate: swrMutate
    }
}

export function useTriagePendingCount() {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? 'triage_pending_count' : null,
        () => api.getTriagePendingCount(),
        {
            ...getStaticSWROptions(),
            refreshInterval: isMeteredOrSlow() ? 0 : 180000,
            revalidateOnFocus: false,
            dedupingInterval: 30000
        }
    )

    return {
        count: isDemoMode ? 0 : (data || 0),
        loading: isLoading,
        error
    }
}
