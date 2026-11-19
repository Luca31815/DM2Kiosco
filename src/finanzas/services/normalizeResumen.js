import { toNumber } from '../utils/formatters.js'

/**
 * Normaliza la respuesta de fn_finanzas_resumen_mensual preservando 100% de las claves SQL
 * y garantizando valores seguros ante meses vacíos o recién inicializados.
 */
export function normalizeResumenMensual(raw, periodoYm) {
  const src = raw && typeof raw === 'object' ? raw : {}

  const config = {
    periodo_ym: src.config?.periodo_ym || periodoYm,
    sueldo_kiosco_objetivo: toNumber(src.config?.sueldo_kiosco_objetivo, 0),
    notas: src.config?.notas || '',
    ...src.config,
  }

  const kioscoRaw = src.kiosco_mes || {}
  const sueldoObj = toNumber(
    kioscoRaw.sueldo_kiosco_objetivo ?? config.sueldo_kiosco_objetivo,
    0
  )
  const gananciaMes = toNumber(kioscoRaw.ganancia_estimada_mes, 0)
  const kiosco_mes = {
    ventas_mes: toNumber(kioscoRaw.ventas_mes, 0),
    compras_mes: toNumber(kioscoRaw.compras_mes, 0),
    ganancia_estimada_mes: gananciaMes,
    retiros_mes: toNumber(kioscoRaw.retiros_mes, 0),
    proyeccion_cierre: toNumber(kioscoRaw.proyeccion_cierre, 0),
    sueldo_kiosco_objetivo: sueldoObj,
    cobertura_sueldo_pct:
      kioscoRaw.cobertura_sueldo_pct !== undefined && kioscoRaw.cobertura_sueldo_pct !== null
        ? toNumber(kioscoRaw.cobertura_sueldo_pct, 0)
        : sueldoObj > 0
          ? (gananciaMes / sueldoObj) * 100
          : 0,
    ...kioscoRaw,
  }

  const ingresosRaw = src.ingresos || {}
  const ingresos = {
    items: Array.isArray(ingresosRaw.items) ? ingresosRaw.items : [],
    plantillas: Array.isArray(ingresosRaw.plantillas) ? ingresosRaw.plantillas : [],
    total_esperado: toNumber(ingresosRaw.total_esperado, 0),
    total_cobrado: toNumber(ingresosRaw.total_cobrado, 0),
  }

  const gastosRaw = src.gastos || {}
  const gastos = {
    items: Array.isArray(gastosRaw.items) ? gastosRaw.items : [],
    plantillas: Array.isArray(gastosRaw.plantillas) ? gastosRaw.plantillas : [],
    total_recurrentes: toNumber(gastosRaw.total_recurrentes, 0),
    total_especificos: toNumber(gastosRaw.total_especificos, 0),
    total_pagado: toNumber(gastosRaw.total_pagado, 0),
    total_pendiente: toNumber(gastosRaw.total_pendiente, 0),
  }

  const logisticaRaw = src.logistica || {}
  const logistica = {
    periodo_ym: logisticaRaw.periodo_ym || periodoYm,
    reglas: Array.isArray(logisticaRaw.reglas) ? logisticaRaw.reglas : [],
    dias_mes: Array.isArray(logisticaRaw.dias_mes) ? logisticaRaw.dias_mes : [],
    total_mes: toNumber(logisticaRaw.total_mes, 0),
    total_dias_computados: toNumber(logisticaRaw.total_dias_computados, 0),
  }

  const deudasRaw = src.deudas || {}
  const deudas = {
    items: Array.isArray(deudasRaw.items) ? deudasRaw.items : [],
    pagos_mes: Array.isArray(deudasRaw.pagos_mes) ? deudasRaw.pagos_mes : [],
    total_cuotas_mes: toNumber(deudasRaw.total_cuotas_mes, 0),
    total_pagado_mes: toNumber(deudasRaw.total_pagado_mes, 0),
    saldo_total_pendiente: toNumber(deudasRaw.saldo_total_pendiente, 0),
  }

  const balRaw = src.totales_balance || {}
  const totales_balance = {
    ingresos_totales: toNumber(balRaw.ingresos_totales, 0),
    obligaciones_totales: toNumber(balRaw.obligaciones_totales, 0),
    pagado_actual: toNumber(balRaw.pagado_actual, 0),
    faltante_por_pagar: toNumber(balRaw.faltante_por_pagar, 0),
    balance_proyectado: toNumber(balRaw.balance_proyectado, 0),
    cobertura_pct: toNumber(balRaw.cobertura_pct, 0),
    ...balRaw,
  }

  const proximos_vencimientos = Array.isArray(src.proximos_vencimientos)
    ? src.proximos_vencimientos
    : []

  const historico_6m = Array.isArray(src.historico_6m) ? src.historico_6m : []

  return {
    periodo_ym: src.periodo_ym || periodoYm,
    config,
    kiosco_mes,
    ingresos,
    gastos,
    logistica,
    deudas,
    totales_balance,
    proximos_vencimientos,
    historico_6m,
  }
}
