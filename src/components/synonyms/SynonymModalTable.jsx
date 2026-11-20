import React, { useState, useMemo, useEffect } from 'react'
import { Loader2, Info, RefreshCcw, AlertTriangle, CheckCircle2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 50
const EMPTY_ARRAY = []
const TABLE_MIN_WIDTH_STYLE = { minWidth: '700px' }

export const SynonymModalTable = React.memo(({
    loading,
    filtered = EMPTY_ARRAY,
    conflicts = EMPTY_ARRAY,
    conflictMap,
    resolvingId,
    handleResolve,
    handleDelete
}) => {
    const [page, setPage] = useState(1)

    useEffect(() => {
        setPage(1)
    }, [filtered.length])

    const resolvedConflictMap = useMemo(() => {
        if (conflictMap) return conflictMap
        const map = new Map()
        for (let i = 0; i < conflicts.length; i++) {
            map.set(conflicts[i].alias, conflicts[i])
        }
        return map
    }, [conflictMap, conflicts])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filtered.slice(start, start + PAGE_SIZE)
    }, [filtered, currentPage])

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        <span className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Ejecutando auditoría recursiva...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50">
                        <Info className="h-10 w-10 mb-2" />
                        <span className="text-sm italic">No se encontraron incidencias en el catálogo.</span>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm border-collapse" style={TABLE_MIN_WIDTH_STYLE}>
                        <thead className="bg-slate-900/95 sticky top-0 border-b border-white/5 z-10">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <th className="px-6 py-4">Variante (Alias)</th>
                                <th className="px-6 py-4">Destino (Nombre Oficial)</th>
                                <th className="px-6 py-4">Estado / Conflicto</th>
                                <th className="px-6 py-4 text-right">Resolución</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedRows.map((s) => {
                                const conflict = resolvedConflictMap.get(s.alias)
                                return (
                                    <tr 
                                        key={s.alias}
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-4 font-black text-slate-200 uppercase tracking-tight">{s.alias}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-400 font-medium">{s.nombre_oficial}</span>
                                                {conflict?.flatten_target && (
                                                    <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mt-0.5">
                                                        <RefreshCcw size={10} className="animate-spin-slow" />
                                                        Sugerencia: Re-vincular a {conflict.flatten_target}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {conflict ? (
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    conflict.tipo_conflicto === 'COLISION' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                                                    conflict.tipo_conflicto === 'HUERFANO' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' :
                                                    'bg-slate-500/10 text-slate-500 border border-white/10'
                                                }`}>
                                                    <AlertTriangle className="h-2.5 w-2.5" />
                                                    {conflict.tipo_conflicto}
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                    ESTABLE
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {conflict && (
                                                    <button type="button" 
                                                        disabled={resolvingId === conflict.alias}
                                                        onClick={() => handleResolve(conflict)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 ${
                                                            conflict.tipo_conflicto === 'COLISION' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                                                            (conflict.tipo_conflicto === 'HUERFANO' && conflict.flatten_target) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' :
                                                            'bg-slate-800 text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {resolvingId === conflict.alias ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                                                        {conflict.tipo_conflicto === 'COLISION' ? 'Fusionar' : 
                                                         (conflict.flatten_target ? 'Aplanar' : 'Corregir')}
                                                    </button>
                                                )}
                                                <button type="button" 
                                                    onClick={() => handleDelete(s.alias)}
                                                    title="Eliminar de forma permanente"
                                                    aria-label={`Eliminar sinónimo ${s.alias}`}
                                                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && totalPages > 1 && (
                <div className="px-6 py-3 bg-slate-900/95 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">
                        Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} ({currentPage}/{totalPages})
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} />
                            Anterior
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            Siguiente
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
})
SynonymModalTable.displayName = 'SynonymModalTable'
