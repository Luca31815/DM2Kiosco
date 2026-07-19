import React from 'react'
import { ShieldCheck, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'

export const CarteraCronAuditPanel = ({
    handleRunCron,
    isExecutingCron,
    cronResult
}) => {
    return (
        <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Cron de Auditoría</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                            <ShieldCheck size={10} />
                            Programado pg_cron
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">
                        La tarea automática `auditoria_reemplazos_metodos_pago_diaria` se ejecuta a las 3:15 AM y corrige desvíos residuales.
                    </p>
                </div>
                <button type="button"
                    onClick={handleRunCron}
                    disabled={isExecutingCron}
                    className="px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/10 text-blue-400 disabled:opacity-50 hover:text-blue-300 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-2"
                >
                    {isExecutingCron ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                    Forzar Auditoría Manual
                </button>
            </div>

            {/* Audit details / logs output */}
            <AnimatePresence>
                {cronResult && (
                    <m.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        style={{ originY: 0 }}
                        className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-3"
                    >
                        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                            <span className="flex items-center gap-1.5 text-slate-300">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                Auditoría finalizada con éxito.
                            </span>
                            <span>Ejecutado: {new Date(cronResult.ejecutado_en).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white">{cronResult.movimientos_actualizados}</span>
                            <span className="text-xs text-slate-400 font-medium">registros obsoletos corregidos y alineados.</span>
                        </div>

                        {cronResult.detalles?.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bitácora de cambios</span>
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar text-[11px]">
                                    {cronResult.detalles.map((det, di) => (
                                        <div key={di} className="flex justify-between items-center py-1 bg-white/3 px-3 rounded-lg border border-white/5">
                                            <div>
                                                <span className="font-bold text-slate-300 uppercase text-[9px] bg-slate-800 px-1 rounded mr-1">
                                                    {det.referencia_tipo}
                                                </span>
                                                <span className="text-slate-500 font-semibold mr-2">{det.referencia_id}</span>
                                                <span className="text-slate-400">ID Movimiento: {det.movimiento_id}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-red-400 font-bold">{det.metodo_anterior}</span>
                                                <ArrowRight size={10} className="text-slate-500" />
                                                <span className="text-green-400 font-bold">{det.metodo_nuevo}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    )
}
