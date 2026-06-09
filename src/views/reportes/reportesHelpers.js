// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE FECHA Y FORMATO
// Extraído de ReportesView para reutilización entre subcomponentes.
// ─────────────────────────────────────────────────────────────────────────────

/** Nombres de mes en español (1-indexed) */
export const MES_NAMES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/** Convierte una fila mensual en fecha ISO para queries (primer día del mes) */
export const getMonthStartDate = (mes, anio) => {
    const m = String(mes).padStart(2, '0')
    return `${anio}-${m}-01`
}

/** Convierte una fila mensual en fecha ISO del último día del mes */
export const getMonthEndDate = (mes, anio) => {
    const lastDay = new Date(Number(anio), Number(mes), 0).getDate()
    const m = String(mes).padStart(2, '0')
    return `${anio}-${m}-${String(lastDay).padStart(2, '0')}`
}

/** Formatea un valor de fecha a DD/MM/YYYY */
export const formatDate = (val) => {
    if (!val) return ''
    const [y, m, d] = val.split('-')
    return `${d}/${m}/${y}`
}

/** Devuelve el nombre legible del periodo según el tipo y la fila */
export const getPeriodName = (item, type) => {
    if (type === 'diario') return formatDate(item.fecha)
    if (type === 'semanal') return `Semana del ${formatDate(item.semana_del)}`
    if (type === 'mensual') return `${MES_NAMES[Number(item.mes)] || item.mes} ${item.anio}`
    return ''
}

/** Devuelve el rango de fechas de la query del periodo para `useReporteVentasPeriodico` */
export const getPeriodDateRange = (item, type) => {
    if (type === 'diario') return { start: item.fecha, end: item.fecha }
    if (type === 'semanal') {
        const start = item.semana_del
        const startDate = new Date(start)
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        const end = endDate.toISOString().split('T')[0]
        return { start, end }
    }
    if (type === 'mensual') {
        return {
            start: getMonthStartDate(item.mes, item.anio),
            end: getMonthEndDate(item.mes, item.anio)
        }
    }
    return { start: '', end: '' }
}

/** Cantidad de días en el periodo (para calcular promedio diario) */
export const getPeriodDays = (type) => {
    if (type === 'diario') return 1
    if (type === 'semanal') return 7
    if (type === 'mensual') return 30
    return 1
}
