import React from 'react'
import { Zap, CheckCircle2, AlertTriangle, Sparkles, Plus, Coins, Edit2, Trash2 } from 'lucide-react'

export const OperationConciliationAssistant = ({
    isConciliado,
    absDiferencia,
    diferencia,
    payments,
    totalCabecera,
    totalPagos,
    isSaving,
    handleAlinearPagoACabecera,
    handleCreateDifferencePayment,
    handleAdjustLastPayment,
    handleAlinearCabeceraAPagos,
    handleResetAndCreateSinglePayment
}) => {
    return (
        <div className={`p-4 rounded-xl border transition-all duration-200 ${
            isConciliado 
                ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-amber-950/10 border-amber-500/20 text-amber-300'
        }`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <Zap className={`w-4 h-4 ${isConciliado ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                            Asistente de Conciliación Rápida
                        </h4>
                    </div>
                    {isConciliado ? (
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Esta operación está perfectamente conciliada. La cabecera y los movimientos de caja coinciden.
                        </p>
                    ) : (
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Se detectó un desajuste de <span className="font-mono font-bold text-rose-450">${absDiferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>. 
                            La caja chica tiene {diferencia > 0 ? 'de menos' : 'de más'} dinero con respecto a la factura.
                        </p>
                    )}
                </div>
                {isConciliado ? (
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase text-emerald-400 self-start sm:self-auto">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Conciliado</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold uppercase text-rose-400 self-start sm:self-auto">
                        <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                        <span>Desajustado</span>
                    </div>
                )}
            </div>

            {!isConciliado && (
                <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-800/40">
                    {payments.length === 1 && (
                        <button type="button"
                            onClick={handleAlinearPagoACabecera}
                            disabled={isSaving}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all text-xs font-medium border border-emerald-500/20 shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Alinear pago a Cabecera (${totalCabecera.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                        </button>
                    )}

                    {diferencia > 0 && (
                        <button type="button"
                            onClick={() => handleCreateDifferencePayment(diferencia)}
                            disabled={isSaving}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-all text-xs font-medium border border-violet-500/20 shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Crear pago por la diferencia (${diferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                        </button>
                    )}

                    {payments.length > 0 && (
                        <button type="button"
                            onClick={() => handleAdjustLastPayment(diferencia)}
                            disabled={isSaving}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all text-xs font-medium border border-blue-500/20 shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Ajustar último pago</span>
                        </button>
                    )}

                    <button type="button"
                        onClick={() => handleAlinearCabeceraAPagos(totalPagos)}
                        disabled={isSaving}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 transition-all text-xs font-medium border border-slate-700 shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Ajustar Cabecera a total pagos (${totalPagos.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                    </button>

                    {payments.length > 0 && (
                        <button type="button"
                            onClick={() => handleResetAndCreateSinglePayment(totalCabecera)}
                            disabled={isSaving}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 disabled:opacity-50 text-rose-300 transition-all text-xs font-medium border border-rose-500/25 shadow-md active:scale-95"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Reemplazar todo con pago único (${totalCabecera.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
