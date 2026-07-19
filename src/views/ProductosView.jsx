import React, { useState, useMemo, useCallback } from 'react'
import DataTable from '../components/DataTable'
import { useProductos, usePredictiveStock } from '../hooks/useData'
import { Edit2, Check, X, Loader2, Package, TrendingUp, TrendingDown, Clock, Search, Timer, Trash2, PackagePlus, DollarSign, FileText, Bookmark } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import { toast } from 'react-hot-toast'
import ProductDetailExpansion from '../components/ProductDetailExpansion'
import { generateProductsPDF } from '../utils/pdfGenerator'
import SynonymManagerModal from '../components/SynonymManagerModal'
import { useIsMobile } from '../hooks/useIsMobile'
import { ProductosHeaderBar } from './productos/ProductosHeaderBar'
import { useProductosColumns } from './productos/useProductosColumns'


const ProductosView = () => {
    const isMobile = useIsMobile()
    const [sortColumn, setSortColumn] = useState('nombre')
    const [sortOrder, setSortOrder] = useState('asc')
    const [filterValue, setFilterValue] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = isMobile ? 10 : 20
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

    const handleSave = useCallback(async () => {
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
    }, [editForm, mutate])

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


    const columns = useProductosColumns({
        editingId,
        editForm,
        setEditForm,
        isSaving,
        handleSave,
        handleEditStart
    })

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
        <div className="space-y-6">
            <ProductosHeaderBar
                handleSyncPrecios={handleSyncPrecios}
                handleExportPDF={handleExportPDF}
                handleSyncFaltantes={handleSyncFaltantes}
                handleCleanup={handleCleanup}
                setIsSynonymModalOpen={setIsSynonymModalOpen}
                loadingStates={{ isSyncingPrecios, isExporting, isSyncing, isCleaning }}
            />

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
                minWidth="950px"
                renderExpandedRow={(product) => (
                    <ProductDetailExpansion product={product} />
                )}
            />

            <SynonymManagerModal 
                isOpen={isSynonymModalOpen} 
                onClose={() => setIsSynonymModalOpen(false)} 
            />
        </div>
    )
}

export default ProductosView
