import React, { useState, useCallback } from 'react'
import {
    AlertTriangle, Coins, Package, Loader2, Edit2, Check, X, Plus, Info,
    Trash2, Zap, Sparkles, CheckCircle2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as api from '../../services/api'
import { OperationItemsTable, OperationPaymentsTable } from './OperationTables'
import { OperationConciliationAssistant } from './OperationConciliationAssistant'
import { OperationHeaderCard } from './OperationHeaderCard'
import { useOperationDetailsHandlers } from './useOperationDetailsHandlers'

// ─────────────────────────────────────────────────────────────────────────────
// OperationDetails — Panel expandido con detalles de una operación en descalce.
// Carga los productos y pagos de la operación bajo demanda y permite editarlos.
// Extraído de DescalcesView para reducir el tamaño del archivo principal.
// ─────────────────────────────────────────────────────────────────────────────
const OperationDetails = ({ operacionId, tipoOperacion, onRefresh, cabeceraOriginal }) => {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([])
    const [payments, setPayments] = useState([])
    const [error, setError] = useState(null)

    // Estados de edición
    const [editingItemId, setEditingItemId] = useState(null)
    const [itemForm, setItemForm] = useState({ cantidad: '', precio_unitario: '' })

    const [editingPaymentId, setEditingPaymentId] = useState(null)
    const [paymentForm, setPaymentForm] = useState({ monto: '' })

    const [editingCabecera, setEditingCabecera] = useState(false)
    const [cabeceraForm, setCabeceraForm] = useState({ total: '' })

    const [isSaving, setIsSaving] = useState(false)

    const loadDetails = useCallback(async () => {
        try {
            setLoading(true)
            const [itemsData, paymentsData] = await Promise.all([
                tipoOperacion === 'VENTA'
                    ? api.getVentasDetalles(operacionId)
                    : api.getComprasDetalles(operacionId),
                api.getMovimientosDinero(operacionId)
            ])
            setItems(itemsData)
            setPayments(paymentsData)
            setLoading(false)
        } catch (err) {
            console.error('Error loading details:', err)
            setError('Error al cargar los detalles de la base de datos.')
            setLoading(false)
        }
    }, [operacionId, tipoOperacion])

    React.useEffect(() => {
        loadDetails()
    }, [loadDetails])

    // --- ACCIONES DE EDICIÓN ---

    const {
        handleSaveCabecera,
        handleSaveItem,
        handleSavePayment,
        handleCreatePayment,
        handleDeletePayment,
        handleAlinearPagoACabecera,
        handleAdjustLastPayment,
        handleCreateDifferencePayment,
        handleAlinearCabeceraAPagos,
        handleResetAndCreateSinglePayment
    } = useOperationDetailsHandlers({
        operacionId,
        tipoOperacion,
        cabeceraOriginal,
        cabeceraForm,
        itemForm,
        paymentForm,
        payments,
        onRefresh,
        loadDetails,
        setIsSaving,
        setEditingCabecera,
        setEditingItemId,
        setEditingPaymentId
    })

    if (loading) return (
        <div className="flex items-center justify-center py-8 col-span-2">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400 mr-2" />
            <span className="text-sm text-slate-400">Consultando detalles de la transacción...</span>
        </div>
    )

    if (error) return (
        <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg text-red-400 text-sm col-span-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />{error}
        </div>
    )

    const totalCabecera = parseFloat(cabeceraOriginal || 0)
    const totalPagos = payments.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
    const diferencia = totalCabecera - totalPagos
    const absDiferencia = Math.abs(diferencia)
    const isConciliado = absDiferencia < 0.01

    return (
        <div className="space-y-4 bg-slate-900/60 rounded-b-xl border-t border-slate-800/80 p-5">

            {/* Asistente de Conciliación Rápida */}
            <OperationConciliationAssistant
                isConciliado={isConciliado}
                absDiferencia={absDiferencia}
                diferencia={diferencia}
                payments={payments}
                totalCabecera={totalCabecera}
                totalPagos={totalPagos}
                isSaving={isSaving}
                handleAlinearPagoACabecera={handleAlinearPagoACabecera}
                handleCreateDifferencePayment={handleCreateDifferencePayment}
                handleAdjustLastPayment={handleAdjustLastPayment}
                handleAlinearCabeceraAPagos={handleAlinearCabeceraAPagos}
                handleResetAndCreateSinglePayment={handleResetAndCreateSinglePayment}
            />

            {/* Ajuste de Cabecera */}
            <OperationHeaderCard
                editingCabecera={editingCabecera}
                setEditingCabecera={setEditingCabecera}
                cabeceraForm={cabeceraForm}
                setCabeceraForm={setCabeceraForm}
                cabeceraOriginal={cabeceraOriginal}
                isSaving={isSaving}
                handleSaveCabecera={handleSaveCabecera}
            />

            {/* Grillas: Productos y Pagos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OperationItemsTable
                    items={items}
                    editingItemId={editingItemId}
                    setEditingItemId={setEditingItemId}
                    itemForm={itemForm}
                    setItemForm={setItemForm}
                    handleSaveItem={handleSaveItem}
                    isSaving={isSaving}
                />
                <OperationPaymentsTable
                    payments={payments}
                    editingPaymentId={editingPaymentId}
                    setEditingPaymentId={setEditingPaymentId}
                    paymentForm={paymentForm}
                    setPaymentForm={setPaymentForm}
                    handleSavePayment={handleSavePayment}
                    handleDeletePayment={handleDeletePayment}
                    handleCreatePayment={handleCreatePayment}
                    isSaving={isSaving}
                />
            </div>
        </div>
    )
}

export default OperationDetails
