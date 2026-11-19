import test from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

const rpcCalls = []
globalThis.__MOCK_SUPABASE__ = {
    rpc: async (fnName, args) => {
        rpcCalls.push({ fnName, args })
        return {
            data: {
                meta: {
                    filtro_categoria: args.p_categoria ?? null,
                    filtro_search: args.p_search ?? null,
                    categoria: args.p_categoria ?? null,
                    search: args.p_search ?? null,
                    modo: args.p_modo ?? 'ambos',
                    dias: args.p_dias ?? 30
                },
                kpis_globales: {
                    facturacion_a: 100000,
                    facturacion_b: 125000
                },
                descomposicion_global: {
                    revenue: {
                        total_a: 100000,
                        total_b: 125000,
                        delta_total: 25000,
                        efecto_precio: 15000,
                        efecto_volumen: 8000,
                        efecto_interaccion_mix: 500,
                        efecto_nuevos_altas: 2500,
                        efecto_bajas_quiebres: -1000,
                        efecto_mix: 2000
                    },
                    margin: {
                        total_a: 30000,
                        total_b: 40000,
                        delta_total: 10000,
                        efecto_margen_unitario: 6000,
                        efecto_volumen: 3000,
                        efecto_nuevos_altas: 1500,
                        efecto_bajas_quiebres: -500,
                        efecto_mix: 1000
                    }
                },
                categorias: [],
                productos: [],
                tickets: [],
                items: []
            },
            error: null
        }
    }
}

const loaderSource = `
export async function resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('/lib/supabase') || specifier.endsWith('/lib/supabase.js')) {
        return {
            shortCircuit: true,
            url: 'data:text/javascript,export const supabase = globalThis.__MOCK_SUPABASE__;'
        };
    }
    return nextResolve(specifier, context);
}
`
register(`data:text/javascript,${encodeURIComponent(loaderSource)}`)

const {
    sanitizeComparadorFilters,
    computePeriodPreset,
    buildWaterfallSteps,
    simularNuevoPrecioVenta,
    compararVentasPeriodosCategorias,
    compararPreciosYCausasCategoria,
    getTicketsDrilldownComparador,
    getRadarPreciosUltimoMes
} = await import('../src/services/comparadorApi.js')

test('Matriz de 4 Cuadrantes: sanitizeComparadorFilters es 100% simétrica', () => {
    // Cuadrante 1: Ambos vacíos
    const q1 = sanitizeComparadorFilters({ categoria: '', search: '   ' })
    assert.equal(q1.p_categoria, null)
    assert.equal(q1.p_search, null)
    assert.equal(q1.quadrant, 'Q1_ALL_EMPTY')

    const q1All = sanitizeComparadorFilters({ categoria: 'TODAS', search: null })
    assert.equal(q1All.p_categoria, null)
    assert.equal(q1All.p_search, null)
    assert.equal(q1All.quadrant, 'Q1_ALL_EMPTY')

    // Cuadrante 2: Categoría activa + Búsqueda vacía
    const q2 = sanitizeComparadorFilters({ categoria: 'BEBIDAS', search: '' })
    assert.equal(q2.p_categoria, 'BEBIDAS')
    assert.equal(q2.p_search, null)
    assert.equal(q2.quadrant, 'Q2_ONLY_CAT')

    // Cuadrante 3: Categoría vacía + Búsqueda activa
    const q3 = sanitizeComparadorFilters({ categoria: 'TODOS', search: '  Coca Cola  ' })
    assert.equal(q3.p_categoria, null)
    assert.equal(q3.p_search, 'Coca Cola')
    assert.equal(q3.quadrant, 'Q3_ONLY_SEARCH')

    // Cuadrante 4: Categoría activa + Búsqueda activa
    const q4 = sanitizeComparadorFilters({ categoria: 'GOLOSINAS Y CHOCOLATES', search: 'Alfajor' })
    assert.equal(q4.p_categoria, 'GOLOSINAS Y CHOCOLATES')
    assert.equal(q4.p_search, 'Alfajor')
    assert.equal(q4.quadrant, 'Q4_CAT_AND_SEARCH')
})

