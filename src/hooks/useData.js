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
