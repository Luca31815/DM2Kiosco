import React, { useState, useMemo } from 'react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    ReferenceLine,
    Legend
} from 'recharts'
import { BarChart3, Clock, CalendarDays, Users, ShoppingBag } from 'lucide-react'
import { buildWaterfallSteps } from '../../services/comparadorApi'
import { formatCurrency, formatNumber, formatPct } from './comparadorFormatters'

const WaterfallTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const item = payload[0]?.payload
    if (!item) return null

    return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1 max-w-xs">
            <div className="font-black text-white">{item.name}</div>
            <div className="text-slate-300">
                {item.isTotal ? 'Total: ' : 'Impacto: '}
                <strong className={item.isTotal ? 'text-blue-400' : item.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {!item.isTotal && item.delta > 0 ? '+' : ''}
                    {formatCurrency(item.delta)}
                </strong>
            </div>
            {!item.isTotal && (
                <div className="text-[11px] text-slate-400">
                    Acumulado: {formatCurrency(item.start)} → {formatCurrency(item.end)}
                </div>
            )}
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                {item.description}
            </div>
        </div>
    )
}

const PeriodCompareTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    const row = payload[0]?.payload
    if (!row) return null

    return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1">
            <div className="font-black text-white">{label}</div>
            <div className="text-slate-300">
                Período A: <strong>{formatCurrency(row.facturacion_a)}</strong> ({formatNumber(row.tickets_a)} tkts)
            </div>
            <div className="text-blue-300">
                Período B: <strong>{formatCurrency(row.facturacion_b)}</strong> ({formatNumber(row.tickets_b)} tkts)
            </div>
            <div className={row.delta_facturacion >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                Δ: {formatCurrency(row.delta_facturacion)} ({formatPct(row.delta_facturacion_pct)})
            </div>
        </div>
    )
}

const WATERFALL_MARGIN = { top: 12, right: 16, left: 8, bottom: 8 }
const COMPARE_MARGIN = { top: 8, right: 12, left: 4, bottom: 4 }
const WATERFALL_X_TICK = { fill: '#94a3b8', fontSize: 11, fontWeight: 600 }
const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 }
const WATERFALL_BAR_RADIUS = [6, 6, 6, 6]
const COMPARE_BAR_RADIUS = [4, 4, 0, 0]
const LEGEND_STYLE = { fontSize: 11 }
const yAxisCurrencyTickFormatter = (v) => formatCurrency(v, true)

