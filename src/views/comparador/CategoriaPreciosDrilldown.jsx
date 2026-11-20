import React, { useMemo, useState, useCallback } from 'react'
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Cell
} from 'recharts'
import { PackageSearch, AlertOctagon, Receipt, X, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, formatNumber, formatPct, getCategoryMeta, getDeltaColorClass } from './comparadorFormatters'

const PAGE_SIZE = 30
const SCATTER_MARGIN = { top: 10, right: 20, bottom: 10, left: 0 }
const SCATTER_TICK = { fill: '#94a3b8', fontSize: 11 }
const SCATTER_Z_RANGE = [50, 350]

const ELASTICITY_BADGES = {
    ELASTICA_CAIDA: {
        label: 'Elástica (Subió PV y cayó vol.)',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        color: '#f43f5e'
    },
    INELASTICA_SOSTENIDA: {
        label: 'Inelástica (Sostuvo demanda)',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        color: '#10b981'
    },
    SIN_CAMBIO_PRECIO: {
        label: 'Precio estable',
        className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        color: '#3b82f6'
    },
    VARIACION_MIXTA: {
        label: 'Variación mixta',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        color: '#f59e0b'
    },
    SOLO_UN_PERIODO: {
        label: 'Solo 1 período',
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        color: '#a855f7'
    }
}

const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const p = payload[0]?.payload
    if (!p) return null

    return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1 max-w-xs">
            <div className="font-black text-white">{p.producto}</div>
            <div className="text-amber-300">
                Δ% Precio: <strong>{formatPct(p.delta_precio_pct)}</strong> ({formatCurrency(p.precio_prom_a)} → {formatCurrency(p.precio_prom_b)})
            </div>
            <div className="text-blue-300">
                Δ% Unidades: <strong>{formatPct(p.delta_unidades_pct)}</strong> ({formatNumber(p.unidades_a)} → {formatNumber(p.unidades_b)} u)
            </div>
            <div className="text-slate-300">
                Facturación B: <strong>{formatCurrency(p.facturacion_b)}</strong>
            </div>
            {p.tuvo_quiebre_stock_b && (
                <div className="text-rose-400 font-bold">⚠ Detectado quiebre de stock en B</div>
            )}
        </div>
    )
}

