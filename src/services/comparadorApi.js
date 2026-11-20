import { supabase } from '../lib/supabase'

const toNum = (val, fallback = 0) => {
    const n = Number(val)
    return Number.isFinite(n) ? n : fallback
}

/**
 * Normaliza de forma simétrica los filtros de Categoría y Búsqueda (Matriz de 4 Cuadrantes).
 * Garantiza que los 4 cuadrantes (A vacío + B vacío, A activo + B vacío, A vacío + B activo, A activo + B activo)
 * pasen siempre por el mismo contrato hacia las RPCs de PostgreSQL.
 */
export const sanitizeComparadorFilters = ({ categoria = null, search = null } = {}) => {
    const rawCat = typeof categoria === 'string' ? categoria.trim() : ''
    const isAllCat = !rawCat || ['TODAS', 'TODOS', 'ALL', '*'].includes(rawCat.toUpperCase())
    const normalizedCategoria = isAllCat ? null : rawCat

    const rawSearch = typeof search === 'string' ? search.trim() : ''
    const normalizedSearch = rawSearch.length > 0 ? rawSearch : null

    return {
        p_categoria: normalizedCategoria,
        p_search: normalizedSearch,
        quadrant: normalizedCategoria && normalizedSearch
            ? 'Q4_CAT_AND_SEARCH'
            : normalizedCategoria
                ? 'Q2_ONLY_CAT'
                : normalizedSearch
                    ? 'Q3_ONLY_SEARCH'
                    : 'Q1_ALL_EMPTY'
    }
}

const AR_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
})

/**
 * Obtiene la fecha actual en zona horaria America/Argentina/Buenos_Aires en formato YYYY-MM-DD.
 */
export const getArgentinaTodayISO = (now = new Date()) => {
    try {
        const parts = AR_DATE_FORMATTER.formatToParts(now)
        const y = parts.find((p) => p.type === 'year')?.value
        const m = parts.find((p) => p.type === 'month')?.value
        const d = parts.find((p) => p.type === 'day')?.value
        if (y && m && d) return `${y}-${m}-${d}`
    } catch {
        // Fallback local
    }
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const parseISODate = (isoStr) => {
    const [y, m, d] = String(isoStr).split('-').map(Number)
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0))
}

