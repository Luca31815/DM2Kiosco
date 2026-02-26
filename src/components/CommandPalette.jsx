import React, { useState, useEffect, useRef } from 'react'
import { Search, Package, User, Receipt, Calendar, ArrowRight, Loader2, Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as api from '../services/api'
import { useNavigate } from 'react-router-dom'

const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState({ products: [], clients: [], sales: [], reservations: [] })
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setResults({ products: [], clients: [], sales: [], reservations: [] })
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (query.length < 2) {
                setResults({ products: [], clients: [], sales: [], reservations: [] })
                return
            }

            setLoading(true)
            try {
                const [products, clients, sales, reservations] = await Promise.all([
                    api.getProductos({ filterValue: query, pageSize: 5 }),
                    api.getClientes({ filterColumn: 'cliente_nombre', filterValue: query, pageSize: 5 }),
                    api.getVentas({ filterColumn: 'cliente', filterValue: query, pageSize: 3 }),
                    api.getReservas({ filterColumn: 'cliente', filterValue: query, pageSize: 3 })
                ])

                setResults({
                    products: products.data || [],
                    clients: clients.data || [],
                    sales: sales.data || [],
                    reservations: reservations.data || []
                })
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(handler)
    }, [query])

    const allResults = [
        ...results.products.map(p => ({ ...p, type: 'product', icon: Package, label: p.nombre, sub: `$${p.ultimo_precio_venta}`, path: '/productos' })),
        ...results.clients.map(c => ({ ...c, type: 'client', icon: User, label: c.cliente_nombre, sub: 'Cliente', path: '/ventas' })),
        ...results.sales.map(s => ({ ...s, type: 'sale', icon: Receipt, label: `Venta #${s.venta_id}`, sub: s.cliente, path: '/ventas' })),
        ...results.reservations.map(r => ({ ...r, type: 'reservation', icon: Calendar, label: `Reserva #${r.reserva_id}`, sub: r.cliente, path: '/reservas' }))
    ]

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && allResults[selectedIndex]) {
            handleSelect(allResults[selectedIndex])
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    const handleSelect = (item) => {
        navigate(item.path)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10"
                    >
                        <div className="p-4 border-b border-white/10 flex items-center gap-3">
                            <Search className="h-5 w-5 text-slate-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Buscar productos, clientes, ventas..."
                                className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 outline-none text-lg"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-white/5 text-[10px] text-slate-500 font-black">
                                <Command className="h-3 w-3" /> K
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                            {loading && query.length >= 2 && (
                                <div className="p-8 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                                    <span className="text-sm text-slate-500 font-medium">Buscando...</span>
                                </div>
                            )}

                            {!loading && query.length >= 2 && allResults.length === 0 && (
                                <div className="p-12 text-center">
                                    <p className="text-slate-500 font-medium">No se encontraron resultados para "{query}"</p>
                                </div>
                            )}

                            {!loading && query.length < 2 && (
                                <div className="p-8 text-center">
                                    <p className="text-slate-500 text-sm">Empieza a escribir para buscar globalmente...</p>
                                    <div className="mt-4 grid grid-cols-2 gap-2 max-w-sm mx-auto">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                                            <Package className="h-4 w-4 text-amber-400 mb-2" />
                                            <span className="text-xs font-bold text-slate-300">Productos</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                                            <User className="h-4 w-4 text-blue-400 mb-2" />
                                            <span className="text-xs font-bold text-slate-300">Clientes</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {allResults.length > 0 && (
                                <div className="space-y-1">
                                    {allResults.map((item, index) => (
                                        <button
                                            key={`${item.type}-${index}`}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedIndex === index ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${selectedIndex === index ? 'bg-white/20' : 'bg-slate-800'}`}>
                                                    <item.icon className={`h-4 w-4 ${selectedIndex === index ? 'text-white' : 'text-slate-400'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-sm font-bold ${selectedIndex === index ? 'text-white' : 'text-slate-200'}`}>
                                                        {item.label}
                                                    </p>
                                                    <p className={`text-[10px] font-medium uppercase tracking-wider ${selectedIndex === index ? 'text-blue-100' : 'text-slate-500'}`}>
                                                        {item.sub}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedIndex === index && (
                                                <ArrowRight className="h-4 w-4 text-white" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-slate-950/50 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-white/10">↑↓</kbd> Navegar</span>
                                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-white/10">↵</kbd> Seleccionar</span>
                            </div>
                            <span>ESC para cerrar</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default CommandPalette
