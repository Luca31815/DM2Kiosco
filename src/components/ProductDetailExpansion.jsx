import React, { useState, useEffect } from 'react'
import * as api from '../services/api'
import { Loader2, Tag, TrendingUp, TrendingDown, Clock, Calendar, AlertCircle, Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'

const ProductDetailExpansion = ({ product }) => {
    const [details, setDetails] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await api.getProductIntelligence(product.nombre)
                setDetails(data)
            } catch (err) {
                console.error('Error loading product intelligence:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [product.nombre])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm font-medium animate-pulse">Consultando historial y sinónimos...</span>
            </div>
        )
    }

    if (!details) return null

    const hasSinonimos = details.sinonimos && details.sinonimos.length > 0
    const hasVentas = details.ventas && details.ventas.length > 0
    const hasCompras = details.compras && details.compras.length > 0
    const hasReservas = details.reservas && details.reservas.length > 0

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-200"
        >
            {/* Columna Izquierda: Sinónimos y Info General */}
            <div className="space-y-6">
                <div className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Bookmark className="h-3 w-3" />
                        Gestión de Sinónimos
                    </h4>
                    
                    <SynonymTable 
                        product={product} 
                        initialSinonimos={details.sinonimos || []} 
                        onUpdate={(newList) => setDetails({ ...details, sinonimos: newList })}
                    />

                    {/* Alerta de UX para errores de carga */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-3 items-start">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-amber-500/80 block">Aviso de carga</span>
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                Si esto es un error de carga (ej: pusiste Agua Chica pero era Grande), <b>borrá y recargá</b> la operación en lugar de crear un sinónimo para evitar confusiones futuras.
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Última Actividad</span>
                        <div className="flex items-center gap-2 text-slate-300">
                            <Clock className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-sm font-bold">
                                {details.ultima_actividad ? new Date(details.ultima_actividad).toLocaleString() : 'Sin registros'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Columna Central: Historial de Ventas */}
            <div className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Historial de Ventas
                </h4>
                
                {hasVentas ? (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {details.ventas.map((v, i) => (
                            <div key={i} className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-medium">#{v.ref}</span>
                                    <div className="flex items-center gap-1.5 text-white font-black text-xs">
                                        <Calendar className="h-3 w-3 text-slate-500" />
                                        {new Date(v.fecha_registro).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className="text-emerald-400 font-black tabular-nums">${v.precio_unitario}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-600">
                        <AlertCircle className="h-5 w-5 mb-2 opacity-20" />
                        <span className="text-xs italic">No hay ventas registradas</span>
                    </div>
                )}
            </div>

            {/* Columna Derecha: Historial de Compras/Reservas */}
            <div className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                    <TrendingDown className="h-3 w-3" />
                    Compras y Reservas
                </h4>

                <div className="space-y-4">
                    {/* Compras */}
                    <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2 px-1">Últimas Compras</span>
                        {hasCompras ? (
                            <div className="space-y-2">
                                {details.compras.slice(0, 5).map((c, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                                        <span className="text-[10px] text-slate-400">{new Date(c.fecha_registro).toLocaleDateString()}</span>
                                        <span className="text-amber-400 font-bold text-xs tabular-nums">${c.precio_unitario}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <span className="text-[10px] text-slate-600 italic px-1">Sin historial de compra</span>}
                    </div>

                    {/* Reservas */}
                    <div className="pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2 px-1">Precios en Reservas</span>
                        {hasReservas ? (
                            <div className="space-y-2">
                                {details.reservas.slice(0, 5).map((r, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                                        <span className="text-[10px] text-slate-400">{new Date(r.fecha_registro).toLocaleDateString()}</span>
                                        <span className="text-blue-400 font-bold text-xs tabular-nums">${r.precio_unitario}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <span className="text-[10px] text-slate-600 italic px-1">Sin historial de reservas</span>}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default ProductDetailExpansion