test('Wrappers RPC Pilar 1 y Pilar 2 ejecutan los 4 cuadrantes sobre el mismo contrato RPC', async () => {
    const quadrants = [
        { categoria: null, search: null, expectedCat: null, expectedSearch: null },
        { categoria: 'BEBIDAS', search: '', expectedCat: 'BEBIDAS', expectedSearch: null },
        { categoria: 'TODAS', search: 'Marlboro', expectedCat: null, expectedSearch: 'Marlboro' },
        { categoria: 'CIGARRILLOS Y TABACO', search: 'Box', expectedCat: 'CIGARRILLOS Y TABACO', expectedSearch: 'Box' }
    ]

    for (const q of quadrants) {
        rpcCalls.length = 0

        await compararVentasPeriodosCategorias({
            inicioA: '2026-11-01',
            finA: '2026-11-07',
            inicioB: '2026-11-08',
            finB: '2026-11-14',
            categoria: q.categoria,
            search: q.search
        })
        assert.equal(rpcCalls[0].fnName, 'fn_comparar_ventas_periodos_categorias')
        assert.equal(rpcCalls[0].args.p_categoria, q.expectedCat)
        assert.equal(rpcCalls[0].args.p_search, q.expectedSearch)

        await compararPreciosYCausasCategoria({
            inicioA: '2026-11-01',
            finA: '2026-11-07',
            inicioB: '2026-11-08',
            finB: '2026-11-14',
            categoria: q.categoria,
            search: q.search
        })
        assert.equal(rpcCalls[1].fnName, 'fn_comparar_precios_y_causas_categoria')
        assert.equal(rpcCalls[1].args.p_categoria, q.expectedCat)
        assert.equal(rpcCalls[1].args.p_search, q.expectedSearch)

        await getTicketsDrilldownComparador({
            inicio: '2026-11-08',
            fin: '2026-11-14',
            categoria: q.categoria,
            producto: q.search,
            limit: 25
        })
        assert.equal(rpcCalls[2].fnName, 'fn_tickets_drilldown_comparador')
        assert.equal(rpcCalls[2].args.p_categoria, q.expectedCat)
        assert.equal(rpcCalls[2].args.p_producto, q.expectedSearch)

        await getRadarPreciosUltimoMes({
            dias: 30,
            modo: 'ambos',
            categoria: q.categoria,
            search: q.search,
            incluirLogistica: true
        })
        assert.equal(rpcCalls[3].fnName, 'fn_radar_precios_ultimo_mes')
        assert.equal(rpcCalls[3].args.p_categoria, q.expectedCat)
        assert.equal(rpcCalls[3].args.p_search, q.expectedSearch)
    }
})

test('Waterfall Dual-Lens cierra matemáticamente entre Período A y Período B', () => {
    const sampleDesc = {
        revenue: {
            total_a: 100000,
            total_b: 125000,
            efecto_precio: 15000,
            efecto_volumen: 8000,
            efecto_nuevos_altas: 2500,
            efecto_bajas_quiebres: -1000
        },
        margin: {
            total_a: 30000,
            total_b: 40000,
            efecto_margen_unitario: 6000,
            efecto_volumen: 3000,
            efecto_nuevos_altas: 1500,
            efecto_bajas_quiebres: -500
        }
    }

    const revSteps = buildWaterfallSteps(sampleDesc, 'revenue')
    assert.equal(revSteps.length, 7)
    const sumRevDeltas = revSteps.filter((s) => !s.isTotal).reduce((a, s) => a + s.delta, 0)
    assert.equal(100000 + sumRevDeltas, 125000)

    const marSteps = buildWaterfallSteps(sampleDesc, 'margin')
    assert.equal(marSteps.length, 7)
    const sumMarDeltas = marSteps.filter((s) => !s.isTotal).reduce((a, s) => a + s.delta, 0)
    assert.equal(30000 + sumMarDeltas, 40000)
})

test('Simulador de Nuevo PV y Presets de Período calculan redondeos y tramos equivalentes', () => {
    const sim50 = simularNuevoPrecioVenta({
        costoRealUnitario: 1020,
        pvActual: 1300,
        unidadesVendidas: 20,
        pvManual: null,
        markupObjetivoPct: 50,
        redondeoMultiplo: 50
    })
    // 1020 * 1.5 = 1530 -> redondeado a múltiplo de $50 superior = 1550
    assert.equal(sim50.pvPropuesto, 1550)
    assert.equal(sim50.gananciaUnitariaNueva, 530)
    assert.equal(sim50.gananciaMensualAdicional, (530 - 280) * 20)

    const presetSem = computePeriodPreset('semana_actual_vs_anterior', '2026-11-19')
    assert.equal(presetSem.inicioB, '2026-11-16')
    assert.equal(presetSem.finB, '2026-11-19')
    assert.equal(presetSem.inicioA, '2026-11-09')
    assert.equal(presetSem.finA, '2026-11-12')
})
