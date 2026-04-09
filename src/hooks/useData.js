import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'
import * as mock from '../services/mockData'

// Global SWR config or helper could go here
const SWR_OPTIONS = {
    refreshInterval: 60000, // 1 minute auto-refresh
    revalidateOnFocus: false, // Optional: prevent aggressive revalidation on window focus
}

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
    const { data: allProducts } = useProductos({ pageSize: 5000 })

    const [ignoredPairs, setIgnoredPairs] = useState(() => {
        try {
            const saved = localStorage.getItem('ignoredDuplicatesTrigram');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const ignoreDuplicate = (id1, id2) => {
        const pair = [String(id1), String(id2)].sort().join('|');
        setIgnoredPairs(prev => {
            const next = [...prev, pair];
            localStorage.setItem('ignoredDuplicatesTrigram', JSON.stringify(next));
            return next;
        });
    };

    const duplicados = useMemo(() => {
        if (!rawDups || !allProducts) return []
        return rawDups.map(d => {
            const p1 = allProducts.find(p => String(p.producto_id) === d.id1)
            const p2 = allProducts.find(p => String(p.producto_id) === d.id2)
            if (!p1 || !p2) return null
            if (ignoredPairs.includes([d.id1, d.id2].sort().join('|'))) return null
            return { p1, p2, reason: `Similitud SQL: ${Math.round(d.similitud * 100)}%` }
        }).filter(Boolean)
    }, [rawDups, allProducts, ignoredPairs])

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

export function useRetiros(options = {}) {
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

export function useUnifiedFeed(limit = 15) {
    const { data: ventas } = useVentas({ pageSize: limit })
    const { data: compras } = useCompras({ pageSize: limit })
    const { data: retiros } = useRetiros({ pageSize: limit })
    const { data: reservas } = useReservas({ pageSize: limit })

    const combined = useMemo(() => {
        if (!ventas && !compras && !retiros && !reservas) return []
        
        const result = [
            ...(ventas || []).map(v => ({ id: v.venta_id, type: 'venta', title: `Venta #${v.venta_id.split('_').pop()}`, amount: v.total_venta, time: v.fecha })),
            ...(compras || []).map(c => ({ id: c.compra_id, type: 'compra', title: `Compra: ${c.proveedor || 'S/P'}`, amount: -c.total_compra, time: c.fecha })),
            ...(retiros || []).map(r => ({ id: r.retiro_id, type: 'retiro', title: `Retiro: ${r.motivo}`, amount: -r.monto, time: r.fecha })),
            ...(reservas || []).map(res => ({ id: res.reserva_id, type: 'reserva', title: `Reserva: ${res.cliente}`, amount: res.total_reserva, time: res.fecha_creacion, isReserva: true })),
        ]
        return result.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit)
    }, [ventas, compras, retiros, reservas, limit])

    return { data: combined, loading: !ventas && !compras }
}
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
