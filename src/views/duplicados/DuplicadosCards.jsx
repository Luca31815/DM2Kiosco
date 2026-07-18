import React from 'react'
import { Tag, Loader2, CheckCircle2, EyeOff } from 'lucide-react'

export const DuplicateCard = ({ d, uniqueKey, selections, setSelections, handleMergeSelection, ignoreSQL, setAiDuplicates, mergingId }) => {
    const id1 = String(d.p1.producto_id || d.p1.id || '')
    const id2 = String(d.p2.producto_id || d.p2.id || '')

    return (
        <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden group border border-white/5 hover:border-red-500/20 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-red-500/10 transition-colors" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                            {d.reason || 'Sugerencia de Fusión'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                            <Tag className="h-4 w-4" />
                            ${parseFloat(d.p1.ultimo_precio_venta || d.p1.precio_venta || 0).toLocaleString('es-AR')}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            onClick={() => setSelections(prev => ({ ...prev, [uniqueKey]: 'p1' }))}
                            role="button"
                            tabIndex={0}
                            aria-label={`Seleccionar ${d.p1.nombre} como principal`}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelections(prev => ({ ...prev, [uniqueKey]: 'p1' }))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${selections[uniqueKey] === 'p1' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                            <p className="text-lg font-bold text-white leading-tight mt-2">{d.p1.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {id1.split('-')[0]} | Stock: {d.p1.stock_actual || 0}</span>
                        </div>
                        <div 
                            onClick={() => setSelections(prev => ({ ...prev, [uniqueKey]: 'p2' }))}
                            role="button"
                            tabIndex={0}
                            aria-label={`Seleccionar ${d.p2.nombre} como principal`}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelections(prev => ({ ...prev, [uniqueKey]: 'p2' }))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${selections[uniqueKey] === 'p2' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                            <p className="text-lg font-bold text-white leading-tight mt-2">{d.p2.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {id2.split('-')[0]} | Stock: {d.p2.stock_actual || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full md:w-48 self-stretch md:self-auto justify-end">
                    <button type="button" 
                        onClick={() => handleMergeSelection(d)}
                        disabled={!selections[uniqueKey] || mergingId !== null}
                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        {(mergingId === d.p1.producto_id || mergingId === d.p2.producto_id) ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>} Fusionar aquí
                    </button>
                    <button type="button" 
                        onClick={() => {
                            ignoreSQL(id1, id2);
                            setAiDuplicates(prev => prev.filter(item => {
                                const cId1 = String(item.p1.producto_id || item.p1.id);
                                const cId2 = String(item.p2.producto_id || item.p2.id);
                                return !((cId1 === id1 && cId2 === id2) || (cId1 === id2 && cId2 === id1));
                            }));
                        }}
                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-transform active:scale-95 border border-white/5"
                    >
                        Ignorar alerta
                    </button>
                </div>
            </div>
        </div>
    )
}

export const ConflictCard = ({ d, ignoreSQL }) => {
    const id1 = String(d.p1.producto_id || d.p1.id || '')
    const id2 = String(d.p2.producto_id || d.p2.id || '')

    return (
        <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden group border border-white/5 hover:border-amber-500/20 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-2">
                            <EyeOff className="h-3 w-3" />
                            Conflicto Detectado
                        </div>
                        <span className="text-slate-400 text-sm font-medium italic">
                            {d.conflictReason}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-lg font-bold text-slate-300 leading-tight mt-2">{d.p1.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {id1.split('-')[0]}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-lg font-bold text-slate-300 leading-tight mt-2">{d.p2.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {id2.split('-')[0]}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full md:w-48 self-stretch md:self-auto justify-end">
                    <button type="button" 
                        onClick={() => ignoreSQL(id1, id2)}
                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-transform active:scale-95 border border-white/5"
                    >
                        Descartar conflicto
                    </button>
                </div>
            </div>
        </div>
    )
}
