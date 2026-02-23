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
