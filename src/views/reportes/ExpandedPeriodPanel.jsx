import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Activity, CreditCard, Tag } from 'lucide-react'
import { MiniStat } from './ReportesKPI'
import { PeriodTopProducts, PeriodGananciaRealStat } from './PeriodProducts'
import { getPeriodName, getPeriodDays } from './reportesHelpers'

// ─────────────────────────────────────────────────────────────────────────────
// ExpandedPeriodPanel — Panel de detalle expandido por fila de la tabla
// ─────────────────────────────────────────────────────────────────────────────
const ExpandedPeriodPanel = ({ item, reportType }) => {
    const periodLabel = getPeriodName(item, reportType)
    const periodDays = getPeriodDays(reportType)

    const ingresos = Number(item.ingresos || 0)
    const egresos = Number(item.egresos || 0)
    const saldo = Number(item.saldo || 0)
    const cantVentas = Number(item.cant_ventas || 0)
    const cantCompras = Number(item.cant_compras || 0)

    const ticketPromedio = cantVentas > 0 ? ingresos / cantVentas : 0
    const margenNeto = ingresos > 0 ? (saldo / ingresos) * 100 : 0
    const ratioGastoIngreso = ingresos > 0 ? (egresos / ingresos) * 100 : 0
    const promedioIngresoDiario = periodDays > 1 ? ingresos / periodDays : null
    const isPositive = saldo >= 0

    const periodShortLabel = reportType === 'diario' ? 'Día' : reportType === 'semanal' ? 'Semana' : 'Mes'

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
        >
            {/* Encabezado del periodo */}
            <div className="flex items-center gap-3 px-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    Detalle de {periodShortLabel}
                </div>
                <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-black text-blue-300">{periodLabel}</span>
                </div>
                <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Grid de paneles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* PANEL 1: Resumen del periodo */}
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 space-y-3 hover:border-white/10 transition-all">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5" /> Resumen del {periodShortLabel}
                    </h5>
                    <div className="space-y-2">
                        <MiniStat label="Ticket Promedio" value={`$${Math.floor(ticketPromedio).toLocaleString()}`} />
                        <MiniStat label="Total Operaciones" value={(cantVentas + cantCompras).toLocaleString()} colorClass="text-slate-300" />
                        {promedioIngresoDiario !== null && (
                            <MiniStat label="Promedio / Día" value={`$${Math.floor(promedioIngresoDiario).toLocaleString()}`} colorClass="text-sky-400" />
                        )}
                        <MiniStat label="Ventas / Compras" value={`${cantVentas} / ${cantCompras}`} colorClass="text-slate-400" />
                        <PeriodGananciaRealStat item={item} type={reportType} />
                    </div>
                </div>

                {/* PANEL 2: Top productos del periodo */}
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 lg:col-span-2 hover:border-white/10 transition-all">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-3">
                        <Tag className="h-3.5 w-3.5" /> Top Productos del {periodShortLabel}
                    </h5>
                    <PeriodTopProducts item={item} type={reportType} />
                </div>

                {/* PANEL 3: Flujo de caja + métricas */}
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 space-y-3 hover:border-white/10 transition-all">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" /> Flujo de Caja
                    </h5>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black">
                            <span className="text-emerald-400">INGRESOS</span>
                            <span className="text-emerald-400 tabular-nums">${Math.floor(ingresos).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black">
                            <span className="text-rose-400">EGRESOS</span>
                            <span className="text-rose-400 tabular-nums">${Math.floor(egresos).toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-white/8 my-1.5" />
                        <div className="flex justify-between items-center text-xs font-black">
                            <span className="text-slate-300">SALDO</span>
                            <span className={`tabular-nums ${isPositive ? 'text-emerald-300' : 'text-rose-400'}`}>
                                ${Math.floor(saldo).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Barra visual del margen */}
                    <div className="mt-1">
                        <div className="flex justify-between text-[9px] text-slate-600 mb-1 font-bold uppercase">
                            <span>Margen Neto</span>
                            <span className={margenNeto >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                {margenNeto.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${margenNeto >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(Math.abs(margenNeto), 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Ratio gasto / ingreso */}
                    <div>
                        <div className="flex justify-between text-[9px] text-slate-600 mb-1 font-bold uppercase">
                            <span>Gasto / Ingreso</span>
                            <span className={ratioGastoIngreso < 60 ? 'text-emerald-500' : ratioGastoIngreso < 85 ? 'text-amber-500' : 'text-rose-500'}>
                                {ratioGastoIngreso.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                    ratioGastoIngreso < 60 ? 'bg-emerald-500'
                                    : ratioGastoIngreso < 85 ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(ratioGastoIngreso, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default ExpandedPeriodPanel
