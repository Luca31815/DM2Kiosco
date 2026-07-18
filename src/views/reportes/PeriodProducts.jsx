import React, { useMemo } from 'react'
import { Package, Sparkles } from 'lucide-react'
import { useReporteVentasPeriodico } from '../../hooks/useData'
import { getPeriodDateRange } from './reportesHelpers'
import { MiniStat } from './ReportesKPI'

// ─────────────────────────────────────────────────────────────────────────────
// PeriodTopProducts — Top productos del periodo con barra de progreso
// Se muestran dentro del panel expandido por fila de la tabla de reportes.
// ─────────────────────────────────────────────────────────────────────────────
export const PeriodTopProducts = ({ item, type }) => {
    const dateRange = getPeriodDateRange(item, type)

    const { data: rawData, loading } = useReporteVentasPeriodico({
        filterColumn: 'tipo_periodo',
        filterValue: type.toUpperCase(),
        dateColumn: 'periodo_inicio',
        dateRange,
        sortColumn: 'ganancia_total',
        sortOrder: 'desc',
        pageSize: 50
    })

    const aggregatedData = useMemo(() => {
        if (!rawData) return []
        const map = rawData.reduce((acc, curr) => {
            const name = curr.producto?.trim() || 'Sin Nombre'
            if (!acc[name]) {
                acc[name] = { ...curr, producto: name }
            } else {
                acc[name].ganancia_total = Number(acc[name].ganancia_total || 0) + Number(curr.ganancia_total || 0)
                acc[name].recaudacion_total = Number(acc[name].recaudacion_total || 0) + Number(curr.recaudacion_total || 0)
                acc[name].cantidad_total = Number(acc[name].cantidad_total || 0) + Number(curr.cantidad_total || 0)
            }
            return acc
        }, {})
        return Object.values(map).sort((a, b) => b.ganancia_total - a.ganancia_total).slice(0, 5)
    }, [rawData])

    if (loading) return (
        <div className="space-y-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
            ))}
        </div>
    )

    if (!aggregatedData.length) return (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Package className="h-8 w-8 text-slate-700" />
            <span className="text-[10px] text-slate-600 italic font-medium">Sin datos de productos para este periodo</span>
        </div>
    )

    const maxGanancia = aggregatedData[0]?.ganancia_total || 1

    return (
        <div className="space-y-2">
            {aggregatedData.map((p, idx) => {
                const pct = Math.round((p.ganancia_total / maxGanancia) * 100)
                const isTop = idx === 0
                return (
                    <div key={p.producto || p.id || idx} className="group/item relative overflow-hidden hover:bg-white/4 p-2.5 rounded-xl transition-all">
                        <div
                            className={`absolute left-0 top-0 bottom-0 rounded-xl transition-all duration-500 opacity-10 ${
                                isTop ? 'bg-emerald-400' : 'bg-blue-400'
                            }`}
                            style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    isTop
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-700 text-slate-400 border border-white/5'
                                }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-[10px] text-slate-300 font-bold truncate">{p.producto}</span>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className={`text-[10px] font-black tabular-nums ${isTop ? 'text-emerald-400' : 'text-white'}`}>
                                    ${Math.floor(p.ganancia_total).toLocaleString()}
                                </div>
                                <div className="text-[9px] text-slate-600 tabular-nums">
                                    {Number(p.cantidad_total || 0).toLocaleString()} u
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PeriodGananciaRealStat — Ganancia Real de un periodo específico
// SWR cachea la request — PeriodTopProducts hace la misma llamada, sin doble fetch
// ─────────────────────────────────────────────────────────────────────────────
export const PeriodGananciaRealStat = ({ item, type }) => {
    const dateRange = getPeriodDateRange(item, type)

    const { data: rawData, loading } = useReporteVentasPeriodico({
        filterColumn: 'tipo_periodo',
        filterValue: type.toUpperCase(),
        dateColumn: 'periodo_inicio',
        dateRange,
        sortColumn: 'ganancia_total',
        sortOrder: 'desc',
        pageSize: 500
    })

    const gananciaReal = useMemo(() => {
        if (!rawData || !rawData.length) return { total: 0, productos: 0 }
        const map = rawData.reduce((acc, curr) => {
            const name = curr.producto?.trim() || 'Sin Nombre'
            if (!acc[name]) {
                acc[name] = {
                    ganancia_total: Number(curr.ganancia_total || 0),
                    recaudacion_total: Number(curr.recaudacion_total || 0)
                }
            } else {
                acc[name].ganancia_total += Number(curr.ganancia_total || 0)
                acc[name].recaudacion_total += Number(curr.recaudacion_total || 0)
            }
            return acc
        }, {})
        const conCosto = Object.values(map).filter(p =>
            p.recaudacion_total > 0 &&
            p.ganancia_total < (p.recaudacion_total - 0.001)
        )
        return {
            total: conCosto.reduce((s, p) => s + p.ganancia_total, 0),
            productos: conCosto.length
        }
    }, [rawData])

    if (loading) return (
        <div className="flex justify-between items-center bg-white/4 p-3 rounded-xl border border-white/5">
            <div className="w-24 h-3 bg-white/5 rounded animate-pulse" />
            <div className="w-16 h-3 bg-white/5 rounded animate-pulse" />
        </div>
    )

    return (
        <div className="flex justify-between items-center bg-amber-500/8 border border-amber-500/15 hover:border-amber-500/25 p-3 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] text-amber-600 font-black uppercase tracking-wide">Ganancia Real</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-amber-700 font-bold">{gananciaReal.productos} prods</span>
                <span className="text-xs font-black text-amber-300 tabular-nums">
                    ${Math.floor(gananciaReal.total).toLocaleString()}
                </span>
            </div>
        </div>
    )
}
