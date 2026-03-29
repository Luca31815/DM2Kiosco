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

export function useProductosDuplicados() {
    const { data: productos, loading, error } = useProductos({ page: 1, pageSize: 3000, select: 'producto_id,nombre,ultimo_precio_venta,stock_actual,ultimo_costo_compra' });

    const [ignoredPairs, setIgnoredPairs] = useState(() => {
        try {
            const saved = localStorage.getItem('ignoredDuplicates');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const ignoreDuplicate = (id1, id2) => {
        if (!id1 || !id2) return;
        const pair = [String(id1), String(id2)].sort().join('|');
        setIgnoredPairs(prev => {
            if (prev.includes(pair)) return prev;
            const next = [...prev, pair];
            localStorage.setItem('ignoredDuplicates', JSON.stringify(next));
            return next;
        });
    };

    const duplicados = useMemo(() => {
        if (!productos || productos.length === 0) return [];
        
        // Función ultra básica para quitar plurales en español (terminaciones S y ES en palabras largas)
        const stemWord = (word) => {
            if (word.length > 3 && word.endsWith('S')) {
                if (word.endsWith('ES') && !word.endsWith('RES') && !word.endsWith('TES')) {
                     // Excepciones rápidas: alfajores, chocolates, pero cuidado con 'TRES', etc.
                     // Mejoramos un poco:
                     return word.slice(0, -2);
                }
                // Si solo termina en S (ej: CARAMELOS, PAPAS, GOMITAS)
                return word.slice(0, -1);
            }
            return word;
        };

        const getWords = (name) => {
            if (!name) return [];
            return String(name).toUpperCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map(stemWord);
        };

        const candidates = [];
        
        for (let i = 0; i < productos.length; i++) {
            for (let j = i + 1; j < productos.length; j++) {
                const p1 = productos[i];
                const p2 = productos[j];

                // Ver si ya fue descartado por el usuario
                const id1 = String(p1.producto_id || p1.id);
                const id2 = String(p2.producto_id || p2.id);
                if (ignoredPairs.includes([id1, id2].sort().join('|'))) continue;

                // REGLA 1: Solo comparar si tienen el mismo precio (asumiendo numerico)
                const precio1 = parseFloat(p1.ultimo_precio_venta || p1.precio_venta);
                const precio2 = parseFloat(p2.ultimo_precio_venta || p2.precio_venta);
                if (isNaN(precio1) || isNaN(precio2) || precio1 !== precio2) continue;

                const nombre1 = p1.nombre || '';
                const nombre2 = p2.nombre || '';
                
                const words1 = getWords(nombre1);
                const words2 = getWords(nombre2);
                
                if (words1.length === 0 || words2.length === 0) continue;

                const str1 = [...words1].sort().join(" ");
                const str2 = [...words2].sort().join(" ");

                // REGLA 2: Son exactamente lo mismo normalizados
                if (str1 === str2) {
                    candidates.push({ p1, p2, reason: 'Nombres similares' });
                    continue;
                }

                // REGLA 3: Todas las palabras de uno (el más corto) están en el otro (el más largo)
                const isW1Shorter = words1.length < words2.length;
                const shorter = isW1Shorter ? words1 : words2;
                const longer = isW1Shorter ? words2 : words1;

                // Chequeamos si cada palabra del producto más corto existe en el más largo
                const containsAllWords = shorter.every(w => longer.includes(w));
                if (containsAllWords) {
                    candidates.push({ p1, p2, reason: 'Palabras incluidas' });
                    continue;
                }

                // REGLA 4: Sufijos y Prefijos clásicos (como respaldo)
                if (str1.startsWith(str2 + " ") || str2.startsWith(str1 + " ")) {
                    candidates.push({ p1, p2, reason: 'Sufijo/Prefijo' });
                }
            }
        }
        
        return candidates;
    }, [productos, ignoredPairs]);

    return { data: duplicados, loading, error, count: duplicados.length, ignoreDuplicate };
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
            ...(ventas || []).map(v => ({ id: v.venta_id, type: 'venta', title: `Venta #${v.venta_id.split('_').pop()}`, amount: v.total, time: v.fecha })),
            ...(compras || []).map(c => ({ id: c.compra_id, type: 'compra', title: `Compra: ${c.proveedor || 'S/P'}`, amount: -c.total, time: c.fecha })),
            ...(retiros || []).map(r => ({ id: r.retiro_id, type: 'retiro', title: `Retiro: ${r.motivo}`, amount: -r.monto, time: r.fecha })),
            ...(reservas || []).map(res => ({ id: res.reserva_id, type: 'reserva', title: `Reserva: ${res.cliente}`, amount: res.total, time: res.fecha_creacion, isReserva: true })),
        ]
        return result.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit)
    }, [ventas, compras, retiros, reservas, limit])

    return { data: combined, loading: !ventas && !compras }
}