const formatISODate = (dateObj) => {
    const y = dateObj.getUTCFullYear()
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const addDaysISO = (isoStr, deltaDays) => {
    const dt = parseISODate(isoStr)
    dt.setUTCDate(dt.getUTCDate() + deltaDays)
    return formatISODate(dt)
}

/**
 * Calcula los rangos Período Base A y Período Comparado B según el preset seleccionado.
 * Todos los presets respetan igual cantidad de días transcurridos para comparaciones justas.
 */
export const computePeriodPreset = (presetId, referenceDateISO = getArgentinaTodayISO()) => {
    const today = parseISODate(referenceDateISO)
    const todayStr = formatISODate(today)
    // ISODOW: Lunes = 1 ... Domingo = 7
    const utcDay = today.getUTCDay()
    const isoDow = utcDay === 0 ? 7 : utcDay

    switch (presetId) {
        case 'semana_actual_vs_anterior': {
            const elapsedDays = isoDow - 1
            const inicioB = addDaysISO(todayStr, -elapsedDays)
            const finB = todayStr
            const inicioA = addDaysISO(inicioB, -7)
            const finA = addDaysISO(finB, -7)
            return {
                presetId,
                inicioA,
                finA,
                inicioB,
                finB,
                labelA: 'Semana Pasada (mismos días)',
                labelB: 'Esta Semana (acumulado)',
                description: `Compara ${elapsedDays + 1} día(s) transcurridos de esta semana contra los mismos días de la semana pasada.`
            }
        }
        case 'ultimos_7_vs_7': {
            const finB = todayStr
            const inicioB = addDaysISO(todayStr, -6)
            const finA = addDaysISO(inicioB, -1)
            const inicioA = addDaysISO(finA, -6)
            return {
                presetId,
                inicioA,
                finA,
                inicioB,
                finB,
                labelA: '7 días previos',
                labelB: 'Últimos 7 días',
                description: 'Ventana móvil de los últimos 7 días corridos contra los 7 días inmediatamente anteriores.'
            }
        }
        case 'ultimos_30_vs_30': {
            const finB = todayStr
            const inicioB = addDaysISO(todayStr, -29)
            const finA = addDaysISO(inicioB, -1)
            const inicioA = addDaysISO(finA, -29)
            return {
                presetId,
                inicioA,
                finA,
                inicioB,
                finB,
                labelA: '30 días previos',
                labelB: 'Últimos 30 días',
                description: 'Ventana móvil de 30 días contra los 30 días anteriores.'
            }
        }
        case 'mes_actual_vs_anterior': {
            const year = today.getUTCFullYear()
            const month = today.getUTCMonth()
            const dayOfMonth = today.getUTCDate()

            const inicioBDate = new Date(Date.UTC(year, month, 1, 12, 0, 0))
            const inicioB = formatISODate(inicioBDate)
            const finB = todayStr

            const prevMonthYear = month === 0 ? year - 1 : year
            const prevMonthIdx = month === 0 ? 11 : month - 1
            const lastDayPrevMonth = new Date(Date.UTC(prevMonthYear, prevMonthIdx + 1, 0, 12, 0, 0)).getUTCDate()
            const cappedDay = Math.min(dayOfMonth, lastDayPrevMonth)

            const inicioADate = new Date(Date.UTC(prevMonthYear, prevMonthIdx, 1, 12, 0, 0))
            const finADate = new Date(Date.UTC(prevMonthYear, prevMonthIdx, cappedDay, 12, 0, 0))

            return {
                presetId,
                inicioA: formatISODate(inicioADate),
                finA: formatISODate(finADate),
                inicioB,
                finB,
                labelA: 'Mes Anterior (igual tramo)',
                labelB: 'Mes Actual (acumulado)',
                description: `Compara del día 1 al ${dayOfMonth} del mes actual contra el mismo tramo del mes anterior.`
            }
        }
        case 'mismos_dias_semana': {
            const finB = todayStr
            const inicioB = addDaysISO(todayStr, -6)
            const finA = addDaysISO(finB, -28)
            const inicioA = addDaysISO(inicioB, -28)
            return {
                presetId,
                inicioA,
                finA,
                inicioB,
                finB,
                labelA: 'Misma semana (hace 4 sem.)',
                labelB: 'Últimos 7 días (L-D equiv.)',
                description: 'Compara exactamente los mismos 7 días de la semana contra la semana equivalente de hace 4 semanas.'
            }
        }
        default: {
            const finB = todayStr
            const inicioB = addDaysISO(todayStr, -6)
            const finA = addDaysISO(inicioB, -1)
            const inicioA = addDaysISO(finA, -6)
            return {
                presetId: 'personalizado',
                inicioA,
                finA,
                inicioB,
                finB,
                labelA: 'Período Base A',
                labelB: 'Período Comparado B',
                description: 'Comparación personalizada entre dos rangos de fechas.'
            }
        }
    }
}

export const PERIOD_PRESETS = [
    { id: 'semana_actual_vs_anterior', label: 'Esta semana vs pasada (igual días)' },
    { id: 'ultimos_7_vs_7', label: 'Últimos 7 vs 7 días' },
    { id: 'ultimos_30_vs_30', label: 'Últimos 30 vs 30 días' },
    { id: 'mes_actual_vs_anterior', label: 'Mes actual vs anterior (igual días)' },
    { id: 'mismos_dias_semana', label: 'Mismos días de semana (-4 sem)' },
    { id: 'personalizado', label: 'Rangos libres (A vs B)' }
]

/**
 * Normaliza la salida de fn_comparar_ventas_periodos_categorias.
 */
export const normalizeComparadorResponse = (raw) => {
    const data = raw && typeof raw === 'object' ? raw : {}
    const meta = data.meta || {}
    const kpis = data.kpis_globales || {}
    const desc = data.descomposicion_global || {}
    const rev = desc.revenue || {}
    const mar = desc.margin || {}
    const tc = desc.trafico_canasta || {}
    const cal = data.calidad_datos || {}

    return {
        meta: {
            inicio_a: meta.inicio_a || '',
            fin_a: meta.fin_a || '',
            dias_rango_a: toNum(meta.dias_rango_a, 1),
            dias_activos_a: toNum(meta.dias_activos_a, 0),
            inicio_b: meta.inicio_b || '',
            fin_b: meta.fin_b || '',
            dias_rango_b: toNum(meta.dias_rango_b, 1),
            dias_activos_b: toNum(meta.dias_activos_b, 0),
            filtro_categoria: meta.filtro_categoria ?? null,
            filtro_search: meta.filtro_search ?? null
        },
        kpis_globales: {
            facturacion_a: toNum(kpis.facturacion_a),
            facturacion_b: toNum(kpis.facturacion_b),
            delta_facturacion: toNum(kpis.delta_facturacion),
            delta_facturacion_pct: toNum(kpis.delta_facturacion_pct),
            ganancia_a: toNum(kpis.ganancia_a),
            ganancia_b: toNum(kpis.ganancia_b),
            delta_ganancia: toNum(kpis.delta_ganancia),
            delta_ganancia_pct: toNum(kpis.delta_ganancia_pct),
            margen_pct_a: toNum(kpis.margen_pct_a),
            margen_pct_b: toNum(kpis.margen_pct_b),
            delta_margen_pp: toNum(kpis.delta_margen_pp),
            tickets_a: toNum(kpis.tickets_a),
            tickets_b: toNum(kpis.tickets_b),
            delta_tickets: toNum(kpis.delta_tickets),
            delta_tickets_pct: toNum(kpis.delta_tickets_pct),
            unidades_a: toNum(kpis.unidades_a),
            unidades_b: toNum(kpis.unidades_b),
            delta_unidades: toNum(kpis.delta_unidades),
            delta_unidades_pct: toNum(kpis.delta_unidades_pct),
            ticket_promedio_a: toNum(kpis.ticket_promedio_a),
            ticket_promedio_b: toNum(kpis.ticket_promedio_b),
            delta_ticket_promedio: toNum(kpis.delta_ticket_promedio),
            delta_ticket_promedio_pct: toNum(kpis.delta_ticket_promedio_pct),
            unidades_por_ticket_a: toNum(kpis.unidades_por_ticket_a),
            unidades_por_ticket_b: toNum(kpis.unidades_por_ticket_b),
            delta_unidades_por_ticket: toNum(kpis.delta_unidades_por_ticket),
            precio_promedio_unidad_a: toNum(kpis.precio_promedio_unidad_a),
            precio_promedio_unidad_b: toNum(kpis.precio_promedio_unidad_b),
            delta_precio_promedio_pct: toNum(kpis.delta_precio_promedio_pct),
            promedio_diario_a: toNum(kpis.promedio_diario_a),
            promedio_diario_b: toNum(kpis.promedio_diario_b),
            delta_promedio_diario_pct: toNum(kpis.delta_promedio_diario_pct),
            clientes_unicos_a: toNum(kpis.clientes_unicos_a),
            clientes_unicos_b: toNum(kpis.clientes_unicos_b)
        },
        descomposicion_global: {
            revenue: {
                total_a: toNum(rev.total_a),
                total_b: toNum(rev.total_b),
                delta_total: toNum(rev.delta_total),
                delta_pct: toNum(rev.delta_pct),
                efecto_precio: toNum(rev.efecto_precio),
                efecto_volumen: toNum(rev.efecto_volumen),
                efecto_interaccion_mix: toNum(rev.efecto_interaccion_mix),
                efecto_nuevos_altas: toNum(rev.efecto_nuevos_altas),
                efecto_bajas_quiebres: toNum(rev.efecto_bajas_quiebres),
                efecto_mix: toNum(rev.efecto_mix)
            },
            margin: {
                total_a: toNum(mar.total_a),
                total_b: toNum(mar.total_b),
                delta_total: toNum(mar.delta_total),
                delta_pct: toNum(mar.delta_pct),
                efecto_margen_unitario: toNum(mar.efecto_margen_unitario),
                efecto_precio: toNum(mar.efecto_precio),
                efecto_costo: toNum(mar.efecto_costo),
                efecto_volumen: toNum(mar.efecto_volumen),
                efecto_interaccion_mix: toNum(mar.efecto_interaccion_mix),
                efecto_nuevos_altas: toNum(mar.efecto_nuevos_altas),
                efecto_bajas_quiebres: toNum(mar.efecto_bajas_quiebres),
                efecto_mix: toNum(mar.efecto_mix)
            },
            trafico_canasta: {
                tickets_a: toNum(tc.tickets_a),
                tickets_b: toNum(tc.tickets_b),
                delta_tickets: toNum(tc.delta_tickets),
                delta_tickets_pct: toNum(tc.delta_tickets_pct),
                ticket_promedio_a: toNum(tc.ticket_promedio_a),
                ticket_promedio_b: toNum(tc.ticket_promedio_b),
                unidades_por_ticket_a: toNum(tc.unidades_por_ticket_a),
                unidades_por_ticket_b: toNum(tc.unidades_por_ticket_b),
                efecto_trafico_pesos: toNum(tc.efecto_trafico_pesos),
                efecto_canasta_ticket_pesos: toNum(tc.efecto_canasta_ticket_pesos),
                causa_principal: tc.causa_principal || 'PRECIO'
            }
        },
        franjas_horarias: Array.isArray(data.franjas_horarias)
            ? data.franjas_horarias.map((f) => ({
                orden: toNum(f.orden),
                franja: f.franja || '',
                facturacion_a: toNum(f.facturacion_a),
                facturacion_b: toNum(f.facturacion_b),
                delta_facturacion: toNum(f.delta_facturacion),
                delta_facturacion_pct: toNum(f.delta_facturacion_pct),
                tickets_a: toNum(f.tickets_a),
                tickets_b: toNum(f.tickets_b),
                delta_tickets_pct: toNum(f.delta_tickets_pct),
                unidades_a: toNum(f.unidades_a),
                unidades_b: toNum(f.unidades_b)
            }))
            : [],
        dias_semana: Array.isArray(data.dias_semana)
            ? data.dias_semana.map((d) => ({
                dow: toNum(d.dow),
                dia_nombre: d.dia_nombre || '',
                facturacion_a: toNum(d.facturacion_a),
                facturacion_b: toNum(d.facturacion_b),
                delta_facturacion: toNum(d.delta_facturacion),
                delta_facturacion_pct: toNum(d.delta_facturacion_pct),
                tickets_a: toNum(d.tickets_a),
                tickets_b: toNum(d.tickets_b),
                unidades_a: toNum(d.unidades_a),
                unidades_b: toNum(d.unidades_b)
            }))
            : [],
        categorias: Array.isArray(data.categorias)
            ? data.categorias.map((c) => ({
                categoria: c.categoria || 'SIN_CATEGORIA',
                facturacion_a: toNum(c.facturacion_a),
                facturacion_b: toNum(c.facturacion_b),
                delta_facturacion: toNum(c.delta_facturacion),
                delta_facturacion_pct: toNum(c.delta_facturacion_pct),
                ganancia_a: toNum(c.ganancia_a),
                ganancia_b: toNum(c.ganancia_b),
                delta_ganancia: toNum(c.delta_ganancia),
                delta_ganancia_pct: toNum(c.delta_ganancia_pct),
                margen_pct_a: toNum(c.margen_pct_a),
                margen_pct_b: toNum(c.margen_pct_b),
                unidades_a: toNum(c.unidades_a),
                unidades_b: toNum(c.unidades_b),
                delta_unidades: toNum(c.delta_unidades),
                delta_unidades_pct: toNum(c.delta_unidades_pct),
                tickets_a: toNum(c.tickets_a),
                tickets_b: toNum(c.tickets_b),
                penetracion_pct_a: toNum(c.penetracion_pct_a),
                penetracion_pct_b: toNum(c.penetracion_pct_b),
                precio_promedio_a: toNum(c.precio_promedio_a),
                precio_promedio_b: toNum(c.precio_promedio_b),
                delta_precio_promedio_pct: toNum(c.delta_precio_promedio_pct),
                share_pct_a: toNum(c.share_pct_a),
                share_pct_b: toNum(c.share_pct_b),
                delta_share_pp: toNum(c.delta_share_pp),
                efecto_precio: toNum(c.efecto_precio),
                efecto_volumen: toNum(c.efecto_volumen),
                efecto_mix: toNum(c.efecto_mix),
                productos_activos_a: toNum(c.productos_activos_a),
                productos_activos_b: toNum(c.productos_activos_b)
            }))
            : [],
        calidad_datos: {
            items_precio_cero_a: toNum(cal.items_precio_cero_a),
            items_precio_cero_b: toNum(cal.items_precio_cero_b),
            productos_sin_categoria_a: toNum(cal.productos_sin_categoria_a),
            productos_sin_categoria_b: toNum(cal.productos_sin_categoria_b),
            productos_sin_costo_a: toNum(cal.productos_sin_costo_a),
            productos_sin_costo_b: toNum(cal.productos_sin_costo_b),
            descalces_pagos_a: toNum(cal.descalces_pagos_a),
            descalces_pagos_b: toNum(cal.descalces_pagos_b),
            dias_sin_ventas_a: toNum(cal.dias_sin_ventas_a),
            dias_sin_ventas_b: toNum(cal.dias_sin_ventas_b)
        }
    }
}

/**
 * Construye los pasos del gráfico Waterfall Dual-Lens (Facturación vs Ganancia Neta).
 * Colores estandarizados:
 * - Baseline A y Final B: slate-blue (#3b82f6)
 * - Efectos positivos: emerald (#10b981)
 * - Efectos negativos: rose (#f43f5e)
 */
export const buildWaterfallSteps = (descomposicionGlobal, lens = 'revenue') => {
    const source = lens === 'margin'
        ? (descomposicionGlobal?.margin || {})
        : (descomposicionGlobal?.revenue || {})

    const totalA = toNum(source.total_a)
    const totalB = toNum(source.total_b)
    const efectoPrecio = lens === 'margin'
        ? toNum(source.efecto_margen_unitario)
        : toNum(source.efecto_precio)
    const efectoVolumen = toNum(source.efecto_volumen)
    const efectoAltas = toNum(source.efecto_nuevos_altas)
    const efectoBajas = toNum(source.efecto_bajas_quiebres)
    // El efecto mix de interacción absorbe cualquier centavo de redondeo para cerrar exactamente en totalB
    const efectoMixInteraccion = Number(
        ((totalB - totalA) - (efectoPrecio + efectoVolumen + efectoAltas + efectoBajas)).toFixed(2)
    )

    const rawDeltas = [
        {
            id: 'efecto_precio',
            name: lens === 'margin' ? 'Efecto Precio/Costo' : 'Efecto Precio',
            delta: efectoPrecio,
            description: lens === 'margin'
                ? 'Variación por cambio de margen unitario (PV vs costo) en productos repetidos'
                : 'Variación por cambio de precio unitario en productos vendidos en ambos períodos'
        },
        {
            id: 'efecto_volumen',
            name: 'Efecto Volumen',
            delta: efectoVolumen,
            description: 'Variación por vender más o menos unidades de los mismos productos'
        },
        {
            id: 'efecto_mix',
            name: 'Efecto Mix',
            delta: efectoMixInteraccion,
            description: 'Interacción precio×volumen y desplazamiento entre productos caros/económicos'
        },
        {
            id: 'altas_b',
            name: 'Altas en B',
            delta: efectoAltas,
            description: 'Productos vendidos en Período B que no tuvieron ventas en Período A'
        },
        {
            id: 'discontinuados_a',
            name: 'Discontinuados de A',
            delta: efectoBajas,
            description: 'Productos vendidos en Período A que no registraron ventas en Período B'
        }
    ]

    let cursor = totalA
    const steps = [
        {
            id: 'periodo_a',
            name: 'Período Base A',
            isTotal: true,
            delta: totalA,
            start: 0,
            end: totalA,
            range: [0, totalA],
            fill: '#3b82f6',
            description: lens === 'margin' ? 'Ganancia bruta estimada en Período A' : 'Facturación total en Período A'
        }
    ]

    for (const step of rawDeltas) {
        const next = Number((cursor + step.delta).toFixed(2))
        const low = Math.min(cursor, next)
        const high = Math.max(cursor, next)
        steps.push({
            id: step.id,
            name: step.name,
            isTotal: false,
            delta: step.delta,
            start: cursor,
            end: next,
            range: [low, high],
            fill: step.delta >= 0 ? '#10b981' : '#f43f5e',
            description: step.description
        })
        cursor = next
    }

    steps.push({
        id: 'periodo_b',
        name: 'Período Comp. B',
        isTotal: true,
        delta: totalB,
        start: 0,
        end: totalB,
        range: [0, totalB],
        fill: '#6366f1',
        description: lens === 'margin' ? 'Ganancia bruta estimada en Período B' : 'Facturación total en Período B'
    })

    return steps
}

/**
 * Normaliza la salida de fn_comparar_precios_y_causas_categoria.
 */
export const normalizeCategoriaDrilldownResponse = (raw) => {
    const data = raw && typeof raw === 'object' ? raw : {}
    const meta = data.meta || {}
    const desc = data.descomposicion || {}

    return {
        meta: {
            inicio_a: meta.inicio_a || '',
            fin_a: meta.fin_a || '',
            inicio_b: meta.inicio_b || '',
            fin_b: meta.fin_b || '',
            categoria: meta.categoria ?? null,
            search: meta.search ?? null,
            total_productos: toNum(meta.total_productos)
        },
        descomposicion: {
            facturacion_a: toNum(desc.facturacion_a),
            facturacion_b: toNum(desc.facturacion_b),
            delta_facturacion: toNum(desc.delta_facturacion),
            delta_facturacion_pct: toNum(desc.delta_facturacion_pct),
            ganancia_a: toNum(desc.ganancia_a),
            ganancia_b: toNum(desc.ganancia_b),
            delta_ganancia: toNum(desc.delta_ganancia),
            unidades_a: toNum(desc.unidades_a),
            unidades_b: toNum(desc.unidades_b),
            delta_unidades: toNum(desc.delta_unidades),
            delta_unidades_pct: toNum(desc.delta_unidades_pct),
            efecto_precio: toNum(desc.efecto_precio),
            efecto_volumen: toNum(desc.efecto_volumen),
            efecto_nuevos_altas: toNum(desc.efecto_nuevos_altas),
            efecto_bajas_quiebres: toNum(desc.efecto_bajas_quiebres),
            efecto_mix: toNum(desc.efecto_mix)
        },
        productos: Array.isArray(data.productos)
            ? data.productos.map((p) => ({
                producto: p.producto || '',
                categoria: p.categoria || 'SIN_CATEGORIA',
                subcategoria: p.subcategoria || 'GENERAL',
                unidades_a: toNum(p.unidades_a),
                unidades_b: toNum(p.unidades_b),
                delta_unidades: toNum(p.delta_unidades),
                delta_unidades_pct: toNum(p.delta_unidades_pct),
                facturacion_a: toNum(p.facturacion_a),
                facturacion_b: toNum(p.facturacion_b),
                delta_facturacion: toNum(p.delta_facturacion),
                delta_facturacion_pct: toNum(p.delta_facturacion_pct),
                tickets_a: toNum(p.tickets_a),
                tickets_b: toNum(p.tickets_b),
                precio_prom_a: toNum(p.precio_prom_a),
                precio_prom_b: toNum(p.precio_prom_b),
                delta_precio_pct: toNum(p.delta_precio_pct),
                precio_min_a: toNum(p.precio_min_a),
                precio_max_a: toNum(p.precio_max_a),
                precio_ultimo_a: toNum(p.precio_ultimo_a),
                precio_min_b: toNum(p.precio_min_b),
                precio_max_b: toNum(p.precio_max_b),
                precio_ultimo_b: toNum(p.precio_ultimo_b),
                precio_lista_actual: toNum(p.precio_lista_actual),
                fecha_ultimo_aumento: p.fecha_ultimo_aumento || null,
                costo_unit_a: toNum(p.costo_unit_a),
                costo_unit_b: toNum(p.costo_unit_b),
                ultimo_costo_compra: toNum(p.ultimo_costo_compra),
                delta_costo_pct: toNum(p.delta_costo_pct),
                margen_unit_a: toNum(p.margen_unit_a),
                margen_unit_b: toNum(p.margen_unit_b),
                margen_pct_a: toNum(p.margen_pct_a),
                margen_pct_b: toNum(p.margen_pct_b),
                ganancia_a: toNum(p.ganancia_a),
                ganancia_b: toNum(p.ganancia_b),
                delta_ganancia: toNum(p.delta_ganancia),
                elasticidad_aparente: p.elasticidad_aparente === null || p.elasticidad_aparente === undefined
                    ? null
                    : toNum(p.elasticidad_aparente),
                elasticidad_etiqueta: p.elasticidad_etiqueta || 'SIN_CAMBIO_PRECIO',
                stock_actual: toNum(p.stock_actual),
                tuvo_quiebre_stock_b: Boolean(p.tuvo_quiebre_stock_b),
                efecto_precio: toNum(p.efecto_precio),
                efecto_volumen: toNum(p.efecto_volumen),
                efecto_mix: toNum(p.efecto_mix),
                estado_producto: p.estado_producto || 'ACTIVO_AMBOS'
            }))
            : []
    }
}

/**
 * Normaliza la salida de fn_tickets_drilldown_comparador.
 */
export const normalizeTicketsDrilldownResponse = (raw) => {
    const data = raw && typeof raw === 'object' ? raw : {}
    const meta = data.meta || {}
    const rawList = Array.isArray(data.tickets)
        ? data.tickets
        : Array.isArray(data.items)
            ? data.items
            : []

    const tickets = rawList.map((t) => ({
        venta_id: t.venta_id,
        fecha: t.fecha || '',
        nro_diario: t.nro_diario ?? null,
        cliente: t.cliente || 'Consumidor Final',
        total_venta: toNum(t.total_venta),
        notas: t.notas || '',
        subtotal_filtrado: toNum(t.subtotal_filtrado),
        unidades_filtradas: toNum(t.unidades_filtradas),
        items: Array.isArray(t.items)
            ? t.items.map((it) => ({
                id: it.id,
                producto: it.producto || '',
                categoria: it.categoria || 'SIN_CATEGORIA',
                cantidad: toNum(it.cantidad),
                precio_unitario: toNum(it.precio_unitario),
                subtotal: toNum(it.subtotal)
            }))
            : []
    }))

    return {
        meta: {
            inicio: meta.inicio || '',
            fin: meta.fin || '',
            categoria: meta.categoria ?? null,
            producto: meta.producto ?? null,
            limit: toNum(meta.limit, 50),
            total_tickets: toNum(meta.total_tickets, tickets.length)
        },
        total_tickets: toNum(data.total_tickets, tickets.length),
        tickets
    }
}

/**
 * Normaliza la salida de fn_radar_precios_ultimo_mes.
 */
export const normalizeRadarPreciosResponse = (raw) => {
    const data = raw && typeof raw === 'object' ? raw : {}
    const meta = data.meta || {}
    const res = data.resumen || {}

    return {
        meta: {
            dias: toNum(meta.dias, 30),
            fecha_desde: meta.fecha_desde || '',
            fecha_hasta: meta.fecha_hasta || '',
            modo: meta.modo || 'ambos',
            categoria: meta.categoria ?? null,
            search: meta.search ?? null,
            incluir_logistica_solicitado: Boolean(meta.incluir_logistica_solicitado),
            logistica_aplicada: Boolean(meta.logistica_aplicada)
        },
        resumen: {
            total_items: toNum(res.total_items),
            conteo_ambos: toNum(res.conteo_ambos),
            conteo_solo_compras: toNum(res.conteo_solo_compras),
            conteo_solo_ventas: toNum(res.conteo_solo_ventas),
            urgentes: toNum(res.urgentes),
            revisar: toNum(res.revisar),
            mantener: toNum(res.mantener),
            margen_promedio_pct: toNum(res.margen_promedio_pct),
            markup_promedio_pct: toNum(res.markup_promedio_pct),
            facturacion_ventana: toNum(res.facturacion_ventana),
            ganancia_mensual_estimada: toNum(res.ganancia_mensual_estimada),
            costo_logistico_prorrateado_total: toNum(res.costo_logistico_prorrateado_total)
        },
        categorias_disponibles: Array.isArray(data.categorias_disponibles)
            ? data.categorias_disponibles.filter(Boolean)
            : [],
        items: Array.isArray(data.items)
            ? data.items.map((it) => ({
                producto_id: it.producto_id ?? null,
                producto: it.producto || '',
                categoria: it.categoria || 'SIN_CATEGORIA',
                subcategoria: it.subcategoria || 'GENERAL',
                estado_actividad: it.estado_actividad || 'ambos',
                unidades_vendidas: toNum(it.unidades_vendidas),
                facturacion_ventana: toNum(it.facturacion_ventana),
                tickets_ventana: toNum(it.tickets_ventana),
                unidades_compradas: toNum(it.unidades_compradas),
                compras_ventana: toNum(it.compras_ventana),
                ultimo_costo_compra: toNum(it.ultimo_costo_compra),
                costo_compra_anterior: toNum(it.costo_compra_anterior),
                delta_costo_pct: toNum(it.delta_costo_pct),
                fecha_ultima_compra: it.fecha_ultima_compra || null,
                ultimo_proveedor: it.ultimo_proveedor || 'SIN DATOS',
                costo_logistico_unitario: toNum(it.costo_logistico_unitario),
                costo_real_unitario: toNum(it.costo_real_unitario),
                pv_lista: toNum(it.pv_lista),
                pv_promedio_cobrado: toNum(it.pv_promedio_cobrado),
                pv_actual: toNum(it.pv_actual),
                ganancia_unitaria: toNum(it.ganancia_unitaria),
                markup_pct: toNum(it.markup_pct),
                margen_pct: toNum(it.margen_pct),
                pv_sugerido_35: toNum(it.pv_sugerido_35),
                impacto_mensual: toNum(it.impacto_mensual),
                stock_actual: toNum(it.stock_actual),
                semaforo: it.semaforo || 'mantener',
                motivo_semaforo: it.motivo_semaforo || ''
            }))
            : []
    }
}

/**
 * Simulador interactivo de Precio de Venta (Pilar 2).
 * Soporta PV manual o cálculo desde Markup objetivo % con redondeo a múltiplos ($50, $100 o exacto).
 */
export const simularNuevoPrecioVenta = ({
    costoRealUnitario = 0,
    pvActual = 0,
    unidadesVendidas = 0,
    pvManual = null,
    markupObjetivoPct = 50,
    redondeoMultiplo = 50
} = {}) => {
    const costo = toNum(costoRealUnitario)
    const actual = toNum(pvActual)
    const unidades = toNum(unidadesVendidas)
    const multiplo = toNum(redondeoMultiplo, 50)

    let pvBase = actual
    if (pvManual !== null && pvManual !== undefined && pvManual !== '') {
        pvBase = Math.max(toNum(pvManual, actual), 0)
    } else if (costo > 0) {
        const rawTarget = costo * (1 + toNum(markupObjetivoPct, 50) / 100)
        pvBase = multiplo > 1 ? Math.ceil(rawTarget / multiplo) * multiplo : Math.round(rawTarget)
    }

    const gananciaUnitariaActual = actual - costo
    const gananciaUnitariaNueva = pvBase - costo
    const deltaGananciaUnitaria = gananciaUnitariaNueva - gananciaUnitariaActual
    const markupNuevoPct = costo > 0 ? Number((((pvBase - costo) / costo) * 100).toFixed(2)) : 0
    const margenNuevoPct = pvBase > 0 && costo > 0 ? Number((((pvBase - costo) / pvBase) * 100).toFixed(2)) : 0
    const impactoMensualActual = Number((unidades * gananciaUnitariaActual).toFixed(2))
    const impactoMensualNuevo = Number((unidades * gananciaUnitariaNueva).toFixed(2))
    const gananciaMensualAdicional = Number((impactoMensualNuevo - impactoMensualActual).toFixed(2))

    return {
        pvPropuesto: pvBase,
        gananciaUnitariaActual: Number(gananciaUnitariaActual.toFixed(2)),
        gananciaUnitariaNueva: Number(gananciaUnitariaNueva.toFixed(2)),
        deltaGananciaUnitaria: Number(deltaGananciaUnitaria.toFixed(2)),
        markupNuevoPct,
        margenNuevoPct,
        impactoMensualActual,
        impactoMensualNuevo,
        gananciaMensualAdicional
    }
}

const COMPARADOR_CACHE_TTL_MS = 60 * 1000
const MAX_CACHE_ENTRIES = 100
const comparadorCache = new Map()
const inFlightRequests = new Map()

export const clearComparadorCache = () => {
    comparadorCache.clear()
    inFlightRequests.clear()
}

const buildCacheKey = (fnName, args) => `${fnName}:${JSON.stringify(args)}`

const setCacheEntry = (key, value, ttlMs) => {
    if (comparadorCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = comparadorCache.keys().next().value
        if (oldestKey !== undefined) {
            comparadorCache.delete(oldestKey)
        }
    }
    comparadorCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
    })
}

