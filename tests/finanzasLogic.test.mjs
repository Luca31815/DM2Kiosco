import test from 'node:test'
import assert from 'node:assert/strict'
import {
  shiftPeriodoYM,
  formatDateAR,
  formatPeriodoLabel,
  formatCompactARS,
  toNumber,
} from '../src/finanzas/utils/formatters.js'
import { normalizeResumenMensual } from '../src/finanzas/services/normalizeResumen.js'
import {
  filterGastosEspecificos,
  filterGastosRecurrentes,
  filterDeudas,
} from '../src/finanzas/utils/finanzasFilters.js'

test('formatters: shiftPeriodoYM handles year boundaries', () => {
  assert.equal(shiftPeriodoYM('2026-01', -1), '2025-12')
  assert.equal(shiftPeriodoYM('2026-12', 1), '2027-01')
  assert.equal(shiftPeriodoYM('2026-11', 0), '2026-11')
})

test('formatters: formatDateAR avoids UTC timezone shift', () => {
  assert.equal(formatDateAR('2026-11-19'), '19/11/2026')
  assert.equal(formatDateAR('2026-01-01T00:00:00Z'), '01/01/2026')
  assert.equal(formatDateAR(null), '—')
})

test('formatters: labels and compact ARS formatting', () => {
  assert.equal(formatPeriodoLabel('2026-11'), 'Noviembre 2026')
  assert.equal(formatCompactARS(1_250_000), '$1,3M')
  assert.equal(formatCompactARS(-45_000), '-$45k')
  assert.equal(toNumber(null, 0), 0)
  assert.equal(toNumber('4200.5'), 4200.5)
  assert.equal(toNumber(Number.NaN, 7), 7)
})

test('normalizeResumenMensual: safe defaults on empty payload', () => {
  const res = normalizeResumenMensual(null, '2026-11')
  assert.equal(res.periodo_ym, '2026-11')
  assert.equal(res.config.sueldo_kiosco_objetivo, 0)
  assert.equal(res.kiosco_mes.cobertura_sueldo_pct, 0)
  assert.deepEqual(res.ingresos.items, [])
  assert.deepEqual(res.gastos.items, [])
  assert.deepEqual(res.logistica.dias_mes, [])
  assert.deepEqual(res.deudas.items, [])
  assert.deepEqual(res.proximos_vencimientos, [])
  assert.deepEqual(res.historico_6m, [])
})

test('normalizeResumenMensual: preserves SQL payload keys and computes cobertura_sueldo_pct fallback', () => {
  const res = normalizeResumenMensual(
    {
      config: { periodo_ym: '2026-11', sueldo_kiosco_objetivo: 1000000, notas: 'Meta noviembre' },
      kiosco_mes: {
        ventas_mes: 5000000,
        compras_mes: 3500000,
        ganancia_estimada_mes: 800000,
        retiros_mes: 300000,
        proyeccion_cierre: 1200000,
      },
      totales_balance: {
        ingresos_totales: 1500000,
        obligaciones_totales: 1200000,
        pagado_actual: 700000,
        faltante_por_pagar: 500000,
        balance_proyectado: 300000,
        cobertura_pct: 125,
      },
    },
    '2026-11'
  )
  assert.equal(res.kiosco_mes.cobertura_sueldo_pct, 80)
  assert.equal(res.totales_balance.balance_proyectado, 300000)
  assert.equal(res.config.notas, 'Meta noviembre')
})

test('filterGastosEspecificos: 4-quadrant cross-filter matrix', () => {
  const dataset = [
    { id: 1, es_recurrente: true, nombre: 'Alquiler', ambito: 'kiosco_extra', categoria: 'Alquiler', notas: '' },
    { id: 2, es_recurrente: false, nombre: 'Arreglo heladera', ambito: 'kiosco_extra', categoria: 'Mantenimiento', notas: 'Técnico' },
    { id: 3, es_recurrente: false, nombre: 'Bolsas kiosco', ambito: 'kiosco_extra', categoria: 'Insumos', notas: '' },
    { id: 4, es_recurrente: false, nombre: 'Farmacia', ambito: 'personal', categoria: 'Salud', notas: 'Remedios' },
  ]

  // Q1: Filter active + search empty
  const q1 = filterGastosEspecificos(dataset, { ambito: 'kiosco_extra', categoria: 'todas', search: '' })
  assert.deepEqual(q1.map((x) => x.id), [2, 3])

  // Q2: Filter active + search active
  const q2 = filterGastosEspecificos(dataset, { ambito: 'kiosco_extra', categoria: 'Mantenimiento', search: 'heladera' })
  assert.deepEqual(q2.map((x) => x.id), [2])

  // Q3: Filter empty + search active
  const q3 = filterGastosEspecificos(dataset, { ambito: 'todos', categoria: 'todas', search: 'remedios' })
  assert.deepEqual(q3.map((x) => x.id), [4])

  // Q4: Both empty (still excludes recurrentes)
  const q4 = filterGastosEspecificos(dataset, { ambito: 'todos', categoria: 'todas', search: '' })
  assert.deepEqual(q4.map((x) => x.id), [2, 3, 4])
})

