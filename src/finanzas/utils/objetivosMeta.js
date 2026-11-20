import { toNumber } from './formatters.js'

let objSeq = 0

export const OBJETIVO_TIPOS = [
  {
    value: 'sueldo_kiosco',
    label: 'Sueldo / Retiro Kiosco (Ventas − Compras)',
    shortLabel: 'Sueldo Kiosco',
    description: 'Mide cuánto te queda de caja real en el kiosco (Ventas − Compras) frente a tu meta de sueldo o retiro.',
    placeholder: 'Ej: Sueldo de Luca',
    inverse: false,
    isManual: false,
  },
  {
    value: 'ventas_kiosco',
    label: 'Facturación / Ventas del Kiosco',
    shortLabel: 'Ventas Kiosco',
    description: 'Compara el total facturado en ventas del kiosco este mes contra el objetivo de facturación.',
    placeholder: 'Ej: Meta de ventas noviembre',
    inverse: false,
    isManual: false,
  },
  {
    value: 'margen_kiosco',
    label: 'Margen sobre productos vendidos',
    shortLabel: 'Margen Kiosco',
    description: 'Sigue la ganancia bruta de la mercadería efectivamente vendida (referencia sin contar compras de stock).',
    placeholder: 'Ej: Margen bruto mensual',
    inverse: false,
    isManual: false,
  },
  {
    value: 'superavit_mes',
    label: 'Ahorro / Balance proyectado del mes',
    shortLabel: 'Ahorro del mes',
    description: 'Mide el Balance Proyectado de Finanzas (Ingresos externos menos gastos, logística y cuotas de deudas).',
    placeholder: 'Ej: Ahorro libre objetivo',
    inverse: false,
    isManual: false,
  },
  {
    value: 'tope_gastos',
    label: 'Tope máximo de gastos del mes',
    shortLabel: 'Tope gastos',
    description: 'Controla no pasarte de un presupuesto máximo sumando gastos recurrentes, específicos, logística y cuotas.',
    placeholder: 'Ej: No gastar más de $950k',
    inverse: true,
    isManual: false,
  },
  {
    value: 'ahorro_manual',
    label: 'Fondo / Objetivo de ahorro propio (manual)',
    shortLabel: 'Fondo propio',
    description: 'Alcancia o meta específica (vacaciones, arreglo, fondo de emergencia, equipamiento) con botón "+ Aporte".',
    placeholder: 'Ej: Fondo de emergencia / Heladera nueva',
    inverse: false,
    isManual: true,
  },
]

const TIPO_MAP = new Map(OBJETIVO_TIPOS.map((item) => [item.value, item]))

export function createObjetivoId() {
  objSeq += 1
  return `obj-${Date.now()}-${objSeq}`
}

export function getTipoObjetivoMeta(tipo) {
  return TIPO_MAP.get(String(tipo || '').trim()) || TIPO_MAP.get('ahorro_manual')
}

export function resolveObjetivosList(config) {
  const rawList = Array.isArray(config?.objetivos) ? config.objetivos : []
  if (rawList.length > 0) {
    return rawList.map((item, idx) => {
      const meta = getTipoObjetivoMeta(item?.tipo)
      return {
        id: String(item?.id || `obj-item-${idx + 1}`),
        nombre: String(item?.nombre || meta.shortLabel).trim(),
        tipo: meta.value,
        monto_objetivo: Math.max(0, toNumber(item?.monto_objetivo, 0)),
        monto_actual_manual: Math.max(0, toNumber(item?.monto_actual_manual, 0)),
        notas: String(item?.notas || '').trim(),
      }
    })
  }

  const legacySueldo = Math.max(0, toNumber(config?.sueldo_kiosco_objetivo, 0))
  if (legacySueldo > 0) {
    return [
      {
        id: 'obj-sueldo-kiosco-inicial',
        nombre: String(config?.notas || '').trim() || 'Sueldo Kiosco',
        tipo: 'sueldo_kiosco',
        monto_objetivo: legacySueldo,
        monto_actual_manual: 0,
        notas: '',
      },
    ]
  }

  return []
}