const executeCachedRpc = async ({
    fnName,
    args,
    normalize,
    client = supabase,
    forceRefresh = false,
    ttlMs = COMPARADOR_CACHE_TTL_MS
}) => {
    if (client !== supabase) {
        const { data, error } = await client.rpc(fnName, args)
        if (error) {
            console.error(`Error en ${fnName}:`, error)
            throw error
        }
        return normalize(data)
    }

    const key = buildCacheKey(fnName, args)
    const now = Date.now()

    if (!forceRefresh) {
        const cached = comparadorCache.get(key)
        if (cached && cached.expiresAt > now) {
            return cached.value
        }
        if (cached) {
            comparadorCache.delete(key)
        }

        const pending = inFlightRequests.get(key)
        if (pending) {
            return pending
        }
    }

    const requestPromise = (async () => {
        const { data, error } = await client.rpc(fnName, args)
        if (error) {
            console.error(`Error en ${fnName}:`, error)
            throw error
        }
        const normalized = normalize(data)
        setCacheEntry(key, normalized, ttlMs)
        return normalized
    })().finally(() => {
        if (inFlightRequests.get(key) === requestPromise) {
            inFlightRequests.delete(key)
        }
    })

    inFlightRequests.set(key, requestPromise)
    return requestPromise
}

/**
 * RPC 1 (Pilar 1): Comparación global de períodos, descomposición Laspeyres, franjas, días y ranking de categorías.
 */
