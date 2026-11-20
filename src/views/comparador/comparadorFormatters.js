import { FAMILIAS_CANONICAS } from '../../utils/familiasCatalog'

const intFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
})
const compactMFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
})
const compactKFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
})
const dec1Formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
})
const dec2Formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})

const getDecimalFormatter = (decimals) => {
    if (decimals === 0) return intFormatter
    if (decimals === 1) return dec1Formatter
    if (decimals === 2) return dec2Formatter
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}

const FAMILIAS_MAP = new Map(
    FAMILIAS_CANONICAS.map((f) => [
        f.id.toUpperCase(),
        {
            id: f.id,
            label: f.label,
            badgeColor: f.badgeColor,
            color: f.color
        }
    ])
)

export const formatCurrency = (val, compact = false) => {
    const n = Number(val) || 0
    if (compact && Math.abs(n) >= 1_000_000) {
        return `$${compactMFormatter.format(n / 1_000_000)}M`
    }
    if (compact && Math.abs(n) >= 10_000) {
        return `$${compactKFormatter.format(n / 1_000)}k`
    }
    return `$${intFormatter.format(n)}`
}

export const formatNumber = (val, decimals = 0) => {
    const n = Number(val) || 0
    return getDecimalFormatter(decimals).format(n)
}

export const formatPct = (val, includeSign = true, decimals = 1) => {
    const n = Number(val) || 0
    const sign = includeSign && n > 0 ? '+' : ''
    return `${sign}${getDecimalFormatter(decimals).format(n)}%`
}

export const getDeltaColorClass = (val) => {
    const n = Number(val) || 0
    if (n > 0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
    if (n < 0) return 'text-rose-400 bg-rose-500/10 border-rose-500/25'
    return 'text-slate-400 bg-slate-800/60 border-slate-700/50'
}

export const getCategoryMeta = (categoriaName) => {
    const clean = String(categoriaName || 'SIN_CATEGORIA').trim().toUpperCase()
    const match = FAMILIAS_MAP.get(clean)
    if (match) return match
    return {
        id: clean,
        label: clean === 'SIN_CATEGORIA' ? 'Sin Categoría' : clean,
        badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
        color: '#64748b'
    }
}
