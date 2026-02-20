import useSWR from 'swr'
import * as api from '../services/api'

// Global SWR config or helper could go here
const SWR_OPTIONS = {
    refreshInterval: 60000, // 1 minute auto-refresh
    revalidateOnFocus: false, // Optional: prevent aggressive revalidation on window focus
}

export function useVentas(options = {}) {
    const { data, error, isLoading } = useSWR(
        ['ventas', options],
        () => api.getVentas(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useVentasDetalles(ventaId) {
    const { data, error, isLoading } = useSWR(
        ventaId ? ['ventas_detalles', ventaId] : null,
        () => api.getVentasDetalles(ventaId),
        SWR_OPTIONS
    )

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useProductos(options = {}) {
    const { data, error, isLoading } = useSWR(
        ['productos', options],
        () => api.getProductos(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useCompras(options = {}) {
    const { data, error, isLoading } = useSWR(
        ['compras', options],
        () => api.getCompras(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useComprasDetalles(compraId) {
    const { data, error, isLoading } = useSWR(
        compraId ? ['compras_detalles', compraId] : null,
        () => api.getComprasDetalles(compraId),
        SWR_OPTIONS
    )

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useReservas(options = {}, openOnly = false) {
    const key = openOnly ? 'reservas_abiertas' : 'reservas'
    const fetcher = openOnly ? api.getReservasAbiertas : api.getReservas

    const { data, error, isLoading } = useSWR(
        [key, options],
        () => fetcher(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReservasDetalles(reservaId) {
    const { data, error, isLoading } = useSWR(
        reservaId ? ['reservas_detalles', reservaId] : null,
        () => api.getReservasDetalles(reservaId),
        SWR_OPTIONS
    )

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useHistorialBot(options = {}) {
    const { data, error, isLoading } = useSWR(
        ['historial_bot', options],
        () => api.getHistorialBot(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useRentabilidadProductos(options = {}) {
    const { data, error, isLoading } = useSWR(
        ['rentabilidad_productos', options],
        () => api.getRentabilidadProductos(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReporte(type = 'diario', options = {}) {
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
        [key, options],
        () => fetcher(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useAnalisisHorarios(type = 'diario', options = {}) {
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
        [key, options],
        () => fetcher(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useHitosViewData(page = 1) {
    const { data, error, isLoading } = useSWR(
        ['hitos_view_data', page],
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

    return {
        data: data,
        loading: isLoading,
        error
    }
}

export function useMovimientosDinero(referenciaId) {
    const { data, error, isLoading } = useSWR(
        referenciaId ? ['movimientos_dinero', referenciaId] : null,
        () => api.getMovimientosDinero(referenciaId),
        SWR_OPTIONS
    )

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useMovimientosStock(referenciaId) {
    const { data, error, isLoading } = useSWR(
        referenciaId ? ['stock_movimientos', referenciaId] : null,
        () => api.getMovimientosStock(referenciaId),
        SWR_OPTIONS
    )

    return {
        data: data || [],
        loading: isLoading,
        error
    }
}

export function useClientes(options = {}) {
    const { data, error, isLoading } = useSWR(
        ['clientes', options],
        () => api.getClientes(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}

export function useReporteVentasPeriodico(options = {}) {
    const { data, error, isLoading } = useSWR(
        ['reporte-ventas-periodico', options],
        () => api.getReporteVentasPeriodico(options),
        SWR_OPTIONS
    )

    return {
        data: data?.data || [],
        count: data?.count || 0,
        loading: isLoading,
        error
    }
}
