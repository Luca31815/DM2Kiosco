import React, { useState, useEffect } from 'react'
import { X, Search, AlertTriangle, CheckCircle2, Trash2, Loader2, Info, Filter } from 'lucide-react'
import * as api from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'

const SynonymManagerModal = ({ isOpen, onClose }) => {
    const [synonyms, setSynonyms] = useState([])
    const [conflicts, setConflicts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [view, setView] = useState('all') // 'all' | 'conflicts'

    useEffect(() => {
        if (isOpen) loadData()
    }, [isOpen])

    const loadData = async () => {
        setLoading(true)
        try {
            const [all, conf] = await Promise.all([
                api.getProductosSinonimos(),
                api.getConflictosSinonimos()
            ])
            setSynonyms(all)
            setConflicts(conf)
        } catch (err) {
            console.error('Error loading synonyms:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (alias) => {
        try {
            await api.borrarSinonimo(alias)
            setSynonyms(s => s.filter(item => item.alias !== alias))
            setConflicts(c => c.filter(item => item.alias !== alias))
        } catch (err) {
            console.error('Error deleting:', err)
        }
    }

    const filtered = (view === 'all' ? synonyms : conflicts).filter(s => 
        s.alias.toLowerCase().includes(filter.toLowerCase()) || 
        s.nombre_oficial.toLowerCase().includes(filter.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Filter className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight text-shadow-glow">Gestión de Sinónimos</h3>
                            <p className="text-slate-500 text-xs font-medium">Administra las variantes de nombres y resuelve conflictos.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs & Search */}
                <div className="p-4 bg-white/[0.01] border-b border-white/5 flex flex-col md:flex-row gap-4">
                    <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setView('all')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            TODOS ({synonyms.length})
                        </button>
                        <button 
                            onClick={() => setView('conflicts')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view === 'conflicts' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            CONFLICTOS ({conflicts.length})
                        </button>
                    </div>

                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Buscar alias o producto oficial..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-slate-800/40 border border-white/5 rounded-xl pl-11 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            <span className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Analizando diccionario...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50">
                            <Info className="h-10 w-10 mb-2" />
                            <span className="text-sm italic">No se encontraron sinónimos bajo este filtro.</span>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.01] sticky top-0 backdrop-blur-md border-b border-white/5">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <th className="px-6 py-4">Variante (Alias)</th>
                                    <th className="px-6 py-4">Apunta a (Oficial)</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((s, idx) => {
                                    const conflict = conflicts.find(c => c.alias === s.alias)
                                    return (
                                        <motion.tr 
                                            key={s.alias}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.01 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-4 font-black text-slate-200 uppercase tracking-tight">{s.alias}</td>
                                            <td className="px-6 py-4 text-slate-400 font-medium">{s.nombre_oficial}</td>
                                            <td className="px-6 py-4">
                                                {conflict ? (
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                        conflict.tipo_conflicto === 'COLISION' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                        conflict.tipo_conflicto === 'HUERFANO' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                        'bg-slate-500/10 text-slate-500 border border-white/10'
                                                    }`}>
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                        {conflict.tipo_conflicto}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
                                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                                        OK
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(s.alias)}
                                                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-start gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                        <Info className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                            <b>COLISIÓN:</b> El alias existe también como un producto real. Puede causar ambigüedad. <br/>
                            <b>HUÉRFANO:</b> El producto oficial al que apunta ya no existe. El alias es inútil. <br/>
                            <b>REDUNDANTE:</b> El alias es idéntico al nombre oficial.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default SynonymManagerModal
