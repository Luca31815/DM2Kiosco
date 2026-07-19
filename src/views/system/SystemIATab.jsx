import React from 'react'
import { Clock, Database, ArrowRight } from 'lucide-react'
import { DailyAISummary } from '../../components/system/DailyAISummary'

export const SystemIATab = ({
    summaryType,
    setSummaryType,
    aiSummaries,
    loadingAI,
    formatDate
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
                {['diario', 'semanal', 'mensual'].map(type => (
                    <button type="button"
                        key={type}
                        onClick={() => setSummaryType(type)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${summaryType === type
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <DailyAISummary data={aiSummaries?.data} isLoading={loadingAI} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-cyan-400">
                        <Clock className="h-5 w-5" />
                        <h4 className="font-bold tracking-tight">Historial de Resúmenes</h4>
                    </div>
                    <div className="space-y-3">
                        {aiSummaries?.data?.slice(1).map((s) => (
                            <div key={s.id || s.fecha || s.contenido} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">{formatDate(s.fecha)}</span>
                                    <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{s.contenido.substring(0, 100)}...</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl border border-blue-500/10 space-y-4">
                    <div className="flex items-center gap-3 text-blue-400">
                        <Database className="h-5 w-5" />
                        <h4 className="font-bold tracking-tight">Estado del Auditor</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        El motor de IA analiza todos los cambios significativos guardados en la tabla de auditoría,
                        filtrando el ruido técnico para ofrecerte una visión clara del negocio.
                    </p>
                    <div className="pt-2">
                        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                            <span>Cobertura</span>
                            <span>100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
