import { toast } from 'react-hot-toast'
import * as api from '../../services/api'

export const useOperationDetailsHandlers = ({
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
}) => {
    // 1. Guardar Cabecera
    const handleSaveCabecera = async () => {
        const nuevoTotal = parseFloat(cabeceraForm.total)
        if (isNaN(nuevoTotal) || nuevoTotal < 0) {
            return toast.error('Ingresá un monto de cabecera válido')
        }
        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando cabecera de la operación...')
        try {
            await api.actualizarCabeceraOperacion(tipoOperacion, operacionId, nuevoTotal)
            toast.success('Monto de cabecera actualizado', { id: loadingToast })
            setEditingCabecera(false)
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 2. Guardar Item (Producto)
    const handleSaveItem = async (originalItem) => {
        const nuevaCant = parseFloat(itemForm.cantidad)
        const nuevoPrecio = parseFloat(itemForm.precio_unitario)
        if (isNaN(nuevaCant) || nuevaCant <= 0) return toast.error('La cantidad debe ser mayor a 0')
        if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return toast.error('El precio unitario debe ser válido')
        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando productos y recalculando...')
        try {
            await api.corregirOperacion({
                id_final: operacionId,
                items: [{ producto: originalItem.producto, nuevo_nombre: originalItem.nombre || originalItem.producto, nueva_cantidad: nuevaCant, nuevo_precio: nuevoPrecio }]
            })
            toast.success('Detalle de producto guardado con éxito', { id: loadingToast })
            setEditingItemId(null)
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 3. Guardar Pago de Caja
    const handleSavePayment = async (paymentId) => {
        const nuevoMonto = parseFloat(paymentForm.monto)
        if (isNaN(nuevoMonto) || nuevoMonto < 0) return toast.error('Ingresá un monto de pago válido')
        setIsSaving(true)
        const loadingToast = toast.loading('Actualizando movimiento de caja...')
        try {
            await api.actualizarMovimientoDinero(paymentId, { monto: nuevoMonto })
            toast.success('Pago de caja corregido', { id: loadingToast })
            setEditingPaymentId(null)
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 4. Crear Pago Manual
    const handleCreatePayment = async () => {
        setIsSaving(true)
        const loadingToast = toast.loading('Creando movimiento de caja compensatorio...')
        try {
            await api.crearMovimientoDinero({
                tipo: tipoOperacion === 'VENTA' ? 'ENTRADA' : 'SALIDA',
                monto: parseFloat(cabeceraOriginal),
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                metodo: 'Efectivo',
                notas: '[CONCILIADO MANUAL] Generado desde Auditoría para saldar descalce.',
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO'
            })
            toast.success('Movimiento de caja creado y conciliado', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error al crear movimiento: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 5. Eliminar Pago de Caja
    const handleDeletePayment = async (movimientoId) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro de pago de la caja?')) return
        setIsSaving(true)
        const loadingToast = toast.loading('Eliminando movimiento de caja...')
        try {
            await api.eliminarMovimientoDinero(movimientoId)
            toast.success('Movimiento de caja eliminado', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 6. Alinear Pago Único a la Cabecera
    const handleAlinearPagoACabecera = async () => {
        if (payments.length !== 1) return
        const payment = payments[0]
        const totalCabecera = parseFloat(cabeceraOriginal || 0)
        setIsSaving(true)
        const loadingToast = toast.loading('Alineando pago a cabecera...')
        try {
            await api.actualizarMovimientoDinero(payment.movimiento_id, { monto: totalCabecera })
            toast.success('Pago de caja corregido', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 7. Ajustar último pago para absorber la diferencia
    const handleAdjustLastPayment = async (diferencia) => {
        if (payments.length === 0) return
        const lastPayment = payments[payments.length - 1]
        const nuevoMonto = parseFloat(lastPayment.monto || 0) + diferencia
        if (nuevoMonto < 0) {
            return toast.error('El monto resultante para el pago sería negativo. Elimine el pago o ajuste manualmente.')
        }
        setIsSaving(true)
        const loadingToast = toast.loading('Ajustando el último pago para saldar la diferencia...')
        try {
            await api.actualizarMovimientoDinero(lastPayment.movimiento_id, { monto: nuevoMonto })
            toast.success('Último pago ajustado con éxito', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 8. Crear Pago por la Diferencia
    const handleCreateDifferencePayment = async (diferencia) => {
        if (diferencia <= 0) return
        setIsSaving(true)
        const loadingToast = toast.loading('Creando pago por la diferencia...')
        try {
            await api.crearMovimientoDinero({
                tipo: tipoOperacion === 'VENTA' ? 'ENTRADA' : 'SALIDA',
                monto: diferencia,
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                metodo: 'Efectivo',
                notas: '[CONCILIADO MANUAL] Pago por diferencia para saldar descalce.',
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO'
            })
            toast.success('Pago por la diferencia creado con éxito', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 9. Alinear cabecera a la suma de pagos
    const handleAlinearCabeceraAPagos = async (totalPagos) => {
        if (isNaN(totalPagos) || totalPagos < 0) return toast.error('Monto de pagos inválido')
        setIsSaving(true)
        const loadingToast = toast.loading('Alineando cabecera al total de pagos...')
        try {
            await api.actualizarCabeceraOperacion(tipoOperacion, operacionId, totalPagos)
            toast.success('Monto de cabecera alineado con los pagos', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    // 10. Reemplazar todos los pagos con uno único por la cabecera
    const handleResetAndCreateSinglePayment = async (totalCabecera) => {
        if (!window.confirm(`¿Estás seguro de eliminar todos los pagos actuales (${payments.length}) y reemplazarlos con un único pago de $${totalCabecera.toLocaleString('es-AR')}?`)) return
        setIsSaving(true)
        const loadingToast = toast.loading('Reemplazando pagos con pago único...')
        try {
            await Promise.all(payments.map(p => api.eliminarMovimientoDinero(p.movimiento_id)))
            await api.crearMovimientoDinero({
                tipo: tipoOperacion === 'VENTA' ? 'ENTRADA' : 'SALIDA',
                monto: totalCabecera,
                referencia_id: operacionId,
                referencia_tipo: tipoOperacion,
                metodo: 'Efectivo',
                notas: '[CONCILIADO MANUAL] Reemplazo de pagos múltiples para saldar descalce.',
                tipo_movimiento: tipoOperacion === 'VENTA' ? 'INGRESO' : 'EGRESO'
            })
            toast.success('Pagos reemplazados con éxito', { id: loadingToast })
            onRefresh()
            await loadDetails()
        } catch (err) {
            toast.error(`Error: ${err.message || 'Desconocido'}`, { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    return {
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
    }
}
