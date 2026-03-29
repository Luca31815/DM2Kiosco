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
        
        // Función ultra básica para quitar plurales en español
        const stemWord = (word) => {
            if (word.length > 3 && word.endsWith('S')) {
                if (word.endsWith('ES') && !word.endsWith('RES') && !word.endsWith('TES')) return word.slice(0, -2);
                return word.slice(0, -1);
            }
            return word;
        };

        // Algoritmo Fonético Simplificado Español
        const phonetic = (word) => {
            return word.toUpperCase()
                .replace(/H/g, '')
                .replace(/[ZV]/g, 'B')
                .replace(/[CSZ]/g, 'S')
                .replace(/LL/g, 'Y')
                .replace(/QU/g, 'K')
                .replace(/C[EI]/g, 'S')
                .replace(/C/g, 'K')
                .replace(/G[EI]/g, 'J')
                .replace(/(.)\1+/g, '$1'); // Quitar letras dobles restantes
        };

        const getWords = (name) => {
            if (!name) return [];
            const stopwords = new Set(['DE', 'LA', 'EL', 'LOS', 'LAS', 'CON', 'SIN', 'SABOR', 'UN', 'UNA', 'Y', 'O', 'PARA', 'AL', 'DEL']);
            
            // Reemplazos de Diccionario Kiosco
            let cleaned = String(name).toUpperCase()
                .replace(/\bCHOC\b/g, "CHOCOLATE")
                .replace(/\bDLCE\b/g, "DULCE")
                .replace(/\bC\/\b/g, "CON ")
                .replace(/\bP\/\b/g, "PARA ")
                .replace(/\bGFA\b/g, "GARRAFA")
                // Reemplazar unidades y limpiar caracteres
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
                .replace(/(\d+)\s*(LTS|LT|L)\b/g, "$1L")
                .replace(/(\d+)\s*(CM3|CC|ML)\b/g, "$1ML")
                .replace(/(\d+)\s*(GRS|GR|GRAMOS|G)\b/g, "$1G")
                .replace(/(\d+)\s*(KILOS|KG|K)\b/g, "$1KG")
                .trim();

            return cleaned.split(/\s+/)
                .filter(w => w.length > 0 && !stopwords.has(w))
                .map(w => ({ raw: stemWord(w), sound: phonetic(stemWord(w)) }));
        };

        // Algoritmo de Distancia de Levenshtein
        const levenshtein = (a, b) => {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;
            let matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
            for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
            for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
            for (let j = 1; j <= b.length; j++) {
                for (let i = 1; i <= a.length; i++) {
                    const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
                    matrix[j][i] = Math.min(
                        matrix[j][i - 1] + 1,
                        matrix[j - 1][i] + 1,
                        matrix[j - 1][i - 1] + indicator
                    );
                }
            }
            return matrix[b.length][a.length];
        };

        const isFuzzyMatch = (w1, w2) => {
            if (w1.raw === w2.raw) return true;
            if (w1.sound === w2.sound) return true; // Match fonético ("Sanwich" == "Sandwich")
            
            // Typos matemáticos
            if (Math.abs(w1.raw.length - w2.raw.length) > 2) return false;
            // Solo aplicar typos en palabras grandes para evitar falsos positivos
            if (w1.raw.length > 4 && w2.raw.length > 4) {
                const threshold = Math.max(w1.raw.length, w2.raw.length) > 7 ? 2 : 1;
                return levenshtein(w1.raw, w2.raw) <= threshold;
            }
            return false;
        };

        const checkFuzzyInclude = (shorter, longer) => {
            return shorter.every(w1 => longer.some(w2 => isFuzzyMatch(w1, w2)));
        };

        const candidates = [];
        
        // Transformar todos los productos en objetos curados
        const parsedProducts = [];
        for (const p of productos) {
            const price = parseFloat(p.ultimo_precio_venta || p.precio_venta || 0);
            if (isNaN(price)) continue;
            parsedProducts.push({
                ...p,
                price: price,
                idStr: String(p.producto_id || p.id),
                words: getWords(p.nombre || '')
            });
        }

        // Ordenar por precio ascendente para la "Ventana Deslizante"
        parsedProducts.sort((a, b) => a.price - b.price);

        // 3. Ventana de tolerancia de Precio (Diferencia máxima: 15%)
        for (let i = 0; i < parsedProducts.length; i++) {
            const p1 = parsedProducts[i];
            
            for (let j = i + 1; j < parsedProducts.length; j++) {
                const p2 = parsedProducts[j];
                
                // Si p2 es más del 15% más caro que p1, romper ciclo j (lista ordenada, el resto será aún más caro)
                if (p2.price > p1.price * 1.15) {
                    break;
                }

                if (ignoredPairs.includes([p1.idStr, p2.idStr].sort().join('|'))) continue;

                const words1 = p1.words;
                const words2 = p2.words;
                if (words1.length === 0 || words2.length === 0) continue;

                const str1 = words1.map(w => w.raw).sort().join(" ");
                const str2 = words2.map(w => w.raw).sort().join(" ");

                if (str1 === str2) {
                    candidates.push({ p1, p2, reason: 'Nombres similares' });
                    continue;
                }

                const isW1Shorter = words1.length < words2.length;
                const shorter = isW1Shorter ? words1 : words2;
                const longer = isW1Shorter ? words2 : words1;

                if (checkFuzzyInclude(shorter, longer)) {
                    candidates.push({ p1, p2, reason: shorter.length === longer.length ? 'Variación Ortográfica/Fonética' : 'Palabras incluidas' });
                    continue;
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
