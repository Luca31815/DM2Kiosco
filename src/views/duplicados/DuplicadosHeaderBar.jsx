import React from 'react'
import { AlertCircle, Loader2, Sparkles, Copy, Trash2 } from 'lucide-react'

export const DuplicadosHeaderBar = ({
    handleAiScan,
    isAiScanning,
    aiDuplicatesLength,
    handleCopyAiReport,
    handleCleanup,
    duplicadosCount
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-red-500" />
                    Incidencias de Catálogo
                </h2>
                <p className="text-slate-400 font-medium mt-1 text-sm">Análisis de posibles productos duplicados o redundantes.</p>
            </div>
            {/* Contadores y Botón IA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button type="button" 
                    onClick={handleAiScan}
                    disabled={isAiScanning}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-95 disabled:opacity-50 min-h-[44px]"
                >
                    {isAiScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    <span>Auditoría IA</span>
                </button>
                {aiDuplicatesLength > 0 && (
                    <button type="button" 
                        onClick={handleCopyAiReport}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all active:scale-95 min-h-[44px]"
                        title="Copiar reporte técnico para soporte"
                    >
                        <Copy className="h-5 w-5" />
                    </button>
                )}
                <button type="button" 
                    onClick={handleCleanup}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-red-400 rounded-xl font-bold transition-all active:scale-95 min-h-[44px]"
                    title="Eliminar productos que no tienen ventas, compras ni reservas"
                >
                    <Trash2 className="h-5 w-5" />
                    <span>Limpiar Huérfanos</span>
                </button>
                <div className="flex items-center gap-2 px-4 py-3 md:py-2 bg-red-500/10 border border-red-500/20 rounded-xl justify-center min-h-[44px]">
                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">{duplicadosCount} Alertas</span>
                </div>
            </div>
        </div>
    )
}
