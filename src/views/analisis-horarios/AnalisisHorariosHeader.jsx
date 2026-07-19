import React from 'react'
import { Clock, Trophy } from 'lucide-react'

export const AnalisisHorariosHeader = ({
    analysisMode,
    setAnalysisMode,
    viewType,
    setViewType,
    page,
    setPage
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className={`p-2 md:p-3 rounded-2xl ${analysisMode === 'horarios' ? 'bg-purple-500/10' : 'bg-yellow-500/10'} border border-white/5 shadow-2xl shrink-0`}>
                        {analysisMode === 'horarios' ? <Clock className="h-6 w-6 md:h-8 md:w-8 text-purple-400" /> : <Trophy className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />}
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                        {analysisMode === 'horarios' ? 'Análisis Horarios' : 'Hitos de Negocio'}
                    </span>
                </h2>
                <p className="text-slate-400 font-medium mt-1 text-sm">Inteligencia de ventas y picos de demanda.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex bg-slate-900 p-1 border border-white/10 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                    <button type="button"
                        onClick={() => setAnalysisMode('horarios')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[38px] ${analysisMode === 'horarios' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Horarios
                    </button>
                    <button type="button"
                        onClick={() => setAnalysisMode('heatmap')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[38px] ${analysisMode === 'heatmap' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Heatmap
                    </button>
                    <button type="button"
                        onClick={() => setAnalysisMode('hitos')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[38px] ${analysisMode === 'hitos' ? 'bg-yellow-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Hitos
                    </button>
                </div>

                {analysisMode === 'horarios' && (
                    <div className="flex bg-slate-900 p-1 border border-white/10 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                        {['diario', 'semanal', 'mensual'].map((type) => (
                            <button type="button"
                                key={type}
                                onClick={() => setViewType(type)}
                                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[38px] ${viewType === type ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                )}

                {analysisMode === 'hitos' && (
                    <div className="flex bg-slate-900 p-1 border border-white/10 rounded-xl gap-1 w-full sm:w-auto justify-center sm:justify-start">
                        <button type="button"
                            onClick={() => setPage(p => p + 1)}
                            className="flex-1 sm:flex-none px-3 py-2.5 rounded-lg text-[10px] font-black text-slate-400 hover:bg-white/5 transition-all min-h-[38px]"
                        >
                            Anterior
                        </button>
                        <div className="flex-1 sm:flex-none px-3 py-2 text-[10px] font-black text-yellow-500 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center min-h-[38px]">
                            Período {page}
                        </div>
                        <button type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`flex-1 sm:flex-none px-3 py-2.5 rounded-lg text-[10px] font-black transition-all min-h-[38px] ${page === 1 ? 'opacity-20' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            Sig.
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
