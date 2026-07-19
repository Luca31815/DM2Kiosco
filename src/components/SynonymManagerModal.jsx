import React, { useState, useEffect, useMemo } from 'react'
import { X, Search, AlertTriangle, CheckCircle2, Trash2, Loader2, Info, Filter, RefreshCcw, Check, Sparkles } from 'lucide-react'
import * as api from '../services/api'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { SynonymModalTable } from './synonyms/SynonymModalTable'

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
        } catch {
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
            } else if (conflict.tipo_conflicto === 'HUERFANO') {
                // Caso huérfano sin sugerencia automática
                if (!skipConfirm && !confirm(`¿Eliminar sinónimo muerto? El destino "${conflict.nombre_oficial}" no existe y no hay sugerencias de aplanamiento.`)) {
                    setResolvingId(null)
                    return
                }
                await api.borrarSinonimo(conflict.alias)
                toast.success('Sinónimo huérfano eliminado')
                if (!skipConfirm) loadData()
            }
        } catch (err) {
            toast.error('Error al resolver: ' + err.message)
        } finally {
            setResolvingId(null)
        }
    }

    const filtered = useMemo(() => {
        return synonyms.filter(s => {
            const matchesSearch = s.alias.toLowerCase().includes(filter.toLowerCase()) || 
                                  s.nombre_oficial.toLowerCase().includes(filter.toLowerCase())
            const isConflict = conflicts.some(c => c.alias === s.alias)
            if (view === 'conflicts') return matchesSearch && isConflict
            return matchesSearch
        })
    }, [synonyms, filter, conflicts, view])

    const groupedConflicts = useMemo(() => {
        const map = {}
        for (let i = 0; i < conflicts.length; i++) {
            const c = conflicts[i]
            if (!map[c.nombre_oficial]) map[c.nombre_oficial] = []
            map[c.nombre_oficial].push(c)
        }
        const result = []
        for (const dest in map) {
            if (map[dest].length > 1) {
                result.push([dest, map[dest]])
            }
        }
        return result
    }, [conflicts])

    if (!isOpen) return null

    return (
        <LazyMotion features={domAnimation}>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <m.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    role="button"
                    tabIndex={0}
                    aria-label="Cerrar modal"
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
                />
                
                <m.div 
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
                        <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs & Search */}
                    <div className="p-4 bg-white/[0.01] border-b border-white/5 flex flex-col md:flex-row gap-4">
                        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
                            <button type="button" 
                                onClick={() => setView('all')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                DICCIONARIO ({synonyms.length})
                            </button>
                            <button type="button" 
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
                                aria-label="Buscar alias o producto oficial"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full bg-slate-800/40 border border-white/5 rounded-xl pl-11 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium"
                            />
                        </div>
                    </div>

                {/* Bulk Actions Bar */}
                {view === 'conflicts' && !loading && (
                    <AnimatePresence>
                        {groupedConflicts.map(([dest, group]) => (
                            <m.div 
                                key={`bulk-${dest}`}
                                initial={{ scaleY: 0, opacity: 0 }}
                                animate={{ scaleY: 1, opacity: 1 }}
                                exit={{ scaleY: 0, opacity: 0 }}
                                style={{ originY: 0 }}
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
                                <button type="button" 
                                    onClick={async () => {
                                         if (confirm(`¿Resolver los ${group.length} conflictos de "${dest}" en lote sin confirmaciones individuales?`)) {
                                             await Promise.all(group.map(c => handleResolve(c, true)));
                                             loadData();
                                         }
                                    }}
                                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95"
                                >
                                    <Check size={14} strokeWidth={3} />
                                    Resolver Grupo
                                </button>
                            </m.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Table Content */}
                <SynonymModalTable
                    loading={loading}
                    filtered={filtered}
                    conflicts={conflicts}
                    resolvingId={resolvingId}
                    handleResolve={handleResolve}
                    handleDelete={handleDelete}
                />

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
            </m.div>
        </div>
        </LazyMotion>
    )
}

export default SynonymManagerModal