const CategoriaPreciosDrilldown = React.memo(({
    categoria,
    drilldownData,
    loading,
    onClose,
    onOpenTicketsProducto
}) => {
    const [onlyQuiebres, setOnlyQuiebres] = useState(false)

    const meta = getCategoryMeta(categoria)
    const productos = useMemo(() => {
        const list = drilldownData?.productos || []
        if (onlyQuiebres) return list.filter((p) => p.tuvo_quiebre_stock_b)
        return list
    }, [drilldownData, onlyQuiebres])

    const filterKey = `${categoria}|${onlyQuiebres}|${productos.length}`
    const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
    const page = pageState.key === filterKey ? pageState.page : 1
    const setPage = useCallback((updater) => {
        setPageState((prev) => {
            const current = prev.key === filterKey ? prev.page : 1
            const next = typeof updater === 'function' ? updater(current) : updater
            return { key: filterKey, page: next }
        })
    }, [filterKey])

    const totalPages = Math.max(1, Math.ceil(productos.length / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)
    const paginatedProductos = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE
        return productos.slice(start, start + PAGE_SIZE)
    }, [productos, safePage])

    const scatterPoints = useMemo(() => {
        const result = []
        for (const p of drilldownData?.productos || []) {
            if (p.unidades_a > 0 && p.unidades_b > 0) {
                result.push({
                    ...p,
                    x: Number(p.delta_precio_pct) || 0,
                    y: Number(p.delta_unidades_pct) || 0,
                    z: Math.max(Number(p.facturacion_b) || 100, 100)
                })
            }
        }
        return result
    }, [drilldownData])

    if (!categoria) return null
    const desc = drilldownData?.descomposicion || {}

    return (
        <div className="glass-panel rounded-2xl border border-blue-500/30 bg-slate-900/95 p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                        <PackageSearch className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">
                                Drill-Down de Precios, Costos y Elasticidad
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${meta.badgeColor}`}>
                                {meta.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Precios calculados desde ventas históricas reales (ponderado, mín/máx/último), fecha de último aumento y quiebres de stock.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setOnlyQuiebres((v) => !v)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            onlyQuiebres
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-800 text-slate-300 border-white/10'
                        }`}
                    >
                        {onlyQuiebres ? 'Mostrando solo Quiebres' : 'Filtrar Quiebres de Stock'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar drill-down de categoría"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
                    Calculando elasticidad, historial de precios y stock para {meta.label}...
                </div>
            ) : (
                <>
                    {/* Resumen + Scatter Plot de Elasticidad */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                                    Descomposición del Rubro
                                </span>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Facturación A → B:</span>
                                    <strong className="text-white">
                                        {formatCurrency(desc.facturacion_a)} → {formatCurrency(desc.facturacion_b)}
                                    </strong>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Efecto Precio:</span>
                                    <strong className="text-amber-300">{formatCurrency(desc.efecto_precio)}</strong>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Efecto Volumen:</span>
                                    <strong className="text-blue-300">{formatCurrency(desc.efecto_volumen)}</strong>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Altas en B / Bajas de A:</span>
                                    <strong className="text-purple-300">
                                        {formatCurrency(desc.efecto_nuevos_altas)} / {formatCurrency(desc.efecto_bajas_quiebres)}
                                    </strong>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                    <span>Lectura del Gráfico de Elasticidad</span>
                                </div>
                                <p className="text-slate-400 text-[11px]">
                                    • <strong>Cuadrante Superior Derecho</strong> (verde): subió el precio y además subieron o se mantuvieron las unidades (demanda inelástica).
                                </p>
                                <p className="text-slate-400 text-[11px]">
                                    • <strong>Cuadrante Inferior Derecho</strong> (rojo): subió el precio y cayeron las unidades vendidas. Verificar si hubo quiebre de stock.
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                            <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Mapa de Elasticidad: Δ% Precio (Eje X) vs Δ% Unidades (Eje Y)
                            </div>
                            <div className="h-60 w-full">
                                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                    <ScatterChart margin={SCATTER_MARGIN}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis
                                            type="number"
                                            dataKey="x"
                                            name="Δ% Precio"
                                            unit="%"
                                            tick={SCATTER_TICK}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            name="Δ% Unidades"
                                            unit="%"
                                            tick={SCATTER_TICK}
                                        />
                                        <ZAxis type="number" dataKey="z" range={SCATTER_Z_RANGE} />
                                        <Tooltip content={<ScatterTooltip />} />
                                        <ReferenceLine x={0} stroke="#475569" />
                                        <ReferenceLine y={0} stroke="#475569" />
                                        <Scatter data={scatterPoints} isAnimationActive={false}>
                                            {scatterPoints.map((entry) => {
                                                const badge = ELASTICITY_BADGES[entry.elasticidad_etiqueta] || ELASTICITY_BADGES.SIN_CAMBIO_PRECIO
                                                return <Cell key={entry.producto} fill={badge.color} />
                                            })}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Productos con Precios A/B, Min/Max/Último, Costo/Margen y Quiebre de Stock */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-slate-950 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                    <th className="py-3 px-3">Producto</th>
                                    <th className="py-3 px-3 text-right">PV Prom. Pond. A → B</th>
                                    <th className="py-3 px-3 text-right">Mín / Máx / Último (B)</th>
                                    <th className="py-3 px-3 text-right">Último Aumento</th>
                                    <th className="py-3 px-3 text-right">Unidades A → B</th>
                                    <th className="py-3 px-3 text-right">Costo & Margen B</th>
                                    <th className="py-3 px-3 text-center">Elasticidad / Stock</th>
                                    <th className="py-3 px-3 text-right">Tickets</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-xs">
                                {paginatedProductos.map((prod) => {
                                    const elBadge = ELASTICITY_BADGES[prod.elasticidad_etiqueta] || ELASTICITY_BADGES.SIN_CAMBIO_PRECIO
                                    const fechaAumento = prod.fecha_ultimo_aumento
                                        ? String(prod.fecha_ultimo_aumento).slice(0, 10)
                                        : 'Sin suba reg.'
                                    return (
                                        <tr key={prod.producto} className="hover:bg-slate-800/40">
                                            <td className="py-2.5 px-3">
                                                <div className="font-bold text-white">{prod.producto}</div>
                                                <div className="text-[10px] text-slate-400">{prod.subcategoria}</div>
                                            </td>

                                            <td className="py-2.5 px-3 text-right tabular-nums">
                                                <div className="font-bold text-slate-200">
                                                    {formatCurrency(prod.precio_prom_a)} → {formatCurrency(prod.precio_prom_b)}
                                                </div>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${getDeltaColorClass(prod.delta_precio_pct)}`}>
                                                    {formatPct(prod.delta_precio_pct)}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3 text-right tabular-nums text-[11px]">
                                                <div className="text-slate-300">
                                                    Mín: {formatCurrency(prod.precio_min_b)} · Máx: {formatCurrency(prod.precio_max_b)}
                                                </div>
                                                <div className="text-blue-300 font-semibold">
                                                    Últ. cobrado: {formatCurrency(prod.precio_ultimo_b)} (Lista: {formatCurrency(prod.precio_lista_actual)})
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3 text-right tabular-nums text-[11px]">
                                                <span className="inline-flex items-center gap-1 text-slate-300">
                                                    <Calendar className="h-3 w-3 text-slate-500" />
                                                    {fechaAumento}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3 text-right tabular-nums">
                                                <div className="font-bold text-white">
                                                    {formatNumber(prod.unidades_a)} → {formatNumber(prod.unidades_b)} u
                                                </div>
                                                <div className={`text-[11px] font-bold ${prod.delta_unidades_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {formatPct(prod.delta_unidades_pct)}
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3 text-right tabular-nums">
                                                <div className="text-slate-200">
                                                    Costo: {formatCurrency(prod.costo_unit_b)} ({formatPct(prod.delta_costo_pct)})
                                                </div>
                                                <div className="text-[11px] text-emerald-400 font-bold">
                                                    Margen: {formatNumber(prod.margen_pct_b, 1)}% ({formatCurrency(prod.ganancia_b)})
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${elBadge.className}`}>
                                                        {elBadge.label}
                                                    </span>
                                                    {prod.tuvo_quiebre_stock_b && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                                            <AlertOctagon className="h-3 w-3" />
                                                            Quiebre Stock (Stock: {formatNumber(prod.stock_actual)})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenTicketsProducto(categoria, prod.producto)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-white/10 text-[11px] font-bold cursor-pointer"
                                                >
                                                    <Receipt className="h-3.5 w-3.5" />
                                                    <span>{prod.tickets_b} tkts</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {productos.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-slate-400">
                                            No hay productos para mostrar con el filtro actual.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {productos.length > PAGE_SIZE && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                            <span>
                                Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, productos.length)} de {productos.length} productos
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={safePage <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    <span>Anterior</span>
                                </button>
                                <span className="font-bold text-slate-300 tabular-nums px-2">
                                    Página {safePage} de {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={safePage >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 disabled:opacity-40 cursor-pointer"
                                >
                                    <span>Siguiente</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
})

CategoriaPreciosDrilldown.displayName = 'CategoriaPreciosDrilldown'

export default CategoriaPreciosDrilldown