export function computeSueldoKioscoFromObjetivos(objetivos) {
  if (!Array.isArray(objetivos) || objetivos.length === 0) return 0
  let total = 0
  for (let i = 0; i < objetivos.length; i += 1) {
    const obj = objetivos[i]
    if (String(obj?.tipo || '') === 'sueldo_kiosco') {
      total += Math.max(0, toNumber(obj?.monto_objetivo, 0))
    }
  }
  return Math.round(total * 100) / 100
}

export function evaluateObjetivoProgress(objetivo, resumen) {
  const meta = getTipoObjetivoMeta(objetivo?.tipo)
  const kiosco = resumen?.kiosco_mes || {}
  const balance = resumen?.totales_balance || {}
  const objetivoMonto = Math.max(0, toNumber(objetivo?.monto_objetivo, 0))

  let actual = 0
  let metricHint = meta.shortLabel

  if (meta.value === 'sueldo_kiosco') {
    actual = toNumber(
      kiosco.neto_caja_mes,
      toNumber(kiosco.ventas_mes, 0) - toNumber(kiosco.compras_mes, 0)
    )
    metricHint = 'Medido sobre Ventas − Compras del kiosco'
  } else if (meta.value === 'ventas_kiosco') {
    actual = toNumber(kiosco.ventas_mes, 0)
    metricHint = 'Medido sobre facturación del kiosco'
  } else if (meta.value === 'margen_kiosco') {
    actual = toNumber(kiosco.ganancia_estimada_mes, 0)
    metricHint = 'Medido sobre margen de productos vendidos'
  } else if (meta.value === 'superavit_mes') {
    actual = toNumber(balance.balance_proyectado, 0)
    metricHint = 'Medido sobre el Balance Proyectado del mes'
  } else if (meta.value === 'tope_gastos') {
    actual = Math.max(0, toNumber(balance.obligaciones_totales, 0))
    metricHint = 'Medido sobre el total de obligaciones del mes'
  } else {
    actual = Math.max(0, toNumber(objetivo?.monto_actual_manual, 0))
    metricHint = 'Seguimiento manual con aportes'
  }

  actual = Math.round(actual * 100) / 100

  if (meta.inverse) {
    const rawPct =
      objetivoMonto > 0
        ? Math.round((Math.max(0, actual) / objetivoMonto) * 10000) / 100
        : actual > 0
          ? 100
          : 0
    const excedido = objetivoMonto > 0 ? actual > objetivoMonto : actual > 0
    const cumplido = !excedido && objetivoMonto > 0
    const faltante = excedido
      ? Math.round((actual - objetivoMonto) * 100) / 100
      : Math.max(0, Math.round((objetivoMonto - actual) * 100) / 100)

    let tone = 'positive'
    let statusLabel = 'Dentro del tope'
    if (excedido) {
      tone = 'danger'
      statusLabel = 'Excedido'
    } else if (rawPct >= 80) {
      tone = 'warning'
      statusLabel = 'Cerca del tope'
    }

    return {
      actual,
      objetivoMonto,
      pct: Math.max(0, rawPct),
      cumplido,
      excedido,
      faltante,
      tone,
      statusLabel,
      metricHint,
    }
  }

  const pct =
    objetivoMonto > 0
      ? Math.max(0, Math.round((actual / objetivoMonto) * 10000) / 100)
      : 0
  const cumplido = objetivoMonto > 0 && actual >= objetivoMonto
  const faltante = Math.max(0, Math.round((objetivoMonto - actual) * 100) / 100)

  let tone = 'warning'
  let statusLabel = 'En curso'
  if (cumplido) {
    tone = 'positive'
    statusLabel = 'Cumplida'
  } else if (actual < 0) {
    tone = 'danger'
    statusLabel = 'En negativo'
  } else if (pct >= 60) {
    tone = 'info'
  }

  return {
    actual,
    objetivoMonto,
    pct,
    cumplido,
    excedido: false,
    faltante,
    tone,
    statusLabel,
    metricHint,
  }
}
