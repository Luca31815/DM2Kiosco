const arsFormatter0 = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const arsFormatter2 = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pctFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

let arPeriodoFormatter = null
let arDateFormatter = null

try {
  arPeriodoFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
  })
} catch {
  arPeriodoFormatter = null
}

try {
  arDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
} catch {
  arDateFormatter = null
}

const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function formatARS(value, decimals = false) {
  const n = toNumber(value, 0)
  return decimals ? arsFormatter2.format(n) : arsFormatter0.format(Math.round(n))
}

export function formatCompactARS(value) {
  const n = toNumber(value, 0)
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`
  return `${sign}$${Math.round(abs)}`
}

export function formatPercent(value) {
  return `${pctFormatter.format(toNumber(value, 0))}%`
}

export function getCurrentPeriodoYM() {
  if (arPeriodoFormatter) {
    try {
      const parts = arPeriodoFormatter.formatToParts(new Date())
      let year
      let month
      for (let i = 0; i < parts.length; i += 1) {
        const p = parts[i]
        if (p.type === 'year') year = p.value
        else if (p.type === 'month') month = p.value
      }
      if (year && month) return `${year}-${month}`
    } catch {
      // Fallback local
    }
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getTodayISOAR() {
  if (arDateFormatter) {
    try {
      const parts = arDateFormatter.formatToParts(new Date())
      let year
      let month
      let day
      for (let i = 0; i < parts.length; i += 1) {
        const p = parts[i]
        if (p.type === 'year') year = p.value
        else if (p.type === 'month') month = p.value
        else if (p.type === 'day') day = p.value
      }
      if (year && month && day) return `${year}-${month}-${day}`
    } catch {
      // Fallback local
    }
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function shiftPeriodoYM(periodoYm, deltaMonths) {
  const [yStr, mStr] = String(periodoYm || getCurrentPeriodoYM()).split('-')
  const year = Number(yStr)
  const monthIdx = Number(mStr) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx)) return getCurrentPeriodoYM()
  const d = new Date(year, monthIdx + deltaMonths, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatPeriodoLabel(periodoYm) {
  const [yStr, mStr] = String(periodoYm || '').split('-')
  const monthIdx = Number(mStr) - 1
  if (!yStr || monthIdx < 0 || monthIdx > 11) return periodoYm || ''
  return `${MESES_ES[monthIdx]} ${yStr}`
}

export function formatPeriodoShort(periodoYm) {
  const [yStr, mStr] = String(periodoYm || '').split('-')
  const monthIdx = Number(mStr) - 1
  if (!yStr || monthIdx < 0 || monthIdx > 11) return periodoYm || ''
  return `${MESES_CORTOS[monthIdx]} ${yStr.slice(-2)}`
}

export function formatDateAR(dateStr) {
  if (!dateStr) return '—'
  const clean = String(dateStr).slice(0, 10)
  const parts = clean.split('-')
  if (parts.length !== 3) return clean
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function diffDaysFromToday(dateStr) {
  if (!dateStr) return null
  const today = getTodayISOAR()
  const [ty, tm, td] = today.split('-').map(Number)
  const [dy, dm, dd] = String(dateStr).slice(0, 10).split('-').map(Number)
  if (!dy || !dm || !dd) return null
  const tUtc = Date.UTC(ty, tm - 1, td)
  const dUtc = Date.UTC(dy, dm - 1, dd)
  return Math.round((dUtc - tUtc) / 86_400_000)
}

export function getKioscoUrl() {
  const raw = (import.meta.env?.VITE_KIOSCO_URL || '').trim()
  return raw || '/'
}
