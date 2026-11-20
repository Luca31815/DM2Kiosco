import { getCurrentPeriodoYM, toNumber } from './formatters.js'

const DAILY_SUFFIX_REGEX = /^(.*?)\s*\(\$([\d.,]+)\/d[ií]a\s*[x×]\s*(\d{1,2})d\)\s*$/i

export function getDaysInPeriodoYM(periodoYm) {
  const safeYm = /^\d{4}-\d{2}$/.test(String(periodoYm || '').trim())
    ? String(periodoYm).trim()
    : getCurrentPeriodoYM()
  const [yearStr, monthStr] = safeYm.split('-')
  return new Date(Number(yearStr), Number(monthStr), 0).getDate()
}

export function clampDiasRecurrentes(dias, fallback = 30) {
  const n = Math.trunc(Number(dias) || fallback)
  return Math.min(31, Math.max(1, n))
}

export function calculateDailyMonthlyTotal(montoDiario, diasMes) {
  const diario = Math.max(0, toNumber(montoDiario, 0))
  const dias = clampDiasRecurrentes(diasMes, 30)
  return Math.round(diario * dias * 100) / 100
}

export function stripDailySuffix(nombre) {
  const raw = String(nombre || '').trim()
  const match = raw.match(DAILY_SUFFIX_REGEX)
  return match ? match[1].trim() : raw
}

export function formatDailyPlantillaNombre(baseNombre, montoDiario, diasMes) {
  const cleanBase = stripDailySuffix(baseNombre)
  const diarioNum = Math.round(Math.max(0, toNumber(montoDiario, 0)))
  const diasNum = clampDiasRecurrentes(diasMes, 30)
  const formattedMonto = diarioNum.toLocaleString('es-AR')
  return `${cleanBase} ($${formattedMonto}/día × ${diasNum}d)`
}

export function parseDailyPlantillaNombre(nombre, montoBase = 0) {
  const raw = String(nombre || '').trim()
  const match = raw.match(DAILY_SUFFIX_REGEX)
  if (!match) {
    return {
      isDaily: false,
      baseNombre: raw,
      montoDiario: 0,
      diasMes: 30,
    }
  }

  const baseNombre = match[1].trim()
  const parsedMonto = Number(String(match[2]).replace(/\./g, '').replace(',', '.'))
  const diasMes = clampDiasRecurrentes(match[3], 30)
  const fallbackDiario =
    diasMes > 0 && toNumber(montoBase, 0) > 0
      ? Math.round((toNumber(montoBase, 0) / diasMes) * 100) / 100
      : 0
  const montoDiario =
    Number.isFinite(parsedMonto) && parsedMonto > 0 ? parsedMonto : fallbackDiario

  return {
    isDaily: true,
    baseNombre,
    montoDiario,
    diasMes,
  }
}
