import React, { useState, useEffect, useMemo } from 'react'
import { X, Search, AlertTriangle, CheckCircle2, Trash2, Loader2, Info, Filter, RefreshCcw, Check, Sparkles } from 'lucide-react'
import * as api from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const SynonymManagerModal = ({ isOpen, onClose }) => {
    const [synonyms, setSynonyms] = useState([])
    const [conflicts, setConflicts] = useState([])
    const [loading, setLoading] = useState(true)
    const [resolvingId, setResolvingId] = useState(null)
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
            toast.success('Sinónimo eliminado')
        } catch (err) {
            toast.error('Error al eliminar')
        }
    }

    const handleResolve = async (conflict, skipConfirm = false) => {
        setResolvingId(conflict.alias)
        try {
            if (conflict.tipo_conflicto === 'COLISION') {
                // Fusión de productos (Estilo duplicados)
                if (!skipConfirm && !confirm(`¿Resolver COLISIÓN? El producto real "${conflict.alias}" será FUSIONADO con "${conflict.nombre_oficial}". Unificaremos stocks e historiales.`)) {
                    setResolvingId(null)
                    return
                }

                const data = {
                    producto_id: conflict.alias_id,
                    nombre: conflict.nombre_oficial,
                    p_guardar_alias: true
                }
                const res = await api.actualizarProducto(data)
                if (res.success) {
                    toast.success(`Fusión "${conflict.alias}" -> "${conflict.nombre_oficial}" ok`)
                    if (!skipConfirm) loadData()
                } else throw new Error(res.error)

            } else if (conflict.tipo_conflicto === 'HUERFANO' && conflict.flatten_target) {
                // Aplanamiento automático (A -> B moved to C)
                if (!skipConfirm && !confirm(`¿Vincular a nuevo destino? El producto oficial desapareció, pero detectamos que fue fusionado con "${conflict.flatten_target}".`)) {
                    setResolvingId(null)
                    return
                }
                await api.registrarSinonimo(conflict.alias, conflict.flatten_target)
                toast.success(`Redirección "${conflict.alias}" -> "${conflict.flatten_target}" ok`)
                if (!skipConfirm) loadData()
            } else if (conflict.tipo_conflicto === 'REDUNDANTE') {
                await api.borrarSinonimo(conflict.alias)
                toast.success('Redundancia eliminada')
                if (!skipConfirm) loadData()
            }
        } catch (err) {
            toast.error('Error al resolver: ' + err.message)
        } finally {
            setResolvingId(null)
        }
    }

    const filtered = useMemo(() => {
        const source = (view === 'all' ? synonyms : conflicts)
        return source.filter(s => 
            s.alias.toLowerCase().includes(filter.toLowerCase()) || 
            s.nombre_oficial.toLowerCase().includes(filter.toLowerCase())
        )
    }, [view, synonyms, conflicts, filter])

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
                className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Sparkles className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight text-shadow-glow">Diccionario de Inteligencia</h3>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Auditoría y Resolución de Conflictos</p>
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
                            DICCIONARIO ({synonyms.length})
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
                            className="w-full bg-slate-800/40 border border-white/5 rounded-xl pl-11 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {view === 'conflicts' && !loading && (
                    <AnimatePresence>
                        {Object.entries(
                            conflicts.reduce((acc, c) => {
                                acc[c.nombre_oficial] = acc[c.nombre_oficial] || [];
                                acc[c.nombre_oficial].push(c);
                                return acc;
                            }, {})
                        ).filter(([_, group]) => group.length > 1).map(([dest, group]) => (
                            <motion.div 
                                key={`bulk-${dest}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-amber-500/20 rounded-lg">
                                        <AlertTriangle size={14} className="text-amber-500" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300">
                                        Hay <b className="text-amber-400">{group.length}</b> conflictos apuntando a <b className="text-white">"{dest}"</b>
                                    </span>
                                </div>
                                <button 
                                    onClick={async () => {
                                        if (confirm(`¿Resolver los ${group.length} conflictos de "${dest}" en lote sin confirmaciones individuales?`)) {
                                            for (const c of group) {
                                                await handleResolve(c, true);
                                            }
                                            loadData();
                                        }
                                    }}
                                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95"
                                >
                                    <Check size={14} strokeWidth={3} />
                                    Resolver Grupo
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Table Content */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            <span className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Ejecutando auditoría recursiva...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50">
                            <Info className="h-10 w-10 mb-2" />
                            <span className="text-sm italic">No se encontraron incidencias en el catálogo.</span>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.01] sticky top-0 backdrop-blur-md border-b border-white/5">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <th className="px-6 py-4">Variante (Alias)</th>
                                    <th className="px-6 py-4">Destino (Nombre Oficial)</th>
                                    <th className="px-6 py-4">Estado / Conflicto</th>
                                    <th className="px-6 py-4 text-right">Resolución</th>
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
                                            transition={{ delay: idx * 0.005 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-4 font-black text-slate-200 uppercase tracking-tight">{s.alias}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 font-medium">{s.nombre_oficial}</span>
                                                    {conflict?.flatten_target && (
                                                        <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mt-0.5">
                                                            <RefreshCcw size={10} className="animate-spin-slow" />
                                                            Sugerencia: Re-vincular a {conflict.flatten_target}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {conflict ? (
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                        conflict.tipo_conflicto === 'COLISION' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                                                        conflict.tipo_conflicto === 'HUERFANO' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' :
                                                        'bg-slate-500/10 text-slate-500 border border-white/10'
                                                    }`}>
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                        {conflict.tipo_conflicto}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                                        ESTABLE
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {conflict && (
                                                        <button 
                                                            disabled={resolvingId === conflict.alias}
                                                            onClick={() => handleResolve(conflict)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
                                                                conflict.tipo_conflicto === 'COLISION' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                                                                (conflict.tipo_conflicto === 'HUERFANO' && conflict.flatten_target) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' :
                                                                'bg-slate-800 text-slate-400 hover:text-white'
                                                            }`}
                                                        >
                                                            {resolvingId === conflict.alias ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                                                            {conflict.tipo_conflicto === 'COLISION' ? 'Fusionar' : 
                                                             (conflict.flatten_target ? 'Aplanar' : 'Corregir')}
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDelete(s.alias)}
                                                        title="Eliminar de forma permanente"
                                                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
                            <b>COLISIÓN:</b> El alias es un producto real. La **Fusión** unifica stock e historial. <br/>
                            <b>HUÉRFANO:</b> El destino no existe. El **Aplanamiento** lo vincula al nuevo destino oficial si fue movido. <br/>
                            <b>ESTABLE:</b> El sinónimo apunta directamente a un producto del catálogo sin saltos intermedios.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default SynonymManagerModal
