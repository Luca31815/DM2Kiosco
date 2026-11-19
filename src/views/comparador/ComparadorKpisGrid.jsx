import React from 'react'
import { DollarSign, TrendingUp, Users, ShoppingBag, Receipt, UserCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatNumber, formatPct, getDeltaColorClass } from './comparadorFormatters'

const ComparadorKpisGrid = ({ kpis, meta, normalizeByActiveDay }) => {
    if (!kpis) return null

    const divA = normalizeByActiveDay ? Math.max(meta?.dias_activos_a || 1, 1) : 1
    const divB = normalizeByActiveDay ? Math.max(meta?.dias_activos_b || 1, 1) : 1
    const modeSuffix = normalizeByActiveDay ? ' / día activo' : ''

    const factA = kpis.facturacion_a / divA
    const factB = kpis.facturacion_b / divB
    const deltaFactPct = factA > 0 ? ((factB - factA) / factA) * 100 : 0

    const ganA = kpis.ganancia_a / divA
    const ganB = kpis.ganancia_b / divB
    const deltaGanPct = ganA > 0 ? ((ganB - ganA) / ganA) * 100 : 0

    const tktA = kpis.tickets_a / divA
    const tktB = kpis.tickets_b / divB
    const deltaTktPct = tktA > 0 ? ((tktB - tktA) / tktA) * 100 : 0

    const cards = [
        {
            id: 'facturacion',
            title: `Facturación${modeSuffix}`,
            icon: DollarSign,
            accent: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
            valA: formatCurrency(factA),
            valB: formatCurrency(factB),
            deltaLabel: formatPct(deltaFactPct),
            deltaRaw: deltaFactPct,
            subtext: `Δ ${formatCurrency(factB - factA)} (${formatCurrency(kpis.promedio_diario_b)}/día en B)`
        },
        {
            id: 'ganancia',
            title: `Ganancia & Margen${modeSuffix}`,
            icon: TrendingUp,
            accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
            valA: `${formatCurrency(ganA)} (${formatNumber(kpis.margen_pct_a, 1)}%)`,
            valB: `${formatCurrency(ganB)} (${formatNumber(kpis.margen_pct_b, 1)}%)`,
            deltaLabel: formatPct(deltaGanPct),
            deltaRaw: deltaGanPct,
            subtext: `Margen B vs A: ${kpis.delta_margen_pp >= 0 ? '+' : ''}${formatNumber(kpis.delta_margen_pp, 2)} pp`
        },
        {
            id: 'tickets',
            title: `Tickets / Gente${modeSuffix}`,
            icon: Users,
            accent: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
            valA: formatNumber(tktA, normalizeByActiveDay ? 1 : 0),
            valB: formatNumber(tktB, normalizeByActiveDay ? 1 : 0),
            deltaLabel: formatPct(deltaTktPct),
            deltaRaw: deltaTktPct,
            subtext: `Diferencia: ${tktB - tktA >= 0 ? '+' : ''}${formatNumber(tktB - tktA, normalizeByActiveDay ? 1 : 0)} operaciones`
        },
        {
            id: 'canasta',
            title: 'Unidades / Ticket (Canasta)',
            icon: ShoppingBag,
            accent: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
            valA: `${formatNumber(kpis.unidades_por_ticket_a, 2)} u/tkt`,
            valB: `${formatNumber(kpis.unidades_por_ticket_b, 2)} u/tkt`,
            deltaLabel: `${kpis.delta_unidades_por_ticket >= 0 ? '+' : ''}${formatNumber(kpis.delta_unidades_por_ticket, 2)} u`,
            deltaRaw: kpis.delta_unidades_por_ticket,
            subtext: `Unidades totales: ${formatNumber(kpis.unidades_a)} (A) vs ${formatNumber(kpis.unidades_b)} (B)`
        },
        {
            id: 'ticket_promedio',
            title: 'Ticket Promedio',
            icon: Receipt,
            accent: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
            valA: formatCurrency(kpis.ticket_promedio_a),
            valB: formatCurrency(kpis.ticket_promedio_b),
            deltaLabel: formatPct(kpis.delta_ticket_promedio_pct),
            deltaRaw: kpis.delta_ticket_promedio_pct,
            subtext: `PV prom/unidad: ${formatCurrency(kpis.precio_promedio_unidad_a)} (A) → ${formatCurrency(kpis.precio_promedio_unidad_b)} (B)`
        },
        {
            id: 'clientes',
            title: 'Clientes Identificados',
            icon: UserCheck,
            accent: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
            valA: `${formatNumber(kpis.clientes_unicos_a)} únicos`,
            valB: `${formatNumber(kpis.clientes_unicos_b)} únicos`,
            deltaLabel: `${kpis.clientes_unicos_b - kpis.clientes_unicos_a >= 0 ? '+' : ''}${kpis.clientes_unicos_b - kpis.clientes_unicos_a}`,
            deltaRaw: kpis.clientes_unicos_b - kpis.clientes_unicos_a,
            subtext: `Δ Precio unitario ponderado: ${formatPct(kpis.delta_precio_promedio_pct)}`
        }
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((card) => {
                const Icon = card.icon
                const isPositive = card.deltaRaw >= 0
                return (
                    <div
                        key={card.id}
                        className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col justify-between gap-3"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl border ${card.accent}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                    {card.title}
                                </span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border tabular-nums ${getDeltaColorClass(card.deltaRaw)}`}>
                                {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                {card.deltaLabel}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Período Base A
                                </span>
                                <span className="text-sm md:text-base font-black text-slate-200 tabular-nums mt-0.5 block">
                                    {card.valA}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-950/25 border border-blue-500/25">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                                    Período Comp. B
                                </span>
                                <span className="text-sm md:text-base font-black text-white tabular-nums mt-0.5 block">
                                    {card.valB}
                                </span>
                            </div>
                        </div>

                        <div className="text-[11px] font-medium text-slate-400 border-t border-white/5 pt-2">
                            {card.subtext}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ComparadorKpisGrid
