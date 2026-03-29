import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Package, Tag, ArrowUpRight, Search } from 'lucide-react'
import { useProductosDuplicados } from '../hooks/useData'

const DuplicadosView = () => {
    const navigate = useNavigate()
    const { data: duplicados, loading } = useProductosDuplicados()
    const [searchTerm, setSearchTerm] = useState('')

    const filteredDuplicados = duplicados.filter(d => {
        const name1 = d.p1?.nombre || '';
        const name2 = d.p2?.nombre || '';
        return name1.toLowerCase().includes(searchTerm.toLowerCase()) || 
               name2.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                        Incidencias de Catálogo
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Análisis de posibles productos duplicados o redundantes.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">{duplicados.length} Alertas Activas</span>
                </div>
            </div>

            {/* Búsqueda */}
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                <Search className="h-5 w-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar producto duplicado..."
                    className="bg-transparent border-none text-white outline-none w-full font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista Principal */}
            {loading ? (
                <div className="py-20 flex justify-center items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-slate-700 border-t-red-500 animate-spin" />
                </div>
            ) : filteredDuplicados.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                        <div className="h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-pulse"></div>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">¡Catálogo Limpio!</h3>
                    <p className="text-slate-400 font-medium max-w-md">No se encontraron conflictos ni productos redundantes en la base de datos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredDuplicados.map((d, index) => (
                        <motion.div key={index} variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-transparent hover:border-red-500/20 transition-colors">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-red-500/10 transition-colors" />
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                
                                <div className="flex-1 w-full space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                            {d.reason}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                                            <Tag className="h-4 w-4" />
                                            ${parseFloat(d.p1.ultimo_precio_venta).toLocaleString('es-AR')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Producto 1 */}
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 rounded-lg bg-white/5">
                                                        <Package className="h-4 w-4 text-slate-300" />
                                                    </div>
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Producto A</span>
                                                </div>
                                                <span className="text-[10px] font-black tabular-nums text-slate-500">ID: {String(d.p1.producto_id || d.p1.id || '').split('-')[0]}</span>
                                            </div>
                                            <p className="text-lg font-bold text-white leading-tight">{d.p1.nombre}</p>
                                        </div>

                                        {/* Producto 2 */}
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 rounded-lg bg-white/5">
                                                        <Package className="h-4 w-4 text-slate-300" />
                                                    </div>
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Producto B</span>
                                                </div>
                                                <span className="text-[10px] font-black tabular-nums text-slate-500">ID: {String(d.p2.producto_id || d.p2.id || '').split('-')[0]}</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-300 leading-tight">{d.p2.nombre}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto self-stretch md:self-auto justify-end">
                                    <button 
                                        onClick={() => navigate('/productos', { state: { search: d.p1.nombre } })}
                                        className="w-full flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
                                    >
                                        Ir al Catálogo <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}

export default DuplicadosView
