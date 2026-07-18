import React, { useMemo, useState, useEffect } from 'react'
import useSWR from 'swr'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'
import * as mock from '../services/mockData'

// Global SWR config helper for better performance on mobile and slow networks
const getSWROptions = () => {
    if (typeof window === 'undefined') return {
        refreshInterval: 60000,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,
        shouldRetryOnError: false,
    }

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    let interval = 60000 // Default 1 minute
    let deduping = 10000 // Default 10 seconds
    
    if (isMobile) {
        interval = 300000 // 5 minutes on mobile to save battery
        deduping = 20000  // 20 seconds deduplication to avoid redundant calls
    }
    
    if (connection) {
        if (connection.saveData || ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
            interval = 0 // Disable auto-refresh entirely on slow or metered connections
        }
    }
    
    return {
        refreshInterval: interval,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: deduping,
        shouldRetryOnError: false,
    }
}

const SWR_OPTIONS = getSWROptions()


export function useVentas(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['ventas', options] : null,
        () => api.getVentas(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: mock.MOCK_VENTAS, count: mock.MOCK_VENTAS.length, loading: false }

    return {
        data: data?.data || [],
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
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], loading: false } // Simplificado para demo

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useProductos(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['productos', options] : null,
        () => api.getProductos(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: mock.MOCK_PRODUCTOS, count: mock.MOCK_PRODUCTOS.length, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useProductosDuplicadosTrigram() {
    const { isDemoMode } = useAuth()
    const { data: rawDups, isLoading, error } = useSWR(
        !isDemoMode ? 'duplicados_trigram' : null,
        () => api.getDuplicadosTrigram(),
        SWR_OPTIONS
    )

    // Build the unique list of product IDs from the duplicates results
    const productIds = useMemo(() => {
        if (!rawDups || rawDups.length === 0) return null
        const ids = new Set()
        rawDups.forEach(d => { ids.add(d.id1); ids.add(d.id2) })
        return [...ids]
    }, [rawDups])

    // Only fetch the specific products involved in duplicates (not all 5000)
    const { data: involvedProducts } = useSWR(
        (!isDemoMode && productIds && productIds.length > 0) ? ['productos_por_ids', productIds] : null,
        () => api.getProductosPorIds(productIds),
        SWR_OPTIONS
    )

    const [ignoredPairs, setIgnoredPairs] = useState(() => {
        try {
            const saved = localStorage.getItem('ignoredDuplicatesTrigram');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        try {
            localStorage.setItem('ignoredDuplicatesTrigram', JSON.stringify(ignoredPairs));
        } catch { /* storage unavailable */ }
    }, [ignoredPairs]);

    const ignoreDuplicate = (id1, id2) => {
        const pair = [String(id1), String(id2)].sort().join('|');
        setIgnoredPairs(prev => [...prev, pair]);
    };

    const duplicados = useMemo(() => {
        if (!rawDups || !involvedProducts) return []
        const ignoredSet = new Set(ignoredPairs)
        return rawDups.flatMap(d => {
            const p1 = involvedProducts.find(p => String(p.producto_id) === d.id1)
            const p2 = involvedProducts.find(p => String(p.producto_id) === d.id2)
            if (!p1 || !p2) return []
            if (ignoredSet.has([d.id1, d.id2].sort().join('|'))) return []
            return [{ p1, p2, reason: `Similitud SQL: ${Math.round(d.similitud * 100)}%` }]
        })
    }, [rawDups, involvedProducts, ignoredPairs])

    return { data: duplicados, loading: isLoading, error, ignoreDuplicate, ignoredPairs }
}

export function useCompras(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['compras', options] : null,
        () => api.getCompras(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: mock.MOCK_COMPRAS, count: mock.MOCK_COMPRAS.length, loading: false }

    return {
        data: data?.data || [],
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
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], loading: false }

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useReservas(options = {}, openOnly = false) {
    const { isDemoMode } = useAuth()
    const key = openOnly ? 'reservas_abiertas' : 'reservas'
    const fetcher = openOnly ? api.getReservasAbiertas : api.getReservas

    const { data, error, isLoading } = useSWR(
        !isDemoMode ? [key, options] : null,
        () => fetcher(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: mock.MOCK_RESERVAS, count: mock.MOCK_RESERVAS.length, loading: false }

    return {
        data: data?.data || [],
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
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], loading: false }

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useHistorialBot(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['historial_bot', options] : null,
        () => api.getHistorialBot(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: mock.MOCK_HISTORIAL, count: mock.MOCK_HISTORIAL.length, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useRentabilidadProductos(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['rentabilidad_productos', options] : null,
        () => api.getRentabilidadProductos(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReporte(type = 'diario', options = {}) {
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

    const { data, error, isLoading } = useSWR(
        !isDemoMode ? [key, options] : null,
        () => fetcher(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: mock.MOCK_REPORTE_DIARIO, count: mock.MOCK_REPORTE_DIARIO.length, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useAnalisisHorarios(type = 'diario', options = {}) {
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
        !isDemoMode ? [key, options] : null,
        () => fetcher(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useHitosViewData(page = 1) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['hitos_view_data', page] : null,
        async () => {
            const pageSize = 14

            // 1. Obtener los 14 reportes diarios de la página (orden DESC por api.getReporteDiario base)
            const dailyReports = await api.getReporteDiario({
                page,
                pageSize,
                sortColumn: 'fecha',
                sortOrder: 'desc'
            })

            if (!dailyReports.data?.length) return { hitos: [], dailyReports: [], allSales: [], count: 0 }

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
                hitos: hitos.data || [],
                dailyReports: dailyReports.data || [],
                allSales: allSales.data || [],
                count: dailyReports.count || 0
            }
        },
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: { hitos: [], dailyReports: mock.MOCK_REPORTE_DIARIO, allSales: [], count: 0 }, loading: false }

    return {
        data: data,
        loading: isLoading,
        error
    }
}

export function useMovimientosDinero(referenciaId) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && referenciaId) ? ['movimientos_dinero', referenciaId] : null,
        () => api.getMovimientosDinero(referenciaId),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], loading: false }

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useMovimientosStock(referenciaId) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && referenciaId) ? ['stock_movimientos', referenciaId] : null,
        () => api.getMovimientosStock(referenciaId),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], loading: false }

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useClientes(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['clientes', options] : null,
        () => api.getClientes(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReporteVentasPeriodico(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['reporte-ventas-periodico', options] : null,
        () => api.getReporteVentasPeriodico(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export const useRetiros = (options = {}) => {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['retiros', options] : null,
        () => api.getRetiros(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useProveedores(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['proveedores', options] : null,
        () => api.getProveedores(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: mock.MOCK_PROVEEDORES, count: mock.MOCK_PROVEEDORES.length, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useResumenProductosProveedor(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && options.filterValue) ? ['resumen_productos_proveedor', options] : null,
        () => api.getResumenProductosProveedor(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useHistorialCompras(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        (!isDemoMode && (options.filterValue || options.producto)) ? ['historial_compras_detallado', options] : null,
        () => api.getHistorialCompras(options),
        SWR_OPTIONS
    )

    if (isDemoMode) {
        let filtered = mock.MOCK_HISTORIAL_COMPRAS
        if (options.filterColumn === 'proveedor' && options.filterValue) {
            filtered = filtered.filter(h => h.proveedor === options.filterValue)
        }
        if (options.filterColumn === 'producto' && options.filterValue) {
            filtered = filtered.filter(h => h.producto === options.filterValue)
        }
        return { data: filtered, count: filtered.length, loading: false }
    }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function usePredictiveStock(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading } = useSWR(
        !isDemoMode ? ['predictive_stock', options] : null,
        () => api.getPredictiveStock(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false }

    return {
        data: data?.data || [],
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
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], loading: false }

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useDescalcesPagos(options = {}) {
    const { isDemoMode } = useAuth()
    const { data, error, isLoading, mutate } = useSWR(
        !isDemoMode ? ['descalces_pagos', options] : null,
        () => api.getDescalcesPagos(options),
        SWR_OPTIONS
    )

    if (isDemoMode) return { data: [], count: 0, loading: false, mutate }

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    }
}
