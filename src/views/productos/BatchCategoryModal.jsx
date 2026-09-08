import React, { useState, useMemo } from 'react'
import { FolderEdit, Check, X, Loader2, Tag, AlertCircle } from 'lucide-react'

export const BatchCategoryModal = ({
    isOpen,
    onClose,
    onConfirm,
    selectedCount = 0,
    categorias = [],
    subcategoriasPorCategoria = {},
    isUpdating = false
}) => {
    const [targetCategoria, setTargetCategoria] = useState('')
    const [targetSubcategoria, setTargetSubcategoria] = useState('')

    const availableSubcats = useMemo(() => {
        if (!targetCategoria || targetCategoria === 'SIN_CATEGORIA') return []
        return subcategoriasPorCategoria[targetCategoria] || []
    }, [targetCategoria, subcategoriasPorCategoria])

    if (!isOpen) return null

    const handleCategoryChange = (e) => {
        const cat = e.target.value
        setTargetCategoria(cat)
        setTargetSubcategoria('')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!targetCategoria) return
        onConfirm({
            categoria: targetCategoria,
            subcategoria: targetSubcategoria || null
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                            <FolderEdit className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-white">
                                Asignar Categoría en Lote
                            </h3>
                            <p className="text-xs text-slate-400">
                                Modificar masivamente {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                            Nueva Categoría
                        </label>
                        <select
                            value={targetCategoria}
                            onChange={handleCategoryChange}
                            required
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                        >
                            <option value="">-- Selecciona una categoría --</option>
                            {categorias.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="SIN_CATEGORIA">SIN_CATEGORIA (Quitar categoría)</option>
                        </select>
                    </div>

                    {availableSubcats.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Subcategoría
                            </label>
                            <select
                                value={targetSubcategoria}
                                onChange={(e) => setTargetSubcategoria(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-200 outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                            >
                                <option value="">General / Sin subcategoría</option>
                                {availableSubcats.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>
                            Esta acción actualizará la categoría en el catálogo de los <strong>{selectedCount}</strong> productos seleccionados de forma atómica.
                        </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUpdating}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating || !targetCategoria}
                            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Actualizando...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    <span>Aplicar a {selectedCount} productos</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default BatchCategoryModal