export const compararVentasPeriodosCategorias = async ({
    inicioA,
    finA,
    inicioB,
    finB,
    categoria = null,
    search = null,
    client = supabase,
    forceRefresh = false
}) => {
    const { p_categoria, p_search } = sanitizeComparadorFilters({ categoria, search })
    return executeCachedRpc({
        fnName: 'fn_comparar_ventas_periodos_categorias',
        args: {
            p_inicio_a: inicioA,
            p_fin_a: finA,
            p_inicio_b: inicioB,
            p_fin_b: finB,
            p_categoria,
            p_search
        },
        normalize: normalizeComparadorResponse,
        client,
        forceRefresh
    })
}

/**
 * RPC 2 (Pilar 1): Drill-down de productos, precios históricos, elasticidad y quiebres de stock dentro de una categoría.
 */
export const compararPreciosYCausasCategoria = async ({
    inicioA,
    finA,
    inicioB,
    finB,
    categoria = null,
    search = null,
    client = supabase,
    forceRefresh = false
}) => {
    const { p_categoria, p_search } = sanitizeComparadorFilters({ categoria, search })
    return executeCachedRpc({
        fnName: 'fn_comparar_precios_y_causas_categoria',
        args: {
            p_inicio_a: inicioA,
            p_fin_a: finA,
            p_inicio_b: inicioB,
            p_fin_b: finB,
            p_categoria,
            p_search
        },
        normalize: normalizeCategoriaDrilldownResponse,
        client,
        forceRefresh
    })
}

