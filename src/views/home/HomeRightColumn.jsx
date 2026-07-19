import React from 'react'
import { Wallet, ChevronRight, CheckCircle2, BrainCircuit, Eye, Zap } from 'lucide-react'

export const HomeRightColumn = ({
    reservas = [],
    saldoReservas,
    goToReservas,
    loadingDuplicados,
    duplicados = [],
    goToDuplicados,
    goToAnalisis
}) => {
    return (
        <div className="space-y-5">
            {/* Deudores / Reservas */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/5 shadow-xl animate-fade-in-up animation-delay-300">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-purple-400" />
                        <h3 className="text-sm font-black text-white tracking-tight">Saldos Pendientes</h3>
                    </div>
                    <button type="button"
                        onClick={goToReservas}
                        className="text-[10px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                        Ver todo <ChevronRight className="h-3 w-3" />
                    </button>
                </div>

                <div className="space-y-2">
                    {reservas.length === 0 ? (
                        <div className="py-5 text-center">
                            <CheckCircle2 className="h-7 w-7 text-emerald-400/50 mx-auto mb-2" />
                            <span className="text-sm font-bold text-slate-400">Sin saldos pendientes</span>
                        </div>
                    ) : (
                        reservas.slice(0, 5).map(r => (
                            <div
                                key={r.reserva_id}
                                className="flex justify-between items-center p-2.5 rounded-xl bg-white/3 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer"
                                onClick={goToReservas}
                                role="button"
                                tabIndex={0}
                                aria-label={`Ver reserva de ${r.cliente}`}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToReservas()}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <span className="text-[9px] font-black text-purple-400">{r.cliente?.charAt(0)?.toUpperCase()}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-300 truncate max-w-[100px]">{r.cliente}</span>
                                </div>
                                <span className="text-[11px] font-black text-red-400 tabular-nums">
                                    -${parseFloat(r.saldo_pendiente).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {reservas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total pendiente</span>
                        <span className="text-sm font-black text-red-400">{saldoReservas}</span>
                    </div>
                )}
            </div>

            {/* Alertas de Catálogo */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-red-500/10 relative overflow-hidden shadow-xl animate-fade-in-up animation-delay-400">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-red-400" />
                        <h3 className="text-sm font-black text-white tracking-tight">Cruce de Catálogo</h3>
                    </div>
                    {!loadingDuplicados && duplicados.length > 0 && (
                        <span className="text-[10px] font-black bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                            {duplicados.length} alertas
                        </span>
                    )}
                </div>

                <div className="space-y-2 relative z-10">
                    {loadingDuplicados ? (
                        ['sk-dup-1', 'sk-dup-2', 'sk-dup-3'].map((skKey) => <div key={skKey} className="h-14 skeleton rounded-xl" />)
                    ) : duplicados.length === 0 ? (
                        <div className="py-5 flex flex-col items-center gap-2">
                            <CheckCircle2 className="h-7 w-7 text-emerald-400/50" />
                            <span className="text-sm font-bold text-slate-400">Catálogo Optimizado</span>
                            <span className="text-[11px] text-slate-600 text-center">Sin duplicados detectados</span>
                        </div>
                    ) : (
                        duplicados.slice(0, 3).map((d) => (
                            <div
                                key={d.p1?.id ? `${d.p1.id}_${d.p2?.id || 'p2'}` : `${d.p1?.nombre || 'p1'}_${d.p2?.nombre || 'p2'}`}
                                className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                                onClick={goToDuplicados}
                                role="button"
                                tabIndex={0}
                                aria-label={`Ver duplicado de ${d.p1?.nombre}`}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToDuplicados()}
                            >
                                <div className="text-[9px] font-black uppercase tracking-wider text-red-400 mb-1">{d.reason}</div>
                                <div className="text-[11px] font-bold text-slate-300 truncate">{d.p1?.nombre}</div>
                                <div className="text-[11px] font-semibold text-slate-500 truncate">{d.p2?.nombre}</div>
                            </div>
                        ))
                    )}
                </div>

                {!loadingDuplicados && duplicados.length > 0 && (
                    <button type="button"
                        onClick={goToDuplicados}
                        className="mt-3 w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Revisar {duplicados.length > 3 ? `${duplicados.length - 3} más` : 'todos'}
                    </button>
                )}
            </div>

            {/* CTA Card: Gestión Proactiva */}
            <div
                className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 rounded-2xl text-white shadow-2xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-blue-600/30 animate-fade-in-up animation-delay-500"
                onClick={goToAnalisis}
                role="button"
                tabIndex={0}
                aria-label="Ver análisis de horarios"
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToAnalisis()}
            >
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">IA Predictiva</span>
                    </div>
                    <h3 className="text-base font-black mb-1.5">Gestión Proactiva</h3>
                    <p className="text-blue-100 text-[12px] leading-relaxed opacity-90">
                        Detectamos picos de demanda y patrones horarios. Optimizá tu stock para maximizar cierres.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-blue-200 text-[11px] font-black">
                        <span>Ver análisis</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    )
}
