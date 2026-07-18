import React from 'react'
import { ArrowRight, RefreshCw, Trash2, X } from 'lucide-react'

export const CarteraRulesPanel = ({
    handleCreateRule,
    origMethodRule,
    setOrigMethodRule,
    showCustomOrig,
    setShowCustomOrig,
    customOrigRule,
    setCustomOrigRule,
    destMethodRule,
    setDestMethodRule,
    showCustomDest,
    setShowCustomDest,
    customDestRule,
    setCustomDestRule,
    uniqueMethods,
    loadingReglas,
    reglas,
    handleDeleteRule
}) => {
    return (
        <div className="space-y-6">
            {/* Add Rule Form */}
            <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5 space-y-6">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Reemplazar Método Masivamente</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Convierte de forma masiva un método de pago en otro e instala un convertidor automático permanente.
                    </p>
                </div>

                <form onSubmit={handleCreateRule} className="space-y-4">
                    {/* Original Method */}
                    <div className="space-y-1.5">
                        <label htmlFor="orig-method-rule" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Método Original (Origen)</label>
                        {!showCustomOrig ? (
                            <div className="flex gap-2">
                                <select 
                                    id="orig-method-rule"
                                    value={origMethodRule}
                                    onChange={e => setOrigMethodRule(e.target.value)}
                                    className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                >
                                    <option value="">Selecciona método existente...</option>
                                    {uniqueMethods.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    onClick={() => { setShowCustomOrig(true); setOrigMethodRule(''); }}
                                    className="px-3 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded-xl transition-all"
                                >
                                    Otro
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Escribe método original (ej: mp)..."
                                    aria-label="Escribe método original"
                                    value={customOrigRule}
                                    onChange={e => setCustomOrigRule(e.target.value)}
                                    className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                                <button 
                                    type="button"
                                    onClick={() => { setShowCustomOrig(false); setCustomOrigRule(''); }}
                                    aria-label="Cancelar método personalizado"
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Destination Method */}
                    <div className="space-y-1.5">
                        <label htmlFor="dest-method-rule" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Método de Reemplazo (Destino)</label>
                        {!showCustomDest ? (
                            <div className="flex gap-2">
                                <select 
                                    id="dest-method-rule"
                                    value={destMethodRule}
                                    onChange={e => setDestMethodRule(e.target.value)}
                                    className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                >
                                    <option value="">Selecciona método existente...</option>
                                    {uniqueMethods.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    onClick={() => { setShowCustomDest(true); setDestMethodRule(''); }}
                                    className="px-3 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded-xl transition-all"
                                >
                                    Otro
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Escribe método de destino (ej: Mercado Pago)..."
                                    aria-label="Escribe método de destino"
                                    value={customDestRule}
                                    onChange={e => setCustomDestRule(e.target.value)}
                                    className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                                <button 
                                    type="button"
                                    onClick={() => { setShowCustomDest(false); setCustomDestRule(''); }}
                                    aria-label="Cancelar método de destino personalizado"
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        <ArrowRight size={16} />
                        Ejecutar Reemplazo y Crear Regla
                    </button>
                </form>
            </div>

            {/* Active Rules List */}
            <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5 space-y-4">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Reglas Automáticas Activas</h3>
                    <p className="text-xs text-slate-500 mt-1">Reglas permanentes instaladas en el motor de base de datos.</p>
                </div>

                {loadingReglas ? (
                    <div className="flex justify-center py-6"><RefreshCw className="animate-spin text-blue-500" /></div>
                ) : reglas?.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 italic bg-white/3 rounded-xl border border-white/5 text-xs">
                        Sin reglas automáticas configuradas.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 bg-white/3 rounded-xl border border-white/5 overflow-hidden">
                        {reglas?.map(regla => (
                            <div key={regla.metodo_origen} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                                        {regla.metodo_origen}
                                    </span>
                                    <ArrowRight size={12} className="text-slate-500" />
                                    <span className="font-bold text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/10">
                                        {regla.metodo_destino}
                                    </span>
                                </div>
                                <button type="button" 
                                    onClick={() => handleDeleteRule(regla.metodo_origen)}
                                    className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                                    title="Eliminar regla automática"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