/**
 * RPC 3 (Pilar 1): Visor/Drawer de tickets reales filtrados por período, categoría y/o producto.
 */
export const getTicketsDrilldownComparador = async ({
    inicio,
    fin,
    categoria = null,
    producto = null,
    limit = 50,
    client = supabase,
    forceRefresh = false
}) => {
    const { p_categoria, p_search: p_producto } = sanitizeComparadorFilters({
        categoria,
        search: producto
    })
    return executeCachedRpc({
        fnName: 'fn_tickets_drilldown_comparador',
        args: {
            p_inicio: inicio,
            p_fin: fin,
            p_categoria,
            p_producto,
            p_limit: toNum(limit, 50)
        },
        normalize: normalizeTicketsDrilldownResponse,
        client,
        forceRefresh
    })
}

/**
 * RPC 4 (Pilar 2): Radar de Costo vs Precio de Venta del último mes con prorrateo logístico 1×día opcional.
 */
export const getRadarPreciosUltimoMes = async ({
    dias = 30,
    modo = 'ambos',
    categoria = null,
    search = null,
    incluirLogistica = true,
    client = supabase,
    forceRefresh = false
} = {}) => {
    const { p_categoria, p_search } = sanitizeComparadorFilters({ categoria, search })
    const safeModo = ['ambos', 'solo_compras', 'solo_ventas', 'todos'].includes(modo) ? modo : 'ambos'

    return executeCachedRpc({
        fnName: 'fn_radar_precios_ultimo_mes',
        args: {
            p_dias: toNum(dias, 30),
            p_modo: safeModo,
            p_categoria,
            p_search,
            p_incluir_logistica: Boolean(incluirLogistica)
        },
        normalize: normalizeRadarPreciosResponse,
        client,
        forceRefresh
    })
}
