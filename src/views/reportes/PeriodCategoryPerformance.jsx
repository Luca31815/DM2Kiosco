import React, { useMemo, useState } from 'react'
import {
    PieChart,
    TrendingUp,
    DollarSign,
    Package,
    Sparkles,
    ShoppingBag,
    CupSoda,
    Cigarette,
    Utensils,
    HeartPulse,
    Cookie,
    Candy,
    Milk,
    Popcorn,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Percent
} from 'lucide-react'
import { useReporteVentasPeriodico, useProductos } from '../../hooks/useData'
import { getPeriodDateRange } from './reportesHelpers'
import { FAMILIAS_CANONICAS, inferCategoryAndSubcategory } from '../../utils/triageClassifier'

// Mapa de íconos por nombre de categoría
const CATEGORY_ICONS = {
    'ALMACÉN Y COMESTIBLES': ShoppingBag,
    'BEBIDAS': CupSoda,
    'CIGARRILLOS Y TABACO': Cigarette,
    'COMIDAS Y ELABORADOS': Utensils,
    'FARMACIA Y CUIDADO PERSONAL': HeartPulse,
    'GALLETITAS Y BIZCOCHOS': Cookie,
    'GOLOSINAS Y CHOCOLATES': Candy,
    'LÁCTEOS Y FRESCOS': Milk,
    'LIMPIEZA DEL HOGAR': Sparkles,
    'SNACKS SALADOS': Popcorn,
    'VARIOS Y SERVICIOS': Package
}