test('filterGastosRecurrentes and filterDeudas respect state & scope filters', () => {
  const gastos = [
    { id: 1, es_recurrente: true, ambito: 'personal', estado_pago: 'pagado' },
    { id: 2, es_recurrente: true, ambito: 'kiosco_extra', estado_pago: 'pendiente' },
    { id: 3, es_recurrente: false, ambito: 'personal', estado_pago: 'pendiente' },
  ]
  assert.deepEqual(
    filterGastosRecurrentes(gastos, { ambito: 'kiosco_extra', estado: 'pendiente' }).map((x) => x.id),
    [2]
  )

  const deudas = [
    { id: 10, estado: 'activa', ambito: 'personal' },
    { id: 11, estado: 'pagada', ambito: 'personal' },
    { id: 12, estado: 'activa', ambito: 'kiosco_extra' },
  ]
  assert.deepEqual(filterDeudas(deudas, { estado: 'activa', ambito: 'kiosco_extra' }).map((x) => x.id), [12])
  assert.deepEqual(filterDeudas(deudas, { estado: 'todas', ambito: 'todos' }).map((x) => x.id), [10, 11, 12])
})

test('normalizeResumenMensual: 1:1 alignment with Tanda 1 SQL fn_finanzas_resumen_mensual fields', () => {
  const sqlSample = {
    periodo_ym: '2026-11',
    config: { periodo_ym: '2026-11', sueldo_kiosco_objetivo: 900000, notas: null },
    kiosco_mes: {
      ventas_mes: 4200000,
      compras_mes: 2900000,
      ganancia_estimada_mes: 720000,
      retiros_mes: 250000,
      proyeccion_cierre: 1136842.11,
      sueldo_kiosco_objetivo: 900000,
      cobertura_sueldo_pct: 80,
    },
    ingresos: { items: [], plantillas: [], total_esperado: 600000, total_cobrado: 600000 },
    gastos: { items: [], plantillas: [], total_recurrentes: 500000, total_especificos: 80000, total_pagado: 300000, total_pendiente: 280000 },
    logistica: { periodo_ym: '2026-11', reglas: [], dias_mes: [], total_mes: 25500, total_dias_computados: 3 },
    deudas: { items: [], pagos_mes: [], total_cuotas_mes: 150000, total_pagado_mes: 150000, saldo_total_pendiente: 600000 },
    totales_balance: {
      ingresos_totales: 1500000,
      obligaciones_totales: 755500,
      pagado_actual: 475500,
      faltante_por_pagar: 280000,
      balance_proyectado: 744500,
      cobertura_pct: 198.54,
    },
    proximos_vencimientos: [
      { id: 1, origen: 'gasto', tipo: 'especifico', nombre: 'Reparación', monto: 80000, fecha_vencimiento: '2026-11-25' },
    ],
    historico_6m: [
      { periodo_ym: '2026-11', mes: '2026-11', ingresos_totales: 1500000, obligaciones_totales: 755500, balance_proyectado: 744500, ganancia_kiosco: 720000, gastos_totales: 580000 },
    ],
  }
  const normalized = normalizeResumenMensual(sqlSample, '2026-11')
  assert.equal(normalized.logistica.total_dias_computados, 3)
  assert.equal(normalized.deudas.total_pagado_mes, 150000)
  assert.equal(normalized.totales_balance.cobertura_pct, 198.54)
  assert.equal(normalized.proximos_vencimientos[0].tipo, 'especifico')
})
