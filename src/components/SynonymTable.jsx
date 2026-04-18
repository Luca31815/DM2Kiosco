import React, { useState } from 'react'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import * as api from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'

const SynonymTable = ({ product, initialSinonimos = [], onUpdate }) => {
    const [sinonimos, setSinonimos] = useState(initialSinonimos)
    const [newAlias, setNewAlias] = useState('')
    const [loading, setLoading] = useState(null) // 'adding' | 'deleting-alias' | null

    const handleAdd = async () => {
        if (!newAlias.trim()) return
        setLoading('adding')
        try {
            await api.registrarSinonimo(newAlias, product.nombre)
            const updated = [...sinonimos, newAlias.trim().toUpperCase()]
            setSinonimos(updated)
            setNewAlias('')
            if (onUpdate) onUpdate(updated)
        } catch (err) {
            console.error('Error adding synonym:', err)
        } finally {
            setLoading(null)
        }
    }

    const handleDelete = async (alias) => {
        setLoading(alias)
        try {
            await api.borrarSinonimo(alias)
            const updated = sinonimos.filter(s => s !== alias)
            setSinonimos(updated)
            if (onUpdate) onUpdate(updated)
        } catch (err) {
            console.error('Error deleting synonym:', err)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sinónimos Registrados</span>
                <span className="text-[10px] text-slate-600 font-medium italic">{sinonimos.length} vinculados</span>
            </div>

            <div className="bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-white/5 text-slate-500 uppercase font-black text-[9px] tracking-widest border-b border-white/5">
                        <tr>
                            <th className="px-4 py-2.5">Alias / Variante</th>
                            <th className="px-4 py-2.5 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {sinonimos.map((s) => (
                                <motion.tr 
                                    key={s}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-4 py-2 font-black text-slate-300 uppercase tracking-tight">
                                        {s}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <button 
                                            onClick={() => handleDelete(s)}
                                            disabled={loading !== null}
                                            className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                                            title="Eliminar sinónimo"
                                        >
                                            {loading === s ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3 w-3" />
                                            )}
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {sinonimos.length === 0 && (
                            <tr>
                                <td colSpan="2" className="px-4 py-8 text-center text-slate-600 italic">
                                    No hay sinónimos registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Input para agregar */}
            <div className="flex gap-2">
                <div className="relative flex-1 group">
                    <input 
                        type="text"
                        value={newAlias}
                        onChange={(e) => setNewAlias(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Nuevo alias (ej: Coca Chica)"
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                    />
                </div>
                <button 
                    onClick={handleAdd}
                    disabled={loading !== null || !newAlias.trim()}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center min-w-[40px]"
                >
                    {loading === 'adding' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                </button>
            </div>
            
            <p className="px-1 text-[9px] text-slate-600 leading-relaxed italic">
                * Las búsquedas que coincidan con estos alias devolverán <b>{product.nombre}</b>.
            </p>
        </div>
    )
}

export default SynonymTable