const CATEGORY_COLORS = {
    'ALMACÉN Y COMESTIBLES': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500' },
    'BEBIDAS': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'bg-blue-500' },
    'CIGARRILLOS Y TABACO': { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', bar: 'bg-orange-500' },
    'COMIDAS Y ELABORADOS': { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', bar: 'bg-rose-500' },
    'FARMACIA Y CUIDADO PERSONAL': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    'GALLETITAS Y BIZCOCHOS': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', bar: 'bg-yellow-500' },
    'GOLOSINAS Y CHOCOLATES': { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', bar: 'bg-pink-500' },
    'LÁCTEOS Y FRESCOS': { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', bar: 'bg-sky-500' },
    'LIMPIEZA DEL HOGAR': { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400', bar: 'bg-teal-500' },
    'SNACKS SALADOS': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', bar: 'bg-purple-500' },
    'VARIOS Y SERVICIOS': { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', bar: 'bg-slate-500' }
}

export default function PeriodCategoryPerformance({ item, type }) {
    const dateRange = getPeriodDateRange(item, type)
    const [isExpanded, setIsExpanded] = useState(true)

    // Ventas de productos del periodo
    const { data: rawSales, loading: salesLoading } = useReporteVentasPeriodico({
        filterColumn: 'tipo_periodo',
        filterValue: type.toUpperCase(),
        dateColumn: 'periodo_inicio',
        dateRange,
        sortColumn: 'ganancia_total',
        sortOrder: 'desc',
        pageSize: 500
    })

    // Mapa del catálogo para categorizar con precisión
    const { data: rawProducts } = useProductos({ pageSize: 5000 })

    const productCategoryMap = useMemo(() => {
        const map = new Map()
        if (Array.isArray(rawProducts)) {
            rawProducts.forEach(p => {
                if (p.nombre) {
                    map.set(p.nombre.trim().toUpperCase(), {
                        categoria: p.categoria,
                        subcategoria: p.subcategoria
                    })
                }
            })
        }
        return map
    }, [rawProducts])

    // Agrupación y cálculo por categoría
    const categoriesData = useMemo(() => {
        if (!rawSales || !rawSales.length) return []

        const catMap = {}

        rawSales.forEach(row => {
            const prodName = (row.producto || '').trim().toUpperCase()
            let cat = 'VARIOS Y SERVICIOS'

            if (productCategoryMap.has(prodName)) {
                const info = productCategoryMap.get(prodName)
                if (info.categoria && info.categoria !== 'SIN_CATEGORIA') {
                    cat = info.categoria
                }
            } else {
                // Fallback con inferencia NLP local
                const inferred = inferCategoryAndSubcategory(prodName)
                if (inferred?.categoria) {
                    cat = inferred.categoria
                }
            }

            if (!catMap[cat]) {
                catMap[cat] = {
                    categoria: cat,
                    total_bruto: 0,
                    total_neto: 0,
                    unidades: 0,
                    cant_productos: new Set()
                }
            }

            catMap[cat].total_bruto += Number(row.recaudacion_total || 0)
            catMap[cat].total_neto += Number(row.ganancia_total || 0)
            catMap[cat].unidades += Number(row.cantidad_total || 0)
            catMap[cat].cant_productos.add(prodName)
        })

        const list = Object.values(catMap).map(c => {
            const bruto = c.total_bruto
            const neto = c.total_neto
            const margenPct = bruto > 0 ? (neto / bruto) * 100 : 0
            return {
                categoria: c.categoria,
                total_bruto: bruto,
                total_neto: neto,
                unidades: c.unidades,
                cant_productos: c.cant_productos.size,
                margenPct
            }
        })

        return list.sort((a, b) => b.total_bruto - a.total_bruto)
    }, [rawSales, productCategoryMap])

    const totals = useMemo(() => {
        return categoriesData.reduce(
            (acc, curr) => ({
                bruto: acc.bruto + curr.total_bruto,
                neto: acc.neto + curr.total_neto,
                unidades: acc.unidades + curr.unidades
            }),
            { bruto: 0, neto: 0, unidades: 0 }
        )
    }, [categoriesData])

    if (salesLoading) {
        return (
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="w-36 h-4 bg-white/5 rounded animate-pulse" />
                    <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (!categoriesData.length) {
        return null // No renderizar si no hubo ventas en el periodo
    }

    const maxBruto = categoriesData[0]?.total_bruto || 1

    return (
        <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 space-y-4 hover:border-white/10 transition-all">
            {/* Header del Panel */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <PieChart className="h-4 w-4" />
                    </div>
                    <div>
                        <h5 className="text-[11px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                            Ganancia y Rendimiento por Categoría
                        </h5>
                        <p className="text-[10px] text-slate-400 font-bold">
                            Total Bruto (Recaudación) vs Total Neto (Ganancia Real)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5 font-black">
                        <span className="text-slate-400">Bruto: <strong className="text-white tabular-nums">${Math.floor(totals.bruto).toLocaleString('es-AR')}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">Neto: <strong className="text-emerald-400 tabular-nums">${Math.floor(totals.neto).toLocaleString('es-AR')}</strong></span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
                        title={isExpanded ? 'Colapsar categorías' : 'Expandir categorías'}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Grid de Categorías */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {categoriesData.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.categoria] || Package
                        const color = CATEGORY_COLORS[cat.categoria] || {
                            bg: 'bg-slate-500/10',
                            border: 'border-slate-500/20',
                            text: 'text-slate-400',
                            bar: 'bg-slate-500'
                        }
                        const shareBrutoPct = Math.round((cat.total_bruto / maxBruto) * 100)

                        return (
                            <div
                                key={cat.categoria}
                                className="relative overflow-hidden bg-slate-900/80 border border-white/5 hover:border-white/15 p-3.5 rounded-2xl transition-all space-y-3 group"
                            >
                                {/* Barra visual de participación sobre el top */}
                                <div
                                    className={`absolute left-0 top-0 bottom-0 opacity-5 transition-all duration-500 ${color.bar}`}
                                    style={{ width: `${shareBrutoPct}%` }}
                                />

                                {/* Cabecera de Categoría */}
                                <div className="relative flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${color.bg} ${color.border} ${color.text} border`}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[11px] font-black text-white truncate tracking-tight" title={cat.categoria}>
                                            {cat.categoria}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 shrink-0">
                                        {cat.unidades} u
                                    </span>
                                </div>

                                {/* Valores Bruto vs Neto */}
                                <div className="relative grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                                    <div className="bg-white/3 p-2 rounded-xl border border-white/5">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                                            Total Bruto
                                        </span>
                                        <span className="text-xs font-black text-white tabular-nums tracking-tight">
                                            ${Math.floor(cat.total_bruto).toLocaleString('es-AR')}
                                        </span>
                                    </div>

                                    <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/15">
                                        <span className="text-[9px] text-emerald-400/80 font-bold uppercase block tracking-wider">
                                            Total Neto
                                        </span>
                                        <span className="text-xs font-black text-emerald-300 tabular-nums tracking-tight">
                                            ${Math.floor(cat.total_neto).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                </div>

                                {/* Margen y Barra de Rentabilidad */}
                                <div className="relative space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                                        <span>Margen Neto: <strong className="text-slate-300">{cat.margenPct.toFixed(1)}%</strong></span>
                                        <span>{cat.cant_productos} {cat.cant_productos === 1 ? 'prod' : 'prods'}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${cat.margenPct >= 30 ? 'bg-emerald-400' : cat.margenPct >= 15 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                            style={{ width: `${Math.min(Math.max(cat.margenPct, 0), 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
