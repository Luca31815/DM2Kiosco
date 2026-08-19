import React, { useState, useMemo, useCallback } from 'react'
import {
    Inbox,
    Zap,
    Check,
    Search,
    RefreshCw,
    CheckCheck,
    AlertCircle,
    Package,
    Clock,
    DollarSign,
    Sparkles,
    Filter,
    ArrowRight,
    Loader2,
    CheckCircle2
} from 'lucide-react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { useSWRConfig } from 'swr'
import { toast } from 'react-hot-toast'
import { useTriageProducts, useTriagePendingCount } from '../hooks/useData'
import * as api from '../services/api'
import {
    FAMILIAS_CANONICAS,
    CATEGORIAS_LIST,
    SUBCATEGORIAS_BY_CATEGORIA,
    inferCategoryAndSubcategory
} from '../utils/triageClassifier'

export default function TriageProductosView() {
    const { mutate } = useSWRConfig()
    const [activeTab, setActiveTab] = useState('criticos') // 'criticos' | 'recientes' | 'todos'
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCat, setFilterCat] = useState('')

    // Form state local por producto: { [producto_id]: { categoria, subcategoria, isModified, aiSuggested, confianza, isSaving } }
    const [localEdits, setLocalEdits] = useState({})
    const [sessionClassifiedCount, setSessionClassifiedCount] = useState(0)
    const [isBatchSaving, setIsBatchSaving] = useState(false)

    // Carga de datos mediante SWR
    const { data: rawProducts, count, loading, mutate: mutateTriage } = useTriageProducts(activeTab)
    const { count: pendingCount } = useTriagePendingCount()

    // Formateador de moneda
    const formatCurrency = useCallback((val) => {
        const num = Number(val)
        if (isNaN(num) || num === 0) return '$0'
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(num)
    }, [])

    // Handler para cambios de categoría en una fila
    const handleCategoryChange = useCallback((productoId, newCat) => {
        setLocalEdits(prev => {
            const current = prev[productoId] || {}
            const availableSubs = SUBCATEGORIAS_BY_CATEGORIA[newCat] || []
            const newSub = availableSubs.includes(current.subcategoria)
                ? current.subcategoria
                : (availableSubs[0] || '')

            return {
                ...prev,
                [productoId]: {
                    ...current,
                    categoria: newCat,
                    subcategoria: newSub,
                    isModified: true
                }
            }
        })
    }, [])

    // Handler para cambios de subcategoría en una fila
    const handleSubcategoryChange = useCallback((productoId, newSub) => {
        setLocalEdits(prev => ({
            ...prev,
            [productoId]: {
                ...(prev[productoId] || {}),
                subcategoria: newSub,
                isModified: true
            }
        }))
    }, [])

    // Sugerencia individual con IA para una fila
    const handleSuggestSingle = useCallback((product) => {
        const suggestion = inferCategoryAndSubcategory(product)
        setLocalEdits(prev => ({
            ...prev,
            [product.producto_id]: {
                categoria: suggestion.categoria,
                subcategoria: suggestion.subcategoria,
                isModified: true,
                aiSuggested: true,
                confianza: suggestion.confianza,
                regla: suggestion.regla
            }
        }))
        toast.success(`Sugerido: ${suggestion.categoria} > ${suggestion.subcategoria}`, {
            icon: '⚡',
            duration: 2500
        })
    }, [])

    // Auto-sugerir todas las filas visibles
    const handleSuggestAll = useCallback(() => {
        if (!rawProducts || rawProducts.length === 0) return

        let countSuggested = 0
        const newEdits = { ...localEdits }

        rawProducts.forEach(prod => {
            const suggestion = inferCategoryAndSubcategory(prod)
            newEdits[prod.producto_id] = {
                categoria: suggestion.categoria,
                subcategoria: suggestion.subcategoria,
                isModified: true,
                aiSuggested: true,
                confianza: suggestion.confianza,
                regla: suggestion.regla
            }
            countSuggested++
        })

        setLocalEdits(newEdits)
        toast.success(`⚡ Se analizaron y preclasificaron ${countSuggested} productos`, {
            duration: 4000
        })
    }, [rawProducts, localEdits])

    // Guardar clasificación individual
    const handleSaveSingle = useCallback(async (product) => {
        const edit = localEdits[product.producto_id]
        const categoria = edit?.categoria || product.categoria
        const subcategoria = edit?.subcategoria || product.subcategoria

        if (!categoria || categoria === 'SIN_CATEGORIA') {
            toast.error('Selecciona una categoría válida antes de guardar')
            return
        }

        // Marcar fila como guardando
        setLocalEdits(prev => ({
            ...prev,
            [product.producto_id]: {
                ...(prev[product.producto_id] || {}),
                isSaving: true
            }
        }))

        try {
            await api.clasificarProducto({
                producto_id: product.producto_id,
                categoria,
                subcategoria
            })

            toast.success(`"${product.nombre}" clasificado con éxito`, {
                icon: '✓'
            })
            setSessionClassifiedCount(c => c + 1)

            // Limpiar edición local
            setLocalEdits(prev => {
                const next = { ...prev }
                delete next[product.producto_id]
                return next
            })

            // Invalidate caches
            mutateTriage()
            mutate('triage_pending_count')
            mutate(key => Array.isArray(key) && key[0] === 'productos')
        } catch (error) {
            toast.error(`Error al guardar: ${error.message || 'Error desconocido'}`)
            setLocalEdits(prev => ({
                ...prev,
                [product.producto_id]: {
                    ...(prev[product.producto_id] || {}),
                    isSaving: false
                }
            }))
        }
    }, [localEdits, mutateTriage, mutate])

    // Guardar todos los productos modificados en lote
    const handleSaveAllModified = useCallback(async () => {
        const modifiedItems = Object.entries(localEdits)
            .filter(([_, edit]) => edit.isModified && edit.categoria && edit.categoria !== 'SIN_CATEGORIA')
            .map(([producto_id, edit]) => ({
                producto_id,
                categoria: edit.categoria,
                subcategoria: edit.subcategoria
            }))

        if (modifiedItems.length === 0) {
            toast('No hay productos con clasificaciones pendientes de guardar', { icon: 'ℹ️' })
            return
        }

        const loadToast = toast.loading(`Guardando ${modifiedItems.length} clasificaciones...`)
        setIsBatchSaving(true)

        try {
            await api.clasificarProductosBatch(modifiedItems)
            toast.success(`¡${modifiedItems.length} productos clasificados correctamente!`, { id: loadToast })
            setSessionClassifiedCount(c => c + modifiedItems.length)
            setLocalEdits({})

            mutateTriage()
            mutate('triage_pending_count')
            mutate(key => Array.isArray(key) && key[0] === 'productos')
        } catch (error) {
            toast.error(`Error en guardado masivo: ${error.message}`, { id: loadToast })
        } finally {
            setIsBatchSaving(false)
        }
    }, [localEdits, mutateTriage, mutate])

    // Filtro de productos en memoria para búsqueda y categoría
    const filteredProducts = useMemo(() => {
        if (!rawProducts) return []

        return rawProducts.filter(p => {
            const matchesSearch = searchTerm.trim() === '' ||
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                String(p.producto_id).includes(searchTerm.trim())

            const edit = localEdits[p.producto_id]
            const currentCat = edit?.categoria || p.categoria || 'SIN_CATEGORIA'

            const matchesCategory = !filterCat || currentCat === filterCat

            return matchesSearch && matchesCategory
        })
    }, [rawProducts, searchTerm, filterCat, localEdits])

    // Cantidad total de modificados pendientes de guardar
    const totalModifiedCount = useMemo(() => {
        return Object.values(localEdits).filter(e => e.isModified).length
    }, [localEdits])

    return (
        <LazyMotion features={domAnimation}>
            <div className="space-y-6 pb-12 max-w-7xl mx-auto">
                {/* Header Principal */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
                                <Inbox className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                    Bandeja de Entrada
                                    {pendingCount > 0 && (
                                        <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                            {pendingCount} pendientes
                                        </span>
                                    )}
                                </h1>
                                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                                    Triage y clasificación rápida de productos nuevos o pendientes con inteligencia predictiva.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards Rápidos */}
                    <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
                        <div className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center gap-3">
                            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Críticos</div>
                                <div className="text-sm font-black text-white">{pendingCount}</div>
                            </div>
                        </div>

                        <div className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center gap-3">
                            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">En Sesión</div>
                                <div className="text-sm font-black text-emerald-400">+{sessionClassifiedCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barra de Controles, Tabs y Acciones Masivas */}
                <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                        {/* Selector de Tabs */}
                        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 self-start w-full sm:w-auto overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('criticos')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'criticos'
                                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Pendientes Críticos</span>
                                {pendingCount > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                                        activeTab === 'criticos' ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {pendingCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('recientes')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'recientes'
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                <span>Recientes (7 Días)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('todos')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'todos'
                                        ? 'bg-slate-700 text-white shadow-lg shadow-slate-700/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Package className="h-3.5 w-3.5" />
                                <span>Todos</span>
                            </button>
                        </div>

                        {/* Botones de Acción Global */}
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <button
                                type="button"
                                onClick={handleSuggestAll}
                                disabled={loading || !rawProducts?.length}
                                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 text-xs font-black tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/5 min-h-[42px]"
                                title="Aplica el clasificador inteligente a todos los productos visibles"
                            >
                                <Sparkles className="h-4 w-4" />
                                <span>Auto-Sugerir Todos</span>
                            </button>

                            {totalModifiedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSaveAllModified}
                                    disabled={isBatchSaving}
                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/25 min-h-[42px]"
                                >
                                    {isBatchSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                                    <span>Guardar {totalModifiedCount} Modificados</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => mutateTriage()}
                                disabled={loading}
                                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all flex items-center justify-center min-h-[42px]"
                                title="Refrescar catálogo"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Filtro de Búsqueda y Rubro */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/5">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre o ID del producto..."
                                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            <select
                                value={filterCat}
                                onChange={(e) => setFilterCat(e.target.value)}
                                className="w-full sm:w-auto bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                            >
                                <option value="">Todas las Familias</option>
                                {CATEGORIAS_LIST.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista / Tabla de Triage */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-24 bg-slate-900/40 rounded-2xl border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center backdrop-blur-sm">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-black text-white tracking-tight">
                            {activeTab === 'criticos' ? '¡Bandeja de Entrada al Día!' : 'Sin productos encontrados'}
                        </h3>
                        <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto mt-1">
                            {activeTab === 'criticos'
                                ? 'No hay productos pendientes de categorización o clasificados como varios.'
                                : 'No se encontraron productos que coincidan con los filtros aplicados.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 flex justify-between items-center">
                            <span>Mostrando {filteredProducts.length} productos</span>
                            {totalModifiedCount > 0 && (
                                <span className="text-amber-400 font-black">
                                    {totalModifiedCount} listos para guardar
                                </span>
                            )}
                        </div>

                        <AnimatePresence>
                            {filteredProducts.map((product) => {
                                const edit = localEdits[product.producto_id] || {}
                                const currentCat = edit.categoria !== undefined ? edit.categoria : (product.categoria || '')
                                const currentSub = edit.subcategoria !== undefined ? edit.subcategoria : (product.subcategoria || '')
                                const isModified = !!edit.isModified
                                const isSaving = !!edit.isSaving
                                const availableSubs = SUBCATEGORIAS_BY_CATEGORIA[currentCat] || []

                                const familiaObj = FAMILIAS_CANONICAS.find(f => f.id === currentCat)
                                const badgeStyle = familiaObj?.badgeColor || 'bg-slate-800 text-slate-400 border-white/5'

                                return (
                                    <m.div
                                        key={product.producto_id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                        className={`p-4 rounded-2xl border transition-all ${
                                            isModified
                                                ? 'bg-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                                                : 'bg-slate-900/60 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                            {/* Info de Producto y Precios */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/5">
                                                        #{product.producto_id}
                                                    </span>
                                                    {edit.aiSuggested && (
                                                        <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            IA: {edit.regla || 'Inferido'}
                                                        </span>
                                                    )}
                                                    {(!product.categoria || product.categoria === 'SIN_CATEGORIA' || product.categoria === 'VARIOS Y SERVICIOS') && (
                                                        <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                                                            Sin Clasificar
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-black text-white tracking-tight truncate" title={product.nombre}>
                                                    {product.nombre}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-slate-500">Costo:</span>
                                                        <strong className="text-slate-300 font-bold">{formatCurrency(product.ultimo_costo_compra)}</strong>
                                                    </span>
                                                    <span className="text-slate-600">•</span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-slate-500">Venta:</span>
                                                        <strong className="text-emerald-400 font-bold">{formatCurrency(product.ultimo_precio_venta)}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Selectores de Categoría y Subcategoría */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                                                {/* Categoría Principal */}
                                                <div className="relative min-w-[200px]">
                                                    <select
                                                        value={currentCat}
                                                        onChange={(e) => handleCategoryChange(product.producto_id, e.target.value)}
                                                        className="w-full bg-slate-950 border border-white/15 text-white text-xs font-black rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer appearance-none pr-8"
                                                    >
                                                        <option value="" disabled>Seleccionar Categoría</option>
                                                        {CATEGORIAS_LIST.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                                                        ▼
                                                    </div>
                                                </div>

                                                {/* Subcategoría */}
                                                <div className="relative min-w-[210px]">
                                                    <select
                                                        value={currentSub}
                                                        onChange={(e) => handleSubcategoryChange(product.producto_id, e.target.value)}
                                                        disabled={!currentCat || availableSubs.length === 0}
                                                        className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer disabled:opacity-40 appearance-none pr-8"
                                                    >
                                                        <option value="" disabled>Seleccionar Subcategoría</option>
                                                        {availableSubs.map(sub => (
                                                            <option key={sub} value={sub}>{sub}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                                                        ▼
                                                    </div>
                                                </div>

                                                {/* Botones de Fila: Sugerir IA + Guardar */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSuggestSingle(product)}
                                                        className="px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                                                        title="Sugerir categoría con IA"
                                                    >
                                                        <Zap className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">IA</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveSingle(product)}
                                                        disabled={isSaving || !currentCat}
                                                        className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer ${
                                                            isModified
                                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                                                        }`}
                                                        title="Guardar y Clasificar"
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                        <span>Clasificar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </m.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </LazyMotion>
    )
}
