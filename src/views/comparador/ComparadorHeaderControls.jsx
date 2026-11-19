import React from 'react'
import { Calendar, Search, Filter, RefreshCw, X, Activity, Layers } from 'lucide-react'
import { PERIOD_PRESETS, sanitizeComparadorFilters } from '../../services/comparadorApi'
import { FAMILIAS_CANONICAS } from '../../utils/triageClassifier'

const QUADRANT_LABELS = {
    Q1_ALL_EMPTY: 'Q1: Todo el Kiosco',
    Q2_ONLY_CAT: 'Q2: Solo Categoría',
    Q3_ONLY_SEARCH: 'Q3: Solo Búsqueda',
    Q4_CAT_AND_SEARCH: 'Q4: Categoría + Búsqueda'
}

const ComparadorHeaderControls = ({
    presetId,
    onSelectPreset,
    inicioA,
    finA,
    inicioB,
    finB,
    onChangeDate,
    normalizeByActiveDay,
    onToggleNormalize,
    categoria,
    onChangeCategoria,
    searchInput,
    onChangeSearchInput,
    onApplySearch,
    onClearFilters,
    onRefresh,
    loading,
    meta
}) => {
    const { quadrant } = sanitizeComparadorFilters({ categoria, search: searchInput })

    const handleFormSubmit = (e) => {
        e.preventDefault()
        onApplySearch()
    }

    return (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
            {/* Presets rápidos + Toggle normalización */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    {PERIOD_PRESETS.map((preset) => {
                        const active = presetId === preset.id
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => onSelectPreset(preset.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                    active
                                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                                        : 'bg-slate-900/70 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                            >
                                {preset.label}
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-2 self-start lg:self-auto">
                    <button
                        type="button"
                        onClick={onToggleNormalize}
                        aria-pressed={normalizeByActiveDay}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            normalizeByActiveDay
                                ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                                : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200'
                        }`}
                    >
                        <Activity className="h-3.5 w-3.5" />
                        <span>{normalizeByActiveDay ? 'Promedio / Día Activo' : 'Totales del Período'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        aria-label="Actualizar comparación"
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Selectores de Fecha Período A vs Período B */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                                Período Base A
                            </span>
                            {meta && (
                                <span className="text-[11px] font-semibold text-slate-400">
                                    ({meta.dias_activos_a}/{meta.dias_rango_a} días activos)
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                        <input
                            type="date"
                            aria-label="Fecha inicio Período Base A"
                            value={inicioA}
                            onChange={(e) => onChangeDate('inicioA', e.target.value)}
                            className="bg-slate-900 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-slate-500 text-xs">a</span>
                        <input
                            type="date"
                            aria-label="Fecha fin Período Base A"
                            value={finA}
                            onChange={(e) => onChangeDate('finA', e.target.value)}
                            className="bg-slate-900 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                            <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                                Período Comparado B
                            </span>
                            {meta && (
                                <span className="text-[11px] font-semibold text-blue-300/80">
                                    ({meta.dias_activos_b}/{meta.dias_rango_b} días activos)
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-400 hidden sm:block" />
                        <input
                            type="date"
                            aria-label="Fecha inicio Período Comparado B"
                            value={inicioB}
                            onChange={(e) => onChangeDate('inicioB', e.target.value)}
                            className="bg-slate-900 border border-blue-500/30 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-400"
                        />
                        <span className="text-slate-400 text-xs">a</span>
                        <input
                            type="date"
                            aria-label="Fecha fin Período Comparado B"
                            value={finB}
                            onChange={(e) => onChangeDate('finB', e.target.value)}
                            className="bg-slate-900 border border-blue-500/30 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-400"
                        />
                    </div>
                </div>
            </div>

            {/* Matriz de 4 Cuadrantes: Categoría + Búsqueda */}
            <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 min-w-[240px]">
                    <Layers className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <select
                        aria-label="Filtrar por categoría"
                        value={categoria || 'TODAS'}
                        onChange={(e) => onChangeCategoria(e.target.value === 'TODAS' ? null : e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none w-full cursor-pointer"
                    >
                        <option value="TODAS" className="bg-slate-900 text-slate-200">
                            Todas las categorías (11 familias)
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
                        aria-label="Buscar producto o rubro en el comparador"
                        placeholder="Filtrar por producto o palabra clave (ej. Coca, Marlboro, Alfajor)..."
                        value={searchInput}
                        onChange={(e) => onChangeSearchInput(e.target.value)}
                        className="bg-transparent text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none w-full"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            aria-label="Limpiar texto de búsqueda"
                            onClick={() => {
                                onChangeSearchInput('')
                                onApplySearch('')
                            }}
                            className="text-slate-400 hover:text-slate-200 p-0.5"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                        Aplicar
                    </button>

                    {(categoria || searchInput) && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/10 transition-all cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}

                    <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <Filter className="h-3 w-3 text-blue-400" />
                        {QUADRANT_LABELS[quadrant]}
                    </span>
                </div>
            </form>
        </div>
    )
}

export default ComparadorHeaderControls
