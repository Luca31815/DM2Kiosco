import React from 'react'
import { Check, X, Edit2 } from 'lucide-react'

export const OperationHeaderCard = ({
    editingCabecera,
    setEditingCabecera,
    cabeceraForm,
    setCabeceraForm,
    cabeceraOriginal,
    isSaving,
    handleSaveCabecera
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/45 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <div>
                    <span className="text-xs text-slate-400 block font-medium">Cabecera de Facturación</span>
                    <div className="flex items-center space-x-2">
                        {editingCabecera ? (
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-slate-400 font-bold text-sm">$</span>
                                <input
                                    type="number"
                                    aria-label="Monto cabecera"
                                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 w-28 text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                                    value={cabeceraForm.total}
                                    onChange={e => setCabeceraForm({ total: e.target.value })}
                                    disabled={isSaving}
                                />
                                <button type="button" onClick={handleSaveCabecera} disabled={isSaving} aria-label="Guardar cabecera" className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20">
                                    <Check className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setEditingCabecera(false)} disabled={isSaving} aria-label="Cancelar edición cabecera" className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <span className="font-mono text-sm font-bold text-slate-100 mt-0.5">
                                ${Number(cabeceraOriginal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {!editingCabecera && (
                <button type="button"
                    onClick={() => { setEditingCabecera(true); setCabeceraForm({ total: cabeceraOriginal }) }}
                    disabled={isSaving}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-750"
                >
                    <Edit2 className="w-3.5 h-3.5" /><span>Ajustar Cabecera</span>
                </button>
            )}
        </div>
    )
}
