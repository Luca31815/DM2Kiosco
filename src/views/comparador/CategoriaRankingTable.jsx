import React, { useState, useMemo } from 'react'
import { Layers, ChevronRight, Receipt, ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatNumber, formatPct, getCategoryMeta, getDeltaColorClass } from './comparadorFormatters'

const CategoriaRankingTable = React.memo(({
    categorias,
    selectedCategoria,
    onSelectCategoria,
    onOpenTicketsCategoria
}) => {
    const [sortField, setSortField] = useState('facturacion_b')
    const [sortDir, setSortDir] = useState('desc')

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortField(field)
            setSortDir('desc')
        }
    }

    const sortedCategorias = useMemo(() => {
        const list = Array.isArray(categorias) ? [...categorias] : []
        list.sort((a, b) => {
            const va = Number(a[sortField]) || 0
            const vb = Number(b[sortField]) || 0
            return sortDir === 'asc' ? va - vb : vb - va
        })
        return list
    }, [categorias, sortField, sortDir])

    return (
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-400" />
                        <span>Ranking Multi-Categoría (A vs B)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Haz clic en cualquier categoría para abrir el drill-down de precios históricos, elasticidad y quiebres de stock.
                    </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                    {sortedCategorias.length} categoría(s) con movimiento
                </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                    <thead>
                        <tr className="bg-slate-950/70 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                            <th className="py-3 px-4">Categoría</th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => handleSort('facturacion_b')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Facturación A → B</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => handleSort('delta_facturacion_pct')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Δ% Fact.</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => handleSort('ganancia_b')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Ganancia & Margen B</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => handleSort('unidades_b')}
                                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                    <span>Unidades A → B</span>
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="py-3 px-3 text-right">PV Prom. Pond.</th>
                            <th className="py-3 px-3 text-right">Penetración / Share</th>
                            <th className="py-3 px-3 text-right">Efecto Precio / Vol / Mix</th>
                            <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                        {sortedCategorias.map((cat) => {
                            const meta = getCategoryMeta(cat.categoria)
                            const isSelected = selectedCategoria === cat.categoria
                            return (
                                <tr
                                    key={cat.categoria}
                                    className={`transition-colors ${
                                        isSelected
                                            ? 'bg-blue-600/15'
                                            : 'hover:bg-slate-800/40'
                                    }`}
                                >
                                    <td className="py-3 px-4">
                                        <button
                                            type="button"
                                            onClick={() => onSelectCategoria(cat.categoria)}
                                            className="flex items-center gap-2 text-left group cursor-pointer"
                                        >
                                            <ChevronRight
                                                className={`h-4 w-4 transition-transform ${
                                                    isSelected ? 'rotate-90 text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                                                }`}
                                            />
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.badgeColor}`}>
                                                {meta.label}
                                            </span>
                                        </button>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="font-bold text-white">{formatCurrency(cat.facturacion_b)}</div>
                                        <div className="text-[11px] text-slate-400">
                                            A: {formatCurrency(cat.facturacion_a)} ({cat.delta_facturacion >= 0 ? '+' : ''}{formatCurrency(cat.delta_facturacion)})
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black border ${getDeltaColorClass(cat.delta_facturacion_pct)}`}>
                                            {formatPct(cat.delta_facturacion_pct)}
                                        </span>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="font-bold text-emerald-400">{formatCurrency(cat.ganancia_b)}</div>
                                        <div className="text-[11px] text-slate-400">
                                            Margen: {formatNumber(cat.margen_pct_a, 1)}% → <strong>{formatNumber(cat.margen_pct_b, 1)}%</strong>
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="font-bold text-slate-200">
                                            {formatNumber(cat.unidades_a)} → {formatNumber(cat.unidades_b)} u
                                        </div>
                                        <div className={`text-[11px] font-semibold ${cat.delta_unidades_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatPct(cat.delta_unidades_pct)}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="font-bold text-slate-200">
                                            {formatCurrency(cat.precio_promedio_a)} → {formatCurrency(cat.precio_promedio_b)}
                                        </div>
                                        <div className="text-[11px] text-amber-300 font-semibold">
                                            {formatPct(cat.delta_precio_promedio_pct)}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums">
                                        <div className="text-slate-200 font-semibold">
                                            Penetración: {formatNumber(cat.penetracion_pct_b, 1)}%
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Share: {formatNumber(cat.share_pct_b, 1)}% ({cat.delta_share_pp >= 0 ? '+' : ''}{formatNumber(cat.delta_share_pp, 1)} pp)
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right tabular-nums text-[11px]">
                                        <div className="text-amber-300">P: {formatCurrency(cat.efecto_precio, true)}</div>
                                        <div className="text-blue-300">V: {formatCurrency(cat.efecto_volumen, true)}</div>
                                        <div className="text-purple-300">M: {formatCurrency(cat.efecto_mix, true)}</div>
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onSelectCategoria(cat.categoria)}
                                                className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold cursor-pointer"
                                            >
                                                {isSelected ? 'Ocultar' : 'Precios & Causas'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onOpenTicketsCategoria(cat.categoria)}
                                                aria-label={`Ver tickets de ${cat.categoria}`}
                                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer"
                                                title="Auditar tickets reales de esta categoría"
                                            >
                                                <Receipt className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {sortedCategorias.length === 0 && (
                            <tr>
                                <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                                    No se encontraron categorías con ventas para los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
})

CategoriaRankingTable.displayName = 'CategoriaRankingTable'

export default CategoriaRankingTable
