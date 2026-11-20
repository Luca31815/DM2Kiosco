import React, { useState, useEffect } from 'react'
import { Clock, Search, Layers, Truck, RefreshCw, X, Lock, Filter } from 'lucide-react'
import { FAMILIAS_CANONICAS } from '../../utils/familiasCatalog'
import { sanitizeComparadorFilters } from '../../services/comparadorApi'

const WINDOW_OPTIONS = [
    { dias: 15, label: '15 días' },
    { dias: 30, label: '30 días' },
    { dias: 60, label: '60 días' },
    { dias: 90, label: '90 días' }
]

const ACTIVITY_TABS = [
    { id: 'ambos', label: 'Comprados y Vendidos', countKey: 'conteo_ambos', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { id: 'solo_compras', label: 'Solo Comprados (sin venta)', countKey: 'conteo_solo_compras', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'solo_ventas', label: 'Solo Vendidos (sin compra)', countKey: 'conteo_solo_ventas', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { id: 'todos', label: 'Todos con Movimiento', countKey: 'total_items', badgeColor: 'bg-slate-700 text-slate-200 border-slate-600' }
]

const SEMAFORO_FILTERS = [
    { id: 'todos', label: 'Todos' },
    { id: 'urgente', label: '🔴 Urgente' },
    { id: 'revisar', label: '🟡 Revisar' },
    { id: 'mantener', label: '🟢 Mantener' }
]

const RadarHeaderControls = React.memo(({
    dias,
    onChangeDias,
    modo,
    onChangeModo,
    categoria,
    onChangeCategoria,
    searchInput = '',
    onApplySearch,
    onClearFilters,
    semaforoFilter,
    onChangeSemaforoFilter,
    incluirLogistica,
    onToggleLogistica,
    isAuthenticated,
    onOpenLogin,
    resumen,
    loading,
    onRefresh
}) => {
    const [draftSearch, setDraftSearch] = useState(searchInput)

    useEffect(() => {
        setDraftSearch(searchInput)
    }, [searchInput])

    const { quadrant } = sanitizeComparadorFilters({ categoria, search: draftSearch })

    const handleSubmit = (e) => {
        e.preventDefault()
        onApplySearch(draftSearch)
    }

    const handleClearAll = () => {
        setDraftSearch('')
        onClearFilters()
    }

    return (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
            {/* Fila 1: Ventana móvil + Toggle Logística 1×día por proveedor */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
                        <Clock className="h-3.5 w-3.5 text-blue-400" />
                        Ventana Móvil:
                    </span>
                    {WINDOW_OPTIONS.map((opt) => (
                        <button
                            key={opt.dias}
                            type="button"
                            onClick={() => onChangeDias(opt.dias)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                dias === opt.dias
                                    ? 'bg-blue-600/25 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                                    : 'bg-slate-900/80 text-slate-400 border-white/5 hover:text-slate-200'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Toggle Logística 1×día con soporte para modo autenticado vs solo lectura */}
                <div className="flex flex-wrap items-center gap-2">
                    {isAuthenticated ? (
                        <button
                            type="button"
                            onClick={onToggleLogistica}
                            aria-pressed={incluirLogistica}
                            title="Prorratea el único gasto logístico diario (1×día) del proveedor sobre el total comprado ese día"
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                incluirLogistica
                                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                    : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200'
                            }`}
                        >
                            <Truck className="h-4 w-4" />
                            <span>
                                Incluir logística 1×día por proveedor: {incluirLogistica ? 'ACTIVO' : 'OFF'}
                            </span>
                        </button>
                    ) : (
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs text-amber-300"
                            title="Modo solo lectura sin login: las reglas de finanzas.proveedor_gastos_logisticos requieren sesión autenticada"
                        >
                            <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Logística 1×día (requiere sesión)</span>
                            <button
                                type="button"
                                onClick={onOpenLogin}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-black text-[11px] cursor-pointer"
                            >
                                Iniciar sesión
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        aria-label="Actualizar Radar de Precios"
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Fila 2: Pestañas de Actividad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                {ACTIVITY_TABS.map((tab) => {
                    const active = modo === tab.id
                    const count = resumen?.[tab.countKey] ?? 0
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChangeModo(tab.id)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                active
                                    ? 'bg-blue-600/20 text-white border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                        >
                            <span className="truncate">{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border tabular-nums ml-2 ${tab.badgeColor}`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Fila 3: Filtros 4 Cuadrantes (Categoría + Búsqueda) + Semáforo */}
            <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 min-w-[230px]">
                    <Layers className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <select
                        aria-label="Filtrar Radar por categoría"
                        value={categoria || 'TODAS'}
                        onChange={(e) => onChangeCategoria(e.target.value === 'TODAS' ? null : e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none w-full cursor-pointer"
                    >
                        <option value="TODAS" className="bg-slate-900 text-slate-200">
                            Todas las categorías
                        </option>
                        {FAMILIAS_CANONICAS.map((fam) => (
                            <option key={fam.id} value={fam.id} className="bg-slate-900 text-slate-200">
                                {fam.label}
                            </option>
                        ))}
                        <option value="SIN_CATEGORIA" className="bg-slate-900 text-amber-300">
                            Sin Categoría
                        </option>
                    </select>
                </div>

                <div className="flex-1 flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <input
                        type="text"
                        aria-label="Buscar producto o proveedor en el Radar"
                        placeholder="Buscar por producto, categoría o proveedor (ej. Nova, El Sol, Coca)..."
                        value={draftSearch}
                        onChange={(e) => setDraftSearch(e.target.value)}
                        className="bg-transparent text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none w-full"
                    />
                    {draftSearch && (
                        <button
                            type="button"
                            aria-label="Limpiar búsqueda"
                            onClick={() => {
                                setDraftSearch('')
                                onApplySearch('')
                            }}
                            className="text-slate-400 hover:text-slate-200 p-0.5"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filtro rápido de Semáforo */}
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start xl:self-auto">
                    {SEMAFORO_FILTERS.map((sf) => (
                        <button
                            key={sf.id}
                            type="button"
                            onClick={() => onChangeSemaforoFilter(sf.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                semaforoFilter === sf.id
                                    ? 'bg-slate-800 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {sf.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                        Buscar
                    </button>
                    {(categoria || draftSearch || searchInput || semaforoFilter !== 'todos') && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/10 cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}
                    <span className="hidden 2xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400">
                        <Filter className="h-3 w-3 text-blue-400" />
                        {quadrant}
                    </span>
                </div>
            </form>
        </div>
    )
})

RadarHeaderControls.displayName = 'RadarHeaderControls'

export default RadarHeaderControls
