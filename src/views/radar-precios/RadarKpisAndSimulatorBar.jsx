import React from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, DollarSign, Sparkles, Sliders, CheckSquare, RotateCcw } from 'lucide-react'
import { formatCurrency, formatNumber } from '../comparador/comparadorFormatters'

const ROUNDING_OPTIONS = [
    { value: 50, label: 'Redondeo $50' },
    { value: 100, label: 'Redondeo $100' },
    { value: 1, label: 'Exacto ($1)' }
]

const MARKUP_PRESETS = [35, 45, 50, 60, 80]

const RadarKpisAndSimulatorBar = ({
    resumen,
    gananciaAdicionalTotal,
    cantidadSimulados,
    markupObjetivoPct,
    onChangeMarkupObjetivo,
    redondeoMultiplo,
    onChangeRedondeoMultiplo,
    onSelectUrgentes,
    onSelectUrgentesYRevisar,
    onClearSimulation
}) => {
    if (!resumen) return null

    return (
        <div className="space-y-4">
            {/* 5 KPIs Superiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                <div className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-rose-950/15">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                            Remarcar Urgente
                        </span>
                        <AlertOctagon className="h-4 w-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums mt-1">
                        {formatNumber(resumen.urgentes)}
                    </div>
                    <p className="text-[11px] text-rose-200/80 mt-1">
                        Venta al costo, pérdida o suba fuerte de proveedor
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-950/15">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                            Revisar Margen
                        </span>
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums mt-1">
                        {formatNumber(resumen.revisar)}
                    </div>
                    <p className="text-[11px] text-amber-200/80 mt-1">
                        Margen {'<'} 30% o desvío PV lista vs cobrado
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-emerald-500/25 bg-emerald-950/10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                            Mantener PV
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums mt-1">
                        {formatNumber(resumen.mantener)}
                    </div>
                    <p className="text-[11px] text-emerald-200/80 mt-1">
                        Margen saludable (Prom: {formatNumber(resumen.margen_promedio_pct, 1)}%)
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-blue-500/25">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                            Ganancia Mensual Activa
                        </span>
                        <DollarSign className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white tabular-nums mt-1">
                        {formatCurrency(resumen.ganancia_mensual_estimada)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Facturación ventana: {formatCurrency(resumen.facturacion_ventana, true)} · Logística: {formatCurrency(resumen.costo_logistico_prorrateado_total)}
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-indigo-500/40 bg-indigo-950/25">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                            Ganancia Adicional Sim.
                        </span>
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className={`text-xl md:text-2xl font-black tabular-nums mt-1 ${gananciaAdicionalTotal > 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {gananciaAdicionalTotal > 0 ? '+' : ''}
                        {formatCurrency(gananciaAdicionalTotal)}
                        <span className="text-xs font-semibold text-slate-400"> /mes</span>
                    </div>
                    <p className="text-[11px] text-indigo-200/80 mt-1">
                        En {formatNumber(cantidadSimulados)} producto(s) de la Lista de Remarcación
                    </p>
                </div>
            </div>

            {/* Barra del Simulador Global de Nuevo PV */}
            <div className="glass-panel rounded-2xl p-4 border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                            Simulador de Remarcación:
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
                        <span className="text-xs font-bold text-slate-400">Markup Objetivo:</span>
                        <input
                            type="number"
                            min={5}
                            max={300}
                            step={5}
                            aria-label="Markup objetivo en porcentaje"
                            value={markupObjetivoPct}
                            onChange={(e) => onChangeMarkupObjetivo(Number(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-black text-indigo-300 text-right focus:outline-none focus:border-indigo-400"
                        />
                        <span className="text-xs font-bold text-indigo-300">%</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {MARKUP_PRESETS.map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => onChangeMarkupObjetivo(pct)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                    markupObjetivoPct === pct
                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                            >
                                +{pct}%
                            </button>
                        ))}
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                        {ROUNDING_OPTIONS.map((ro) => (
                            <button
                                key={ro.value}
                                type="button"
                                onClick={() => onChangeRedondeoMultiplo(ro.value)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    redondeoMultiplo === ro.value
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {ro.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onSelectUrgentes}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
                    >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Seleccionar Urgentes ({resumen.urgentes})</span>
                    </button>
                    <button
                        type="button"
                        onClick={onSelectUrgentesYRevisar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
                    >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Urgentes + Revisar ({resumen.urgentes + resumen.revisar})</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClearSimulation}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-bold cursor-pointer"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reiniciar</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RadarKpisAndSimulatorBar
