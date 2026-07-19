import React, { useState, useMemo } from 'react'
import { useProveedores, useHistorialCompras, useResumenProductosProveedor } from '../hooks/useData'
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
    ExternalLink,
    SearchCode,
    Filter,
    GitMerge,
    ChevronDown,
    AlertTriangle
} from 'lucide-react'
import ProductAutocomplete from '../components/ProductAutocomplete'
import * as api from '../services/api'
import { mutate } from 'swr'
import { toast } from 'react-hot-toast'
import { ProveedoresMergeModal } from './proveedores/ProveedoresMergeModal'
import { ProveedorProductDrawer } from './proveedores/ProveedorProductDrawer'
const ProveedoresHistoryChart = React.lazy(() => import('./proveedores/ProveedoresHistoryChart'))
import { AnimatePresence } from 'framer-motion'


// Helper Component for Close Icon
const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
)

const ProveedoresView = () => {
    const [selectedSupplier, setSelectedSupplier] = useState(null)
    const [searchSupplier, setSearchSupplier] = useState('')
    const [searchProduct, setSearchProduct] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)

    // 1. Fetch Suppliers
    const { data: proveedores, loading: loadingProveedores } = useProveedores({
        filterColumn: 'nombre',
        filterValue: searchSupplier,
        pageSize: 100
    })

    // 2. Fetch Aggregated Products for selected supplier
    const { data: productosProveedor, loading: loadingProductos } = useResumenProductosProveedor({
        filterColumn: 'proveedor',
        filterValue: selectedSupplier?.nombre,
        pageSize: 1000
    })

    // 3. Filter products by search term
    const filteredProducts = useMemo(() => {
        if (!productosProveedor) return []
        if (!searchProduct) return productosProveedor
        return productosProveedor.filter(p => 
            p.producto.toLowerCase().includes(searchProduct.toLowerCase())
        )
    }, [productosProveedor, searchProduct])

    // 4. Fetch Price Comparison for selected product
    const { data: comparativaPrecios } = useHistorialCompras({
        filterColumn: 'producto',
        filterValue: selectedProduct,
        pageSize: 1000
    })

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
        return Object.values(groups).toSorted((a, b) => a.ultimoCosto - b.ultimoCosto)
    }, [comparativaPrecios])

    const chartData = useMemo(() => {
        if (!comparativaPrecios) return []
        return comparativaPrecios
            .toSorted((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .map(c => ({
                fecha: new Date(c.fecha).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
                costo: c.costo,
                proveedor: c.proveedor
            }))
    }, [comparativaPrecios])

    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
    const [targetSupplierName, setTargetSupplierName] = useState('')
    const [isMergingProgress, setIsMergingProgress] = useState(false)

    const handleMerge = async () => {
        if (!selectedSupplier || !targetSupplierName) return
        
        if (!window.confirm(`¿Estás SEGURO de que quieres fusionar "${selectedSupplier.nombre}" con "${targetSupplierName}"? Esta acción no se puede deshacer.`)) {
            return
        }

        setIsMergingProgress(true)
        try {
            const result = await api.fusionarProveedores(selectedSupplier.nombre, targetSupplierName)
            alert(result.mensaje || 'Fusión completada')
            setIsMergeModalOpen(false)
            setTargetSupplierName('')
            setSelectedSupplier(null)
            mutate('proveedores')
            mutate('resumen_productos_proveedor')
        } catch (error) {
            alert('Error: ' + error.message)
        } finally {
            setIsMergingProgress(false)
        }
    }

    const handleGlobalSearch = (productName) => {
        if (!productName) return
        setSelectedProduct(productName)
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-180px)]">
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-4 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Users className="size-4" /> Proveedores
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar proveedor..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-white"
                            value={searchSupplier}
                            onChange={(e) => setSearchSupplier(e.target.value)}
                        />
                    </div>
                </div>

                <div className="h-64 lg:h-auto lg:flex-1 bg-slate-900 rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {loadingProveedores ? (
                            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : proveedores.map(p => (
                            <button type="button"
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
                                    {p.total_compras_registradas} compras
                                </div>
                                {selectedSupplier?.nombre === p.nombre && (
                                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 size-4" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-visible lg:overflow-hidden">
                <div className="bg-slate-900 p-4 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center gap-4 shadow-xl">
                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <SearchCode className="size-5 text-blue-400" />
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Búsqueda Global</span>
                    </div>
                    <div className="flex-1 w-full">
                        <ProductAutocomplete 
                            placeholder="Buscar producto en cualquier proveedor..."
                            onChange={handleGlobalSearch}
                            className="bg-slate-800 border-white/5"
                        />
                    </div>
                </div>

                {!selectedSupplier ? (
                    <div className="flex-1 bg-slate-900 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center p-12 shadow-2xl">
                        <div className="size-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                            <Users className="size-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Seleccioná un Proveedor</h2>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-900 p-6 rounded-3xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="size-3 rounded-full bg-green-500" />
                                    <h2 className="text-3xl font-black text-white tracking-tight">{selectedSupplier.nombre}</h2>
                                </div>
                                <p className="text-slate-500 text-sm font-medium">
                                    Última compra: {new Date(selectedSupplier.ultima_compra).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <button type="button" 
                                    onClick={() => setIsMergeModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 hover:bg-amber-500/20 transition-all text-xs font-black"
                                >
                                    <GitMerge size={14} /> Fusionar
                                </button>
                                <div className="bg-slate-800 rounded-2xl p-4 border border-white/5 min-w-[140px]">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Productos</div>
                                    <div className="text-2xl font-black text-white">{productosProveedor?.length || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="h-auto lg:flex-1 bg-slate-900 rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-slate-800/50 gap-4">
                                <h3 className="font-black text-white flex items-center gap-3">
                                    <Package className="text-blue-500" /> Productos Comprados
                                </h3>
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar..."
                                        className="w-full pl-9 pr-4 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-blue-500/50 outline-none text-white"
                                        value={searchProduct}
                                        onChange={(e) => setSearchProduct(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {loadingProductos ? (
                                    <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 size-12" /></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredProducts.map(p => (
                                            <button type="button"
                                                key={p.producto}
                                                onClick={() => setSelectedProduct(p.producto)}
                                                className={`p-4 rounded-2xl border transition-all text-left group ${
                                                    selectedProduct === p.producto 
                                                    ? 'bg-blue-600 border-blue-400' 
                                                    : 'bg-slate-800/50 border-white/5 hover:border-blue-500/30'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <Package size={18} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-black text-white tabular-nums">${p.ultimo_costo}</div>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-slate-200 text-sm mb-4 line-clamp-2 min-h-[40px]">{p.producto}</h4>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] font-black uppercase text-blue-400">
                                                    <span>Analizar</span>
                                                    <ArrowRight size={10} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ProveedorProductDrawer
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                chartData={chartData}
                comparativaAgrupada={comparativaAgrupada}
            />

            <ProveedoresMergeModal
                isMergeModalOpen={isMergeModalOpen}
                setIsMergeModalOpen={setIsMergeModalOpen}
                isMergingProgress={isMergingProgress}
                targetSupplierName={targetSupplierName}
                setTargetSupplierName={setTargetSupplierName}
                selectedSupplier={selectedSupplier}
                proveedores={proveedores}
                handleMerge={handleMerge}
            />
        </div>
    )
}

export default ProveedoresView
