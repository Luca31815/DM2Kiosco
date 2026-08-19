import React, { useState, useEffect } from 'react'
import {
    X,
    MessageSquare,
    User,
    Bot,
    Calendar,
    Clock,
    Loader2,
    ExternalLink,
    Search,
    AlertCircle,
    TrendingUp,
    ShoppingCart,
    Bookmark
} from 'lucide-react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import * as api from '../services/api'

export default function ProductHistoryModal({ product, isOpen, onClose }) {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!isOpen || !product) {
            setMessages([])
            return
        }

        let isMounted = true
        const fetchHistory = async () => {
            setLoading(true)
            try {
                const data = await api.getProductBotHistory(product.nombre)
                if (isMounted) {
                    setMessages(data || [])
                }
            } catch (err) {
                console.error('Error loading product message history:', err)
                if (isMounted) setMessages([])
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchHistory()
        return () => { isMounted = false }
    }, [isOpen, product])

    if (!isOpen || !product) return null

    const filteredMessages = messages.filter(m => {
        if (!searchTerm.trim()) return true
        const term = searchTerm.toLowerCase()
        return (
            (m.mensaje_inicial && m.mensaje_inicial.toLowerCase().includes(term)) ||
            (m.mensaje_enviado && m.mensaje_enviado.toLowerCase().includes(term)) ||
            String(m.log_id).includes(term)
        )
    })

    const detectOperationType = (text) => {
        if (!text) return null
        if (text.includes('VENTA Registrada') || text.includes('VENTA_')) return { label: 'Venta', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
        if (text.includes('COMPRA Registrada') || text.includes('COMPRA_')) return { label: 'Compra', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
        if (text.includes('RESERVA Registrada') || text.includes('RESERVA_')) return { label: 'Reserva', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        return null
    }

    return (
        <LazyMotion features={domAnimation}>
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Historial de Mensajes WhatsApp
                                        </span>
                                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            #{product.producto_id}
                                        </span>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-white truncate tracking-tight" title={product.nombre}>
                                        {product.nombre}
                                    </h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/5 transition-all active:scale-95 cursor-pointer ml-3 flex-shrink-0"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="px-6 py-3 border-b border-white/5 bg-slate-900/60 flex items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filtrar mensajes por texto o ID..."
                                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-medium"
                                />
                            </div>
                            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                                {filteredMessages.length} {filteredMessages.length === 1 ? 'mensaje' : 'mensajes'}
                            </span>
                        </div>

                        {/* Message List Body */}
                        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                                    <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                                    <span className="text-xs font-bold animate-pulse">Rastreando mensajes de WhatsApp...</span>
                                </div>
                            ) : filteredMessages.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 border border-white/5 flex items-center justify-center mx-auto mb-3">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                    <h4 className="text-sm font-black text-white">Sin mensajes registrados</h4>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                                        No se encontraron mensajes de chat en `historial_bot` que mencionen este producto directamente.
                                    </p>
                                </div>
                            ) : (
                                filteredMessages.map((msg) => {
                                    const opType = detectOperationType(msg.mensaje_enviado)
                                    const dateObj = new Date(msg.fecha)
                                    const dateStr = dateObj.toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })
                                    const timeStr = dateObj.toLocaleTimeString('es-AR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })

                                    return (
                                        <div
                                            key={msg.log_id}
                                            className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-colors"
                                        >
                                            {/* Meta Header */}
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-white/5 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500">Log #{msg.log_id}</span>
                                                    {opType && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${opType.color}`}>
                                                            {opType.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar className="h-3 w-3 text-slate-500" />
                                                    <span>{dateStr}</span>
                                                    <Clock className="h-3 w-3 text-slate-500 ml-1" />
                                                    <span>{timeStr}</span>
                                                </div>
                                            </div>

                                            {/* Conversación / Mensajes */}
                                            <div className="space-y-2.5">
                                                {/* Mensaje Inicial (Usuario WhatsApp) */}
                                                {msg.mensaje_inicial && (
                                                    <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                                                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                                                            <User className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                                                                Mensaje Usuario (WhatsApp):
                                                            </span>
                                                            <p className="text-xs text-emerald-100 font-medium whitespace-pre-wrap leading-relaxed">
                                                                {msg.mensaje_inicial}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Mensaje Enviado (Respuesta del Bot) */}
                                                {msg.mensaje_enviado && (
                                                    <div className="flex items-start gap-2.5 bg-slate-900/80 border border-white/5 rounded-xl p-3">
                                                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                                                            <Bot className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block mb-0.5">
                                                                Respuesta del Sistema / Bot:
                                                            </span>
                                                            <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed text-[11px]">
                                                                {msg.mensaje_enviado}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-slate-950/40 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </m.div>
                </div>
            </AnimatePresence>
        </LazyMotion>
    )
}
