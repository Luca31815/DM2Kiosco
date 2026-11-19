import React from 'react'
import { ArrowUpDown, Truck, Wand2 } from 'lucide-react'
import { simularNuevoPrecioVenta } from '../../services/comparadorApi'
import { formatCurrency, formatNumber, formatPct, getCategoryMeta } from '../comparador/comparadorFormatters'

const SEMAFORO_BADGE = {
    urgente: {
        label: '🔴 Urgente',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/35'
    },
    revisar: {
        label: '🟡 Revisar',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/35'
    },
    mantener: {
        label: '🟢 Mantener',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
    }
}

const RadarPocketMarginTable = ({
    items,
    sortField,
    sortDir,
    onSort,
    selectedMap,
    onToggleSelectProduct,
    customPvMap,
    onChangeCustomPv,
    markupObjetivoPct,
    redondeoMultiplo
}) => {
    return (
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1250px]">
                    <thead>
                        <tr className="bg-slate-950 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                            <th className="py-3 px-3 w-10 text-center">Lista</th>
                            <th className="py-3 px-3">Producto / Rubro</th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => onSort('delta_costo_pct')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Últ. Costo & Proveedor</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-right">Logística 1×d / Costo Real</th>
                            <th className="py-3 px-3 text-right">PV Lista vs Cobrado</th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => onSort('markup_pct')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Ganancia Unit / Markup / Margen</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => onSort('unidades_vendidas')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Unid.</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => onSort('impacto_mensual')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Impacto Mes</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-center">Semáforo</th>
                            <th className="py-3 px-3 text-right bg-indigo-950/20">Simulador Nuevo PV</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                        {items.map((item) => {
                            const catMeta = getCategoryMeta(item.categoria)
                            const sem = SEMAFORO_BADGE[item.semaforo] || SEMAFORO_BADGE.mantener
                            const isChecked = Boolean(selectedMap[item.producto])
                            const manualVal = customPvMap[item.producto]

                            const sim = simularNuevoPrecioVenta({
                                costoRealUnitario: item.costo_real_unitario,
                                pvActual: item.pv_actual,
                                unidadesVendidas: item.unidades_vendidas,
                                pvManual: manualVal,
                                markupObjetivoPct,
                                redondeoMultiplo
                            })

                            const fechaCompra = item.fecha_ultima_compra
                                ? String(item.fecha_ultima_compra).slice(0, 10)
                                : 'Sin fecha'

                            return (
                                <tr
                                    key={item.producto}
                                    className={`transition-colors ${
                                        isChecked ? 'bg-indigo-950/25' : 'hover:bg-slate-800/40'
                                    }`}
                                >
                                    <td className="py-3 px-3 text-center">
                                        <input
                                            type="checkbox"
                                            aria-label={`Seleccionar ${item.producto} para lista de remarcación`}
                                            checked={isChecked}
                                            onChange={() => onToggleSelectProduct(item.producto)}
                                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 cursor-pointer"
                                        />
                                    </td>

                                    <td className="py-3 px-3">
                                        <div className="font-bold text-white">{item.producto}</div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catMeta.badgeColor}`}>
                                                {catMeta.label}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Stock: {formatNumber(item.stock_actual)}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="font-bold text-slate-200">
                                            {formatCurrency(item.ultimo_costo_compra)}
                                            {item.delta_costo_pct !== 0 && (
                                                <span className={`ml-1.5 text-[11px] font-black ${item.delta_costo_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    ({formatPct(item.delta_costo_pct)})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate max-w-[180px] ml-auto">
                                            {item.ultimo_proveedor} · {fechaCompra}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="font-black text-white">
                                            {formatCurrency(item.costo_real_unitario)}
                                        </div>
                                        <div className="text-[10px] text-emerald-300/90 flex items-center justify-end gap-1">
                                            <Truck className="h-3 w-3" />
                                            <span>+{formatCurrency(item.costo_logistico_unitario)}/u</span>
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="font-bold text-blue-300">
                                            Lista: {formatCurrency(item.pv_actual)}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Cobrado: {formatCurrency(item.pv_promedio_cobrado)}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className={`font-black ${item.ganancia_unitaria > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatCurrency(item.ganancia_unitaria)} /u
                                        </div>
                                        <div className="text-[11px] text-slate-300">
                                            Markup: <strong>{formatNumber(item.markup_pct, 1)}%</strong> · Margen: <strong>{formatNumber(item.margen_pct, 1)}%</strong>
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-200">
                                        <div>{formatNumber(item.unidades_vendidas)} u</div>
                                        <div className="text-[10px] text-slate-400">
                                            Comp: {formatNumber(item.unidades_compradas)} u
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className={`font-black text-sm ${item.impacto_mensual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatCurrency(item.impacto_mensual)}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            Fact: {formatCurrency(item.facturacion_ventana, true)}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-center max-w-[190px]">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${sem.className}`}>
                                            {sem.label}
                                        </span>
                                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2" title={item.motivo_semaforo}>
                                            {item.motivo_semaforo}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right bg-indigo-950/15 tabular-nums">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <input
                                                type="number"
                                                min={0}
                                                step={50}
                                                aria-label={`Nuevo precio de venta simulado para ${item.producto}`}
                                                value={manualVal !== undefined ? manualVal : sim.pvPropuesto}
                                                onChange={(e) => onChangeCustomPv(item.producto, e.target.value)}
                                                className="w-24 bg-slate-900 border border-indigo-500/40 rounded-lg px-2 py-1 text-xs font-black text-white text-right focus:outline-none focus:border-indigo-400"
                                            />
                                            {item.pv_sugerido_35 > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => onChangeCustomPv(item.producto, item.pv_sugerido_35)}
                                                    title={`Aplicar PV sugerido margen 35% (${formatCurrency(item.pv_sugerido_35)})`}
                                                    aria-label={`Usar precio sugerido para ${item.producto}`}
                                                    className="p-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 cursor-pointer"
                                                >
                                                    <Wand2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-300 mt-1">
                                            Margen: <strong>{formatNumber(sim.margenNuevoPct, 1)}%</strong> ·{' '}
                                            <span className={sim.gananciaMensualAdicional >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                {sim.gananciaMensualAdicional >= 0 ? '+' : ''}
                                                {formatCurrency(sim.gananciaMensualAdicional)}/mes
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={10} className="py-10 text-center text-slate-400 text-sm">
                                    No se encontraron productos para los filtros actuales del Radar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default RadarPocketMarginTable
