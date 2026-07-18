import React from 'react'
import { m } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const dateOnlyFormatter = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })

export const DailyAISummary = ({ data, isLoading }) => {
    if (isLoading) return <div className="h-32 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 animate-pulse text-xs text-slate-400">Cargando inteligencia...</div>
    if (!data || data.length === 0) return (
        <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <Sparkles className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No hay resúmenes de inteligencia generados aún.</p>
        </div>
    )

    const latest = data[0]

    return (
        <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent -z-10" />
            <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/10 backdrop-blur-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Sparkles className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight italic">Resumen del Auditor IA</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{latest.fecha ? dateOnlyFormatter.format(new Date(latest.fecha)) : '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-medium">
                    <ReactMarkdown>{latest.contenido}</ReactMarkdown>
                </div>
            </div>
        </m.div>
    )
}
