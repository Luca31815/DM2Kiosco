import { getCurrentPeriodoYM, getTodayISOAR, toNumber } from './formatters.js'

let tramoSeq = 0

function nextTramoKey() {
  tramoSeq += 1
  return `tramo-${tramoSeq}`
}

const DEFAULT_DAYS_BY_COUNT = {
  2: [5, 20],
  3: [5, 15, 25],
  4: [5, 12, 19, 26],
  5: [1, 8, 15, 22, 28],
  6: [1, 6, 12, 18, 24, 29],
}

export function clampDayToMonth(periodoYm, day) {
  const safeYm = /^\d{4}-\d{2}$/.test(String(periodoYm || '').trim())
    ? String(periodoYm).trim()
    : getCurrentPeriodoYM()
  const [yearStr, monthStr] = safeYm.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const lastDay = new Date(year, month, 0).getDate()
  const rawDay = Math.trunc(Number(day) || 1)
  const clamped = Math.min(lastDay, Math.max(1, rawDay))
  return `${yearStr}-${monthStr}-${String(clamped).padStart(2, '0')}`
}

export function distributeTotalAcrossTramos(total, count) {
  const safeCount = Math.max(1, Math.trunc(Number(count) || 1))
  const numTotal = Math.max(0, toNumber(total, 0))

  if (Number.isInteger(numTotal)) {
    const base = Math.floor(numTotal / safeCount)
    const remainder = numTotal - base * safeCount
    return Array.from({ length: safeCount }, (_, idx) => base + (idx < remainder ? 1 : 0))
  }

  const totalCents = Math.round(numTotal * 100)
  const baseCents = Math.floor(totalCents / safeCount)
  const remainderCents = totalCents - baseCents * safeCount
  return Array.from(
    { length: safeCount },
    (_, idx) => (baseCents + (idx < remainderCents ? 1 : 0)) / 100
  )
}

export function createDefaultSplitTramos({
  total = 0,
  count = 2,
  mode = 'plantilla',
  periodoYm,
  baseDays,
  labels,
  todayISO,
} = {}) {
  const safeCount = Math.min(6, Math.max(2, Math.trunc(Number(count) || 2)))
  const safeYm = /^\d{4}-\d{2}$/.test(String(periodoYm || '').trim())
    ? String(periodoYm).trim()
    : getCurrentPeriodoYM()
  const safeToday = todayISO || getTodayISOAR()
  const fallbackDays = DEFAULT_DAYS_BY_COUNT[safeCount] || DEFAULT_DAYS_BY_COUNT[2]
  const daysList = Array.isArray(baseDays) && baseDays.length >= safeCount ? baseDays : fallbackDays

  const hasPositiveTotal = toNumber(total, 0) > 0
  const amounts = hasPositiveTotal
    ? distributeTotalAcrossTramos(total, safeCount)
    : Array.from({ length: safeCount }, () => 0)

  return Array.from({ length: safeCount }, (_, idx) => {
    const defaultLabel =
      safeCount === 2 ? (idx === 0 ? '1ra mitad' : '2da mitad') : `Tramo ${idx + 1}`
    const etiqueta =
      Array.isArray(labels) && labels[idx] ? String(labels[idx]) : defaultLabel
    const dia = Math.min(31, Math.max(1, Math.trunc(Number(daysList[idx]) || 1)))
    const fechaCobro = clampDayToMonth(safeYm, dia)

    const base = {
      key: nextTramoKey(),
      etiqueta,
      monto: hasPositiveTotal ? String(amounts[idx]) : '',
      dia_cobro: String(dia),
    }

    if (mode === 'puntual') {
      return {
        ...base,
        fecha_cobro: fechaCobro,
        cobrado: idx === 0 && fechaCobro <= safeToday,
      }
    }

    return base
  })
}

export function createNextTramo({ existingTramos = [], mode = 'plantilla', periodoYm } = {}) {
  const idx = existingTramos.length
  const last = existingTramos[idx - 1]
  const lastDay = parseInt(last?.dia_cobro, 10)
  const nextDia = Number.isInteger(lastDay) ? Math.min(28, lastDay + 7) : 25
  const safeYm = /^\d{4}-\d{2}$/.test(String(periodoYm || '').trim())
    ? String(periodoYm).trim()
    : getCurrentPeriodoYM()

  const base = {
    key: nextTramoKey(),
    etiqueta: `Tramo ${idx + 1}`,
    monto: '',
    dia_cobro: String(nextDia),
  }

  if (mode === 'puntual') {
    return {
      ...base,
      fecha_cobro: clampDayToMonth(safeYm, nextDia),
      cobrado: false,
    }
  }
  return base
}

export function validateSplitTramos(tramos, mode = 'plantilla') {
  if (!Array.isArray(tramos) || tramos.length < 2) {
    return {
      valid: false,
      totalDistribuido: 0,
      error: 'Definí al menos 2 tramos de cobro.',
    }
  }

  let sum = 0
  for (let i = 0; i < tramos.length; i += 1) {
    const t = tramos[i]
    const monto = toNumber(t?.monto, -1)
    if (!Number.isFinite(monto) || monto <= 0) {
      return {
        valid: false,
        totalDistribuido: 0,
        error: `El tramo #${i + 1} debe tener un monto mayor a 0.`,
      }
    }
    sum += monto

    if (mode === 'plantilla') {
      const dia = parseInt(t?.dia_cobro, 10)
      if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
        return {
          valid: false,
          totalDistribuido: 0,
          error: `El tramo #${i + 1} debe tener un día de cobro entre 1 y 31.`,
        }
      }
    } else if (mode === 'puntual') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(t?.fecha_cobro || '').trim())) {
        return {
          valid: false,
          totalDistribuido: 0,
          error: `El tramo #${i + 1} debe tener una fecha de cobro válida.`,
        }
      }
    }
  }

  return {
    valid: true,
    totalDistribuido: Math.round(sum * 100) / 100,
    error: null,
  }
}

export function buildPlantillaSplitPayloads(baseForm, tramos) {
  const baseNombre = String(baseForm?.nombre || '').trim()
  const tipo = baseForm?.tipo || 'sueldo_externo'
  const fuente = String(baseForm?.fuente || '').trim() || null
  const activo = baseForm?.activo !== false

  return (tramos || []).map((t, idx) => {
    const sufijo = String(t?.etiqueta || '').trim() || `${idx + 1}/${tramos.length}`
    const dia = Math.min(31, Math.max(1, parseInt(t?.dia_cobro, 10) || 1))
    return {
      nombre: `${baseNombre} (${sufijo})`,
      tipo,
      fuente,
      monto_base: toNumber(t?.monto, 0),
      dia_cobro: dia,
      activo,
    }
  })
}

export function buildPuntualSplitPayloads(baseForm, tramos, periodoYm) {
  const baseNombre = String(baseForm?.nombre || '').trim()
  const tipo = baseForm?.tipo || 'sueldo_externo'
  const fuente = String(baseForm?.fuente || '').trim() || null
  const notas = String(baseForm?.notas || '').trim() || null

  return (tramos || []).map((t, idx) => {
    const sufijo = String(t?.etiqueta || '').trim() || `${idx + 1}/${tramos.length}`
    const monto = toNumber(t?.monto, 0)
    const cobrado = Boolean(t?.cobrado)
    return {
      periodo_ym: periodoYm,
      plantilla_id: null,
      nombre: `${baseNombre} (${sufijo})`,
      tipo,
      fuente,
      monto_esperado: monto,
      monto_real: monto,
      cobrado,
      fecha_cobro: t?.fecha_cobro || null,
      notas,
    }
  })
}
