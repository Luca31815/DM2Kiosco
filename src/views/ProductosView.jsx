import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useProductos, usePredictiveStock } from '../hooks/useData'
import { Edit2, Check, X, Loader2, Package, TrendingUp, TrendingDown, Clock, Search, Timer, Trash2, PackagePlus, DollarSign, FileText, Bookmark } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import ProductDetailExpansion from '../components/ProductDetailExpansion'
import { generateProductsPDF } from '../utils/pdfGenerator'
import SynonymManagerModal from '../components/SynonymManagerModal'


const ProductosView = () => {
    const [sortColumn, setSortColumn] = useState('nombre')
    const [sortOrder, setSortOrder] = useState('asc')
    const [filterValue, setFilterValue] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 20
    const { mutate } = useSWRConfig()

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const [isCleaning, setIsCleaning] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isSyncingPrecios, setIsSyncingPrecios] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isSynonymModalOpen, setIsSynonymModalOpen] = useState(false)


    const options = React.useMemo(() => ({
        sortColumn,
        sortOrder,
        filterColumn: 'nombre',
        filterValue,
        page,
        pageSize
    }), [sortColumn, sortOrder, filterValue, page, pageSize])

    const { data: rawData, count, loading } = useProductos(options)
    
    const { data: predictionData } = usePredictiveStock()
    
    const productsWithPrediction = React.useMemo(() => {
        if (!rawData) return []
        return rawData.map(p => {
            const prediction = predictionData?.find(pred => pred.nombre === p.nombre)
            return {
                ...p,
                dias_para_quiebre: prediction ? prediction.dias_para_quiebre : null,
                ventas_diarias_promedio: prediction ? prediction.ventas_diarias_promedio : 0
            }
        })
    }, [rawData, predictionData])

    const handleEditStart = (product) => {
        setEditingId(product.producto_id)
        setEditForm({ ...product, p_guardar_alias: true })
    }

    const handleSave = async () => {
        const nombreNormalizado = editForm.nombre?.trim().toUpperCase()
        const stockNum = parseInt(editForm.stock_actual)
        const precioVentaNum = parseFloat(editForm.ultimo_precio_venta)
        const precioCompraNum = parseFloat(editForm.ultimo_costo_compra)

        if (!nombreNormalizado) {
            toast.error('El nombre del producto no puede estar vacío')
            return
        }
        if (isNaN(stockNum)) {
            toast.error('El stock debe ser un número válido')
            return
        }

        const dataToSend = {
            ...editForm,
            nombre: nombreNormalizado,
            stock_actual: stockNum,
            ultimo_precio_venta: isNaN(precioVentaNum) ? 0 : precioVentaNum,
            ultimo_costo_compra: isNaN(precioCompraNum) ? 0 : precioCompraNum
        }

        const loadingToast = toast.loading('Procesando cambios...')
        setIsSaving(true)
        try {
            const result = await api.actualizarProducto(dataToSend)
            if (result.success) {
                mutate(key => Array.isArray(key) && key[0] === 'productos')
                if (result.tipo_accion === 'MERGE' || result.renombrado) {
                    mutate('ventas')
                    mutate('compras')
                    mutate('reservas')
                }
                if (result.tipo_accion === 'MERGE') {
                    toast.success('¡Unificación exitosa! Los productos se han fusionado.', { id: loadingToast, duration: 5000 })
                } else {
                    toast.success('Producto actualizado correctamente', { id: loadingToast })
                }
                setEditingId(null)
            } else {
                toast.error('Error: ' + result.error, { id: loadingToast })
            }
        } catch (error) {
            toast.error('Error al actualizar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    const handleCleanup = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente todos los productos que no tienen NINGUNA operación (Ventas, Compras o Reservas)?')) {
            return
        }

        const loadingToast = toast.loading('Limpiando catálogo...')
        setIsCleaning(true)
        try {
            const countDeleted = await api.cleanupOrphanedProducts()
            toast.success(`Se han eliminado ${countDeleted} productos huérfanos.`, { id: loadingToast, duration: 5000 })
            mutate(key => Array.isArray(key) && key[0] === 'productos')
        } catch (error) {
            toast.error('Error al limpiar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsCleaning(false)
        }
    }

    const handleSyncFaltantes = async () => {
        const loadingToast = toast.loading('Buscando productos faltantes en operaciones...')
        setIsSyncing(true)
        try {
            const result = await api.sincronizarProductosFaltantes()
            if (result.success) {
                if (result.count > 0) {
                    toast.success(`¡Listo! Se agregaron ${result.count} productos nuevos al catálogo.`, { id: loadingToast, duration: 5000 })
                    mutate(key => Array.isArray(key) && key[0] === 'productos')
                } else {
                    toast.success('¡Todo en orden! No había productos faltantes.', { id: loadingToast, duration: 4000 })
                }
            } else {
                toast.error('Error: ' + result.error, { id: loadingToast })
            }
        } catch (error) {
            toast.error('Error al sincronizar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSyncing(false)
        }
    }

    const handleSyncPrecios = async () => {
        const loadingToast = toast.loading('Sincronizando precios desde el historial...')
        setIsSyncingPrecios(true)
        try {
            const result = await api.sincronizarPrecios()
            if (result.success) {
                toast.success('¡Precios actualizados correctamente!', { id: loadingToast, duration: 4000 })
                mutate(key => Array.isArray(key) && key[0] === 'productos')
            } else {
                toast.error('Error: ' + result.error, { id: loadingToast })
            }
        } catch (error) {
            toast.error('Error al sincronizar precios: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSyncingPrecios(false)
        }
    }

    const handleExportPDF = async () => {
        const loadingToast = toast.loading('Generando PDF...')
        setIsExporting(true)
        try {
            // Obtenemos TODOS los productos que coinciden con el filtro actual
            // Pasamos pageSize high para asegurar que traemos todo el listado filtrado
            const result = await api.getProductos({
                filterColumn: 'nombre',
                filterValue: filterValue,
                sortColumn: sortColumn,
                sortOrder: sortOrder,
                page: 1,      // Página explícita
                pageSize: 1000 // Límite más seguro para producción
            })

            if (result.data && result.data.length > 0) {
                generateProductsPDF(result.data, filterValue)
                toast.success('PDF generado correctamente', { id: loadingToast })
            } else {
                toast.error('No hay productos para exportar', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error exporting PDF:', error)
            toast.error('Error al generar PDF', { id: loadingToast })
        } finally {
            setIsExporting(false)
        }
    }


    const columns = [
        {
            key: 'nombre',
            label: 'Producto',
            wrap: true,
            width: 'w-[45%]',
            render: (val, row) => (
                <div className="flex flex-col">
                    {editingId === row.producto_id ? (
                        <div className="min-w-[200px] flex flex-col gap-2 py-1">
                            <ProductAutocomplete
                                value={editForm.nombre}
                                onChange={v => setEditForm({ ...editForm, nombre: v })}
                                className="bg-slate-800/50 border-white/10"
                            />
                            {editForm.nombre?.trim().toUpperCase() !== row.nombre && (
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className="relative">
                                        <input 
                                            type="checkbox"
                                            checked={editForm.p_guardar_alias}
                                            onChange={e => setEditForm({ ...editForm, p_guardar_alias: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`w-8 h-4 rounded-full transition-colors ${editForm.p_guardar_alias ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${editForm.p_guardar_alias ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors uppercase tracking-tight">Guardar como alias</span>
                                </label>
                            )}
                        </div>
                    ) : (
                        <span className="font-bold text-slate-200">{val}</span>
                    )}
                </div>
            )
        },
        {
            key: 'ultimo_precio_venta',
            label: 'Precio Venta',
            width: 'w-28',
            render: (val) => (
                <div className="flex items-center gap-1.5 font-black text-emerald-400 tabular-nums">
                    <TrendingUp className="h-3 w-3 opacity-50" />
                    ${val}
                </div>
            )
        },
        {
            key: 'ultimo_costo_compra',
            label: 'Precio Compra',
            width: 'w-28',
            render: (val) => (
                <div className="flex items-center gap-1.5 font-black text-slate-400 tabular-nums opacity-80">
                    <TrendingDown className="h-3 w-3 opacity-50" />
                    ${val}
                </div>
            )
        },
        {
            key: 'stock_actual',
            label: 'Stock',
            width: 'w-36',
            render: (val, row) => editingId === row.producto_id ? (
                <input
                    type="number"
                    className="bg-slate-800 border-none rounded-lg px-2 py-1 w-20 text-right text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                    value={editForm.stock_actual}
                    onChange={e => setEditForm({ ...editForm, stock_actual: e.target.value })}
                />
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((val / 20) * 100, 100)}%` }}
                            className={`h-full ${val < 10 ? 'bg-rose-500' : val < 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                    </div>
                    <span className={`font-black tabular-nums ${val < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {val}
                    </span>
                </div>
            )
        },
        {
            key: 'dias_para_quiebre',
            label: 'Predicción',
            width: 'w-28',
            render: (val) => (
                <div className="flex flex-col gap-1">
                    {val !== null ? (
                        <>
                            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                                <Timer className={`h-3 w-3 ${val < 3 ? 'text-rose-500 animate-pulse' : val < 7 ? 'text-amber-500' : 'text-emerald-500'}`} />
                                <span className={val < 3 ? 'text-rose-400' : val < 7 ? 'text-amber-400' : 'text-emerald-400'}>
                                    {val} días
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">Stock estimado</span>
                        </>
                    ) : (
                        <span className="text-[10px] text-slate-600 italic">Sin datos de venta</span>
                    )}
                </div>
            )
        },
        {
            key: 'fecha_actualizacion',
            label: 'Update',
            width: 'w-28',
            render: (val) => val ? (
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(val).toLocaleDateString()}
                </div>
            ) : <span className="text-slate-700">-</span>
        },
        {
            key: 'acciones',
            label: 'Acciones',
            width: 'w-24',
            render: (_, row) => (
                <div className="flex justify-center gap-1">
                    {editingId === row.producto_id ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all active:scale-95"
                                title="Guardar cambios"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                disabled={isSaving}
                                className="p-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all active:scale-95"
                                title="Cancelar"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleEditStart(row)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            title="Editar / Unificar"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ]

    const handleSort = (column) => {
        if (column === 'acciones') return
        setPage(1)
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    const handleFilter = (val) => {
        setFilterValue(val)
        setPage(1)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Package className="h-10 w-10 text-amber-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Inventario
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Gestión de productos, precios y stock inteligente.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleSyncPrecios}
                        disabled={isSyncingPrecios}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
                        title="Actualiza los precios de venta y compra según las últimas operaciones registradas"
                    >
                        {isSyncingPrecios ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} className="group-hover:scale-110 transition-transform" />}
                        {isSyncingPrecios ? 'Sincronizando...' : 'Sincronizar Precios'}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                        title="Exportar la lista actual de productos a PDF"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} className="group-hover:scale-110 transition-transform" />}
                        {isExporting ? 'Exportando...' : 'Exportar PDF'}
                    </button>
                    <button

                        onClick={handleSyncFaltantes}
                        disabled={isSyncing}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 group"
                        title="Busca todos los productos en Ventas, Compras y Reservas y agrega los que faltan al catálogo"
                    >
                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <PackagePlus size={14} className="group-hover:scale-110 transition-transform" />}
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Faltantes'}
                    </button>
                    <button
                        onClick={handleCleanup}
                        disabled={isCleaning}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        {isCleaning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} className="group-hover:scale-110 transition-transform" />}
                        {isCleaning ? 'Limpiando...' : 'Limpiar Catálogo'}
                    </button>
                    
                    <button
                        onClick={() => setIsSynonymModalOpen(true)}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
                        title="Gestionar el diccionario de sinónimos y resolver conflictos de nombres"
                    >
                        <Bookmark className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        Diccionario
                    </button>
                    
                    <div className="relative flex-1 sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full outline-none backdrop-blur-md transition-all"
                            value={filterValue}
                            onChange={(e) => handleFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <DataTable
                data={productsWithPrediction}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={handleFilter}
                rowKey="producto_id"
                compact={true}
                serverSide={true}
                totalCount={count}
                currentPage={page}
                onPageChange={setPage}
                itemsPerPage={pageSize}
                renderExpandedRow={(product) => (
                    <ProductDetailExpansion product={product} />
                )}
            />

            <SynonymManagerModal 
                isOpen={isSynonymModalOpen} 
                onClose={() => setIsSynonymModalOpen(false)} 
            />
        </motion.div>
    )
}

export default ProductosView
