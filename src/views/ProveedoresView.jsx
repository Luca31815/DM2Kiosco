import React, { useState, useMemo } from 'react'
import { useProveedores, useHistorialCompras } from '../hooks/useData'
import { 
    Users, 
    Search, 
    Package, 
    TrendingUp, 
    History, 
    ArrowRight, 
    Loader2, 
    DollarSign, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ProveedoresView = () => {
    const [selectedSupplier, setSelectedSupplier] = useState(null)
    const [searchSupplier, setSearchSupplier] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)

    // 1. Fetch Suppliers
    const { data: proveedores, loading: loadingProveedores } = useProveedores({
        filterColumn: 'nombre',
        filterValue: searchSupplier,
        pageSize: 100
    })

    // 2. Fetch Products for selected supplier
    const { data: historialProveedor, loading: loadingHistorial } = useHistorialCompras({
        filterColumn: 'proveedor',
        filterValue: selectedSupplier?.nombre,
        pageSize: 1000
    })

    // 3. Fetch Price Comparison for selected product
    const { data: comparativaPrecios, loading: loadingComparativa } = useHistorialCompras({
        filterColumn: 'producto',
        filterValue: selectedProduct,
        pageSize: 1000
    })

    // Grouping logic for products of a supplier
    const productosAgrupados = useMemo(() => {
        if (!historialProveedor) return []
        const groups = {}
        historialProveedor.forEach(h => {
            if (!groups[h.producto]) {
                groups[h.producto] = {
                    nombre: h.producto,
                    compras: [],
                    ultimoCosto: 0,
                    costoMinimo: Infinity,
                    costoMaximo: -Infinity
                }
            }
            groups[h.producto].compras.push(h)
            if (new Date(h.fecha) > new Date(groups[h.producto].ultimaFecha || 0)) {
                groups[h.producto].ultimoCosto = h.costo
                groups[h.producto].ultimaFecha = h.fecha
            }
            groups[h.producto].costoMinimo = Math.min(groups[h.producto].costoMinimo, h.costo)
            groups[h.producto].costoMaximo = Math.max(groups[h.producto].costoMaximo, h.costo)
        })
        return Object.values(groups).sort((a, b) => b.ultimaFecha.localeCompare(a.ultimaFecha))
    }, [historialProveedor])

    // Grouping logic for price comparison
    const comparativaAgrupada = useMemo(() => {
        if (!comparativaPrecios) return []
        const groups = {}
        comparativaPrecios.forEach(h => {
            const key = h.proveedor
            if (!groups[key]) {
                groups[key] = {
                    proveedor: h.proveedor,
                    ultimoCosto: 0,
                    ultimaFecha: null,
                    compras: []
                }
            }
            groups[key].compras.push(h)
            if (!groups[key].ultimaFecha || new Date(h.fecha) > new Date(groups[key].ultimaFecha)) {
                groups[key].ultimoCosto = h.costo
                groups[key].ultimaFecha = h.fecha
            }
        })
        return Object.values(groups).sort((a, b) => a.ultimoCosto - b.ultimoCosto)
    }, [comparativaPrecios])

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
            {/* Left Panel: Supplier List */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="glass-panel p-4 rounded-2xl bg-white/5 border-white/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Users className="size-4" /> Proveedores
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar proveedor..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-white"
                            value={searchSupplier}
                            onChange={(e) => setSearchSupplier(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 glass-panel rounded-2xl bg-white/5 border-white/5 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {loadingProveedores ? (
                            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : proveedores.map(p => (
                            <button
                                key={p.nombre}
                                onClick={() => { setSelectedSupplier(p); setSelectedProduct(null); }}
                                className={`w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden ${
                                    selectedSupplier?.nombre === p.nombre 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <div className="font-bold text-sm truncate pr-6">{p.nombre}</div>
                                <div className={`text-[10px] mt-1 ${selectedSupplier?.nombre === p.nombre ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {p.total_compras_registradas} compras registradas
                                </div>
                                {selectedSupplier?.nombre === p.nombre && (
                                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 size-4" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Content */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {!selectedSupplier ? (
                    <div className="flex-1 glass-panel rounded-3xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center p-12">
                        <div className="size-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <Users className="size-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Seleccioná un Proveedor</h2>
                        <p className="text-slate-500 max-w-xs">Elegí un proveedor de la lista de la izquierda para ver su historial de productos y comparar precios.</p>
                    </div>
                ) : (
                    <>
                        {/* Supplier Header Info */}
                        <div className="glass-panel p-6 rounded-3xl bg-white/5 border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="size-3 rounded-full bg-green-500 animate-pulse" />
                                    <h2 className="text-3xl font-black text-white tracking-tight">{selectedSupplier.nombre}</h2>
                                </div>
                                <p className="text-slate-500 text-sm font-medium">
                                    Última compra: <span className="text-slate-300">{new Date(selectedSupplier.ultima_compra).toLocaleDateString()}</span>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 min-w-[140px]">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Productos</div>
                                    <div className="text-2xl font-black text-white">{productosAgrupados.length}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 min-w-[140px]">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Operaciones</div>
                                    <div className="text-2xl font-black text-white">{selectedSupplier.total_compras_registradas}</div>
                                </div>
                            </div>
                        </div>

                        {/* Product Grid/List */}
                        <div className="flex-1 glass-panel rounded-3xl bg-white/5 border-white/5 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="font-black text-white flex items-center gap-3">
                                    <Package className="text-blue-500" /> Productos Comprados
                                </h3>
                                <div className="text-[10px] font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full uppercase tracking-tighter">
                                    Click en producto para comparar precios
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {loadingHistorial ? (
                                    <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 size-12" /></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {productosAgrupados.map(p => {
                                            const lastPurchase = p.compras[0]
                                            const prevPurchase = p.compras[1]
                                            const isIncrease = prevPurchase && lastPurchase.costo > prevPurchase.costo
                                            const isDecrease = prevPurchase && lastPurchase.costo < prevPurchase.costo

                                            return (
                                                <motion.button
                                                    whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                    key={p.nombre}
                                                    onClick={() => setSelectedProduct(p.nombre)}
                                                    className={`p-4 rounded-2xl border transition-all text-left group ${
                                                        selectedProduct === p.nombre 
                                                        ? 'bg-white/10 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                                                        : 'bg-white/5 border-white/5'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                            <Package size={18} />
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-black text-white tabular-nums">${p.ultimoCosto}</div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase">{new Date(p.ultimaFecha).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <h4 className="font-bold text-slate-200 text-sm mb-4 line-clamp-2 min-h-[40px] group-hover:text-white">{p.nombre}</h4>
                                                    
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-1.5">
                                                            {isIncrease ? (
                                                                <div className="flex items-center text-red-400 text-[10px] font-black bg-red-400/10 px-2 py-0.5 rounded-full uppercase">
                                                                    <ArrowUpRight size={12} className="mr-0.5" /> Aumento
                                                                </div>
                                                            ) : isDecrease ? (
                                                                <div className="flex items-center text-green-400 text-[10px] font-black bg-green-400/10 px-2 py-0.5 rounded-full uppercase">
                                                                    <ArrowDownRight size={12} className="mr-0.5" /> Baja
                                                                </div>
                                                            ) : (
                                                                <div className="text-slate-500 text-[10px] font-bold uppercase">Estable</div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                                                            Comparar <ArrowRight size={10} />
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Comparison Side Drawer (Overlay) */}
            <AnimatePresence>
                {selectedProduct && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-xl bg-slate-900 border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-start bg-slate-950/40">
                                <div>
                                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                                        <TrendingUp size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Análisis Comparativo</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white leading-tight">{selectedProduct}</h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedProduct(null)}
                                    className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                                {/* Price History for CURRENT supplier */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <History size={14} className="text-blue-500" /> Historial con {selectedSupplier.nombre}
                                    </h3>
                                    <div className="space-y-2">
                                        {productosAgrupados.find(p => p.nombre === selectedProduct)?.compras.map((c, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 bg-slate-800 rounded-xl flex items-center justify-center">
                                                        <Calendar size={18} className="text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{new Date(c.fecha).toLocaleDateString()}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase font-black">ID: {c.compra_id}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-blue-400">${c.costo}</div>
                                                    <div className="text-[10px] text-slate-600 font-bold">{c.cantidad} unidades</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Comparison with OTHER suppliers */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Users size={14} className="text-purple-500" /> Otros Proveedores
                                    </h3>
                                    {loadingComparativa ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-500" /></div>
                                    ) : comparativaAgrupada.length <= 1 ? (
                                        <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                            <Info className="size-8 text-slate-600 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">No hay registros de este producto con otros proveedores.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {comparativaAgrupada
                                                .filter(g => g.proveedor !== selectedSupplier.nombre)
                                                .map((g, i) => (
                                                <div key={i} className="group p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{g.proveedor}</h4>
                                                            <p className="text-[10px] text-slate-500 font-bold">ÚLTIMA COMPRA: {new Date(g.ultimaFecha).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-black text-purple-400">${g.ultimoCosto}</div>
                                                            {g.ultimoCosto < (productosAgrupados.find(p => p.nombre === selectedProduct)?.ultimoCosto || 0) ? (
                                                                <div className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full inline-block uppercase">Más Barato</div>
                                                            ) : (
                                                                <div className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full inline-block uppercase">Más Caro</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                                        <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(100, (g.ultimoCosto / (productosAgrupados.find(p => p.nombre === selectedProduct)?.ultimoCosto || 1)) * 100)}%` }}
                                                                className={`h-full ${g.ultimoCosto < (productosAgrupados.find(p => p.nombre === selectedProduct)?.ultimoCosto || 0) ? 'bg-green-500' : 'bg-red-500'}`}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-500 tabular-nums">
                                                            {Math.round((g.ultimoCosto / (productosAgrupados.find(p => p.nombre === selectedProduct)?.ultimoCosto || 1) - 1) * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                            
                            <div className="p-8 border-t border-white/5 bg-slate-950/40">
                                <button 
                                    onClick={() => setSelectedProduct(null)}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2"
                                >
                                    Cerrar Análisis
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

export default ProveedoresView
