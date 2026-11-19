import { FAMILIAS_CANONICAS } from '../../utils/triageClassifier'

export const formatCurrency = (val, compact = false) => {
    const n = Number(val) || 0
    if (compact && Math.abs(n) >= 1_000_000) {
        return `$${(n / 1_000_000).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}M`
    }
    if (compact && Math.abs(n) >= 10_000) {
        return `$${(n / 1_000).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`
    }
    return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const formatNumber = (val, decimals = 0) => {
    const n = Number(val) || 0
    return n.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}

export const formatPct = (val, includeSign = true, decimals = 1) => {
    const n = Number(val) || 0
    const sign = includeSign && n > 0 ? '+' : ''
    return `${sign}${n.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}%`
}

export const getDeltaColorClass = (val) => {
    const n = Number(val) || 0
    if (n > 0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
    if (n < 0) return 'text-rose-400 bg-rose-500/10 border-rose-500/25'
    return 'text-slate-400 bg-slate-800/60 border-slate-700/50'
}

export const getCategoryMeta = (categoriaName) => {
    const clean = String(categoriaName || 'SIN_CATEGORIA').trim().toUpperCase()
    const match = FAMILIAS_CANONICAS.find((f) => f.id.toUpperCase() === clean)
    if (match) {
        return {
            id: match.id,
            label: match.label,
            badgeColor: match.badgeColor,
            color: match.color
        }
    }
    return {
        id: clean,
        label: clean === 'SIN_CATEGORIA' ? 'Sin Categoría' : clean,
        badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
        color: '#64748b'
    }
}
