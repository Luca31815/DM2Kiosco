import React from 'react'
import { Loader2, Info, RefreshCcw, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react'
import { m } from 'framer-motion'

export const SynonymModalTable = ({
    loading,
    filtered,
    conflicts,
    resolvingId,
    handleResolve,
    handleDelete
}) => {
    return (
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
                <table className="w-full text-left text-sm border-collapse" style={{ minWidth: '700px' }}>
                    <thead className="bg-white/[0.01] sticky top-0 backdrop-blur-md border-b border-white/5">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <th className="px-6 py-4">Variante (Alias)</th>
                            <th className="px-6 py-4">Destino (Nombre Oficial)</th>
                            <th className="px-6 py-4">Estado / Conflicto</th>
                            <th className="px-6 py-4 text-right">Resolución</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((s, idx) => {
                            const conflict = conflicts.find(c => c.alias === s.alias)
                            return (
                                <m.tr 
                                    key={s.alias}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.005 }}
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
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
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
                                                className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </m.tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}
