import React from 'react'
import { ShieldCheck, AlertTriangle, Sparkles, Receipt, CalendarOff, Tag, DollarSign } from 'lucide-react'
import { formatCurrency } from './comparadorFormatters'

const CAUSA_CONFIG = {
    PRECIO: {
        label: 'Impulsado por Variación de Precios',
        color: 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    },
    VOLUMEN_TRAFICO: {
        label: 'Impulsado por Volumen / Tráfico de Gente',
        color: 'text-blue-300 bg-blue-500/15 border-blue-500/30'
    },
    MIX_SURTIDO: {
        label: 'Impulsado por Mix de Productos / Rotación',
        color: 'text-purple-300 bg-purple-500/15 border-purple-500/30'
    }
}

const CalidadDatosBanner = ({
    calidadDatos,
    descomposicionGlobal,
    meta,
    onOpenTicketsPeriod
}) => {
    if (!calidadDatos || !descomposicionGlobal) return null

    const tc = descomposicionGlobal.trafico_canasta || {}
    const rev = descomposicionGlobal.revenue || {}
    const causaInfo = CAUSA_CONFIG[tc.causa_principal] || CAUSA_CONFIG.PRECIO

    const precioCeroTotal = (calidadDatos.items_precio_cero_a || 0) + (calidadDatos.items_precio_cero_b || 0)
    const descalcesTotal = (calidadDatos.descalces_pagos_a || 0) + (calidadDatos.descalces_pagos_b || 0)
    const sinCatTotal = Math.max(calidadDatos.productos_sin_categoria_a || 0, calidadDatos.productos_sin_categoria_b || 0)
    const diasSinVentasA = calidadDatos.dias_sin_ventas_a || 0
    const diasSinVentasB = calidadDatos.dias_sin_ventas_b || 0
    const hasWarnings = precioCeroTotal > 0 || descalcesTotal > 0 || sinCatTotal > 0 || diasSinVentasA > 0 || diasSinVentasB > 0

    return (
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-indigo-950/30">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                {/* Diagnóstico automático de Causa Principal */}
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex-shrink-0">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                                Diagnóstico Laspeyres
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${causaInfo.color}`}>
                                {causaInfo.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            Δ Facturación:{' '}
                            <strong className={rev.delta_total >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {formatCurrency(rev.delta_total)}
                            </strong>{' '}
                            (Efecto Precio: <strong>{formatCurrency(rev.efecto_precio)}</strong> · Efecto Volumen:{' '}
                            <strong>{formatCurrency(rev.efecto_volumen)}</strong> · Efecto Mix/Altas/Bajas:{' '}
                            <strong>{formatCurrency(rev.efecto_mix)}</strong>)
                        </p>
                    </div>
                </div>

                {/* Indicadores de Calidad del Dato y Botones de Auditoría de Tickets */}
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                            precioCeroTotal > 0
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800'
                        }`}
                        title="Líneas en ventas_detalles con precio_unitario = 0"
                    >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Ítems $0: {calidadDatos.items_precio_cero_a} (A) / {calidadDatos.items_precio_cero_b} (B)</span>
                    </div>

                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                            descalcesTotal > 0
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800'
                        }`}
                        title="Ventas con descalce de pagos detectado en v_descalces_pagos"
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Descalces: {calidadDatos.descalces_pagos_a} (A) / {calidadDatos.descalces_pagos_b} (B)</span>
                    </div>

                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                            sinCatTotal > 0
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800'
                        }`}
                    >
                        <Tag className="h-3.5 w-3.5" />
                        <span>Sin categoría: {calidadDatos.productos_sin_categoria_a} / {calidadDatos.productos_sin_categoria_b}</span>
                    </div>

                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                            diasSinVentasA + diasSinVentasB > 0
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                        }`}
                    >
                        {hasWarnings ? <CalendarOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        <span>Días sin venta: {diasSinVentasA} (A) / {diasSinVentasB} (B)</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenTicketsPeriod('B', null, null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition-all cursor-pointer"
                    >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Auditar Tickets ({meta?.inicio_b ? 'Período B' : 'Reales'})</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CalidadDatosBanner
