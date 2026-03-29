import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Package, Tag, ArrowUpRight, Search, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import { useSWRConfig } from 'swr'
import { toast } from 'react-hot-toast'
import * as api from '../services/api'
import { useProductosDuplicados } from '../hooks/useData'

const DuplicadosView = () => {
    const navigate = useNavigate()
    const { mutate } = useSWRConfig()
    const { data: duplicados, loading, ignoreDuplicate } = useProductosDuplicados()
    const [searchTerm, setSearchTerm] = useState('')
    const [mergingId, setMergingId] = useState(null)

    const handleMerge = async (keepProduct, deleteProduct) => {
        if (!confirm(`¿Estás seguro de que deseas conservar "${keepProduct.nombre}" y ELIMINAR/ABSORBER el producto duplicado? Esta acción transferirá histórico de ventas y unificará stock, es IRREVERSIBLE.`)) {
            return;
        }

        const dataToSend = {
            producto_id: deleteProduct.producto_id || deleteProduct.id,
            nombre: keepProduct.nombre?.trim().toUpperCase(),
            ultimo_precio_venta: parseFloat(keepProduct.ultimo_precio_venta || deleteProduct.ultimo_precio_venta || 0),
            ultimo_costo_compra: parseFloat(keepProduct.ultimo_costo_compra || deleteProduct.ultimo_costo_compra || 0),
            stock_actual: parseInt(deleteProduct.stock_actual || 0)
        }

        const loadingToast = toast.loading(`Fusionando con "${keepProduct.nombre}"...`)
        setMergingId(deleteProduct.producto_id || deleteProduct.id)
        
        try {
            const result = await api.actualizarProducto(dataToSend)
            if (result.success) {
                toast.success('¡Unificación exitosa! El catálogo se ha limpiado.', { id: loadingToast, duration: 4000 })
                mutate(key => Array.isArray(key) && key[0] === 'productos')
                mutate('ventas')
                mutate('compras')
                mutate('reservas')
            } else {
                toast.error('Error: ' + result.error, { id: loadingToast })
            }
        } catch (error) {
            toast.error('Error de red: ' + (error.message || 'Desconocido'), { id: loadingToast })
        } finally {
            setMergingId(null)
        }
    }

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
                                                <button 
                                                    onClick={() => handleMerge(d.p1, d.p2)}
                                                    disabled={mergingId !== null}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 border border-emerald-500/20"
                                                >
                                                    {mergingId === (d.p2.producto_id || d.p2.id) ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle2 className="h-3 w-3"/>} Conservar A
                                                </button>
                                            </div>
                                            <p className="text-lg font-bold text-white leading-tight mt-2">{d.p1.nombre}</p>
                                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {String(d.p1.producto_id || d.p1.id || '').split('-')[0]} | Stock: {d.p1.stock_actual || 0}</span>
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
                                                <button 
                                                    onClick={() => handleMerge(d.p2, d.p1)}
                                                    disabled={mergingId !== null}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 border border-emerald-500/20"
                                                >
                                                    {mergingId === (d.p1.producto_id || d.p1.id) ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle2 className="h-3 w-3"/>} Conservar B
                                                </button>
                                            </div>
                                            <p className="text-lg font-bold text-slate-300 leading-tight mt-2">{d.p2.nombre}</p>
                                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {String(d.p2.producto_id || d.p2.id || '').split('-')[0]} | Stock: {d.p2.stock_actual || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-col md:flex-row gap-2 shrink-0 w-full md:w-auto self-stretch md:self-auto justify-end">
                                    <button 
                                        onClick={() => ignoreDuplicate(d.p1.producto_id || d.p1.id, d.p2.producto_id || d.p2.id)}
                                        className="w-full md:w-auto flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-transform active:scale-95 border border-white/5"
                                        title="Ocultar esta alerta permanentemente"
                                    >
                                        Ignorar <EyeOff className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => navigate('/productos', { state: { search: d.p1.nombre } })}
                                        className="w-full md:w-auto flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
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