const WaterfallDualLensSection = React.memo(({
    descomposicionGlobal,
    franjasHorarias,
    diasSemana
}) => {
    const [lens, setLens] = useState('revenue')

    const waterfallData = useMemo(
        () => buildWaterfallSteps(descomposicionGlobal, lens),
        [descomposicionGlobal, lens]
    )

    const deltaSteps = useMemo(() => {
        const list = []
        for (const s of waterfallData) {
            if (!s.isTotal) list.push(s)
        }
        return list
    }, [waterfallData])

    if (!descomposicionGlobal) return null
    const tc = descomposicionGlobal.trafico_canasta || {}
    const currentLensObj = lens === 'margin' ? descomposicionGlobal.margin : descomposicionGlobal.revenue

    return (
        <div className="space-y-4">
            {/* Bloque Superior: Waterfall Dual-Lens + Tráfico vs Canasta */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Waterfall Recharts (2 columnas) */}
                <div className="xl:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-400" />
                                <span>Puente Waterfall Laspeyres (A → B)</span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Descomposición exacta de la variación en Precio, Volumen, Mix, Altas y Discontinuados.
                            </p>
                        </div>

                        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start">
                            <button
                                type="button"
                                onClick={() => setLens('revenue')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    lens === 'revenue'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Facturación ($)
                            </button>
                            <button
                                type="button"
                                onClick={() => setLens('margin')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    lens === 'margin'
                                        ? 'bg-emerald-600 text-white shadow'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Ganancia Neta ($)
                            </button>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%" debounce={100}>
                            <BarChart data={waterfallData} margin={WATERFALL_MARGIN}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis
                                    dataKey="name"
                                    tick={WATERFALL_X_TICK}
                                    interval={0}
                                />
                                <YAxis
                                    tick={AXIS_TICK}
                                    tickFormatter={yAxisCurrencyTickFormatter}
                                />
                                <Tooltip content={<WaterfallTooltip />} />
                                <ReferenceLine y={0} stroke="#475569" />
                                <Bar dataKey="range" radius={WATERFALL_BAR_RADIUS} isAnimationActive={false}>
                                    {waterfallData.map((entry) => (
                                        <Cell key={entry.id} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Resumen numérico de las barras */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/5">
                        {deltaSteps.map((step) => (
                            <div key={step.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                    {step.name}
                                </span>
                                <span
                                    className={`text-xs font-black tabular-nums mt-0.5 block ${
                                        step.delta > 0
                                            ? 'text-emerald-400'
                                            : step.delta < 0
                                                ? 'text-rose-400'
                                                : 'text-slate-300'
                                    }`}
                                >
                                    {step.delta > 0 ? '+' : ''}
                                    {formatCurrency(step.delta)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bloque Visual: Tráfico (Gente) vs Canasta */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between gap-4">
                    <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-400" />
                            <span>Tráfico (Gente) vs Canasta</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            ¿Vino más/menos gente o gastaron distinto en cada visita?
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-indigo-400" />
                                    Efecto Tráfico (Cantidad de Tickets)
                                </span>
                                <span className={`text-xs font-black tabular-nums ${tc.efecto_trafico_pesos >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tc.efecto_trafico_pesos > 0 ? '+' : ''}
                                    {formatCurrency(tc.efecto_trafico_pesos)}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Tickets: <strong>{formatNumber(tc.tickets_a)}</strong> (A) →{' '}
                                <strong>{formatNumber(tc.tickets_b)}</strong> (B) ({formatPct(tc.delta_tickets_pct)})
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
                                    Efecto Canasta / Ticket Promedio
                                </span>
                                <span className={`text-xs font-black tabular-nums ${tc.efecto_canasta_ticket_pesos >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tc.efecto_canasta_ticket_pesos > 0 ? '+' : ''}
                                    {formatCurrency(tc.efecto_canasta_ticket_pesos)}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Ticket prom.: <strong>{formatCurrency(tc.ticket_promedio_a)}</strong> →{' '}
                                <strong>{formatCurrency(tc.ticket_promedio_b)}</strong> · Unidades/tkt:{' '}
                                <strong>{formatNumber(tc.unidades_por_ticket_a, 2)}</strong> →{' '}
                                <strong>{formatNumber(tc.unidades_por_ticket_b, 2)}</strong>
                            </p>
                        </div>

                        {lens === 'margin' && (
                            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-xs space-y-1">
                                <div className="font-bold text-emerald-300">Desglose Lente Ganancia:</div>
                                <div className="text-slate-300 flex justify-between">
                                    <span>Efecto Precio de Venta:</span>
                                    <strong>{formatCurrency(currentLensObj?.efecto_precio)}</strong>
                                </div>
                                <div className="text-slate-300 flex justify-between">
                                    <span>Efecto Variación de Costos:</span>
                                    <strong>{formatCurrency(currentLensObj?.efecto_costo)}</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] text-slate-300">
                        Balance Total ({lens === 'margin' ? 'Ganancia' : 'Facturación'}):{' '}
                        <strong>{formatCurrency(currentLensObj?.total_a)}</strong> →{' '}
                        <strong>{formatCurrency(currentLensObj?.total_b)}</strong> (
                        <span className={currentLensObj?.delta_total >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {formatPct(currentLensObj?.delta_pct)}
                        </span>
                        )
                    </div>
                </div>
            </div>

            {/* Gráficos A vs B por Franja Horaria y Día de Semana */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Clock className="h-4 w-4 text-cyan-400" />
                            <span>Comparativa por Franja Horaria (A vs B)</span>
                        </h4>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%" debounce={100}>
                            <BarChart data={franjasHorarias || []} margin={COMPARE_MARGIN}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="franja" tick={AXIS_TICK} />
                                <YAxis tick={AXIS_TICK} tickFormatter={yAxisCurrencyTickFormatter} />
                                <Tooltip content={<PeriodCompareTooltip />} />
                                <Legend wrapperStyle={LEGEND_STYLE} />
                                <Bar dataKey="facturacion_a" name="Período A" fill="#64748b" radius={COMPARE_BAR_RADIUS} isAnimationActive={false} />
                                <Bar dataKey="facturacion_b" name="Período B" fill="#3b82f6" radius={COMPARE_BAR_RADIUS} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-purple-400" />
                            <span>Comparativa por Día de la Semana (A vs B)</span>
                        </h4>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%" debounce={100}>
                            <BarChart data={diasSemana || []} margin={COMPARE_MARGIN}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="dia_nombre" tick={AXIS_TICK} />
                                <YAxis tick={AXIS_TICK} tickFormatter={yAxisCurrencyTickFormatter} />
                                <Tooltip content={<PeriodCompareTooltip />} />
                                <Legend wrapperStyle={LEGEND_STYLE} />
                                <Bar dataKey="facturacion_a" name="Período A" fill="#64748b" radius={COMPARE_BAR_RADIUS} isAnimationActive={false} />
                                <Bar dataKey="facturacion_b" name="Período B" fill="#6366f1" radius={COMPARE_BAR_RADIUS} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
})

WaterfallDualLensSection.displayName = 'WaterfallDualLensSection'

export default WaterfallDualLensSection
