import React, { useState, useEffect } from 'react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { Tag, CheckCircle, X, Loader2, Info, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as api from '../../services/api'

const ACCIONES_SUGERIDAS = [
    'VENTA',
    'COMPRA',
    'RESERVA',
    'CONSULTA',
    'IA_AGENT',
    'SISTEMA',
    'DESCONOCIDO',
    'IGNORADO',
    'CANCELACION',
    'CORRECCION',
    'DINERO',
    'STOCK'
]

const ESTADOS_SUGERIDOS = [
    { value: 'ENVIADO', label: 'ENVIADO / ÉXITO', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { value: 'PENDIENTE', label: 'PENDIENTE', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { value: 'PROCESANDO', label: 'PROCESANDO', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { value: 'ERROR', label: 'ERROR', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
    { value: 'CANCELADO', label: 'CANCELADO', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    { value: 'IGNORADO', label: 'IGNORADO / OCULTO', color: 'bg-slate-700/50 text-slate-400 border-slate-600' }
]

const HistorialEditModal = ({ isOpen, onClose, message, onSuccess }) => {
    const [tipoAccion, setTipoAccion] = useState('')
    const [customTipo, setCustomTipo] = useState('')
    const [estado, setEstado] = useState('ENVIADO')
    const [detalleError, setDetalleError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (message) {
            const currentTipo = message.tipo_accion || 'DESCONOCIDO'
            if (ACCIONES_SUGERIDAS.includes(currentTipo)) {
                setTipoAccion(currentTipo)
                setCustomTipo('')
            } else {
                setTipoAccion('OTRO')
                setCustomTipo(currentTipo)
            }
            setEstado(message.estado || 'ENVIADO')
            setDetalleError(message.detalle_error || '')
        }
    }, [message])

    if (!isOpen || !message) return null

    const resolvedTipo = tipoAccion === 'OTRO' ? customTipo.trim().toUpperCase() : tipoAccion

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        const toastId = toast.loading('Actualizando mensaje en el historial...')

        try {
            // Si se seleccionó CANCELADO y el mensaje tiene operacion_id, ejecutar cancelación atómica
            if (estado === 'CANCELADO' && message.operacion_id && message.operacion_id.trim() !== '') {
                await api.cancelarMensajeHistorial({
                    log_id: message.log_id,
                    operacion_id: message.operacion_id
                })
                toast.success(`Operación ${message.operacion_id} cancelada y revertida con éxito`, { id: toastId })
            } else {
                await api.actualizarMensajeHistorial(message.log_id, {
                    tipo_accion: resolvedTipo || null,
                    estado: estado || null,
                    detalle_error: detalleError.trim() || null
                })
                toast.success('Etiqueta y estado actualizados correctamente', { id: toastId })
            }

            if (onSuccess) onSuccess()
            onClose()
        } catch (err) {
            console.error('Error al actualizar mensaje:', err)
            toast.error(`Error al guardar cambios: ${err.message || 'Error desconocido'}`, { id: toastId })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <LazyMotion features={domAnimation}>
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 my-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Editar Etiqueta / Estado
                                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                                            #{message.log_id}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {message.fecha ? new Date(message.fecha).toLocaleString() : 'Fecha no disponible'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Preview del mensaje */}
                            {message.mensaje_inicial && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Mensaje Original (WhatsApp)
                                    </span>
                                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-300 font-sans italic max-h-24 overflow-y-auto">
                                        "{message.mensaje_inicial}"
                                    </div>
                                </div>
                            )}

                            {/* Alerta de Operación Vinculada */}
                            {message.operacion_id && (
                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300">
                                    <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-blue-200">Operación vinculada: </span>
                                        <code className="bg-blue-900/50 px-1.5 py-0.5 rounded text-blue-200 font-mono">
                                            {message.operacion_id}
                                        </code>
                                        <p className="text-[11px] text-blue-300/80 mt-1">
                                            Si cambiás el estado a <strong>CANCELADO</strong>, se ejecutarán automáticamente las devoluciones de stock y dinero en el sistema.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Selector de Tipo de Acción (Etiqueta) */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                    Acción / Etiqueta del Mensaje
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {ACCIONES_SUGERIDAS.map((tipo) => {
                                        const isSelected = tipoAccion === tipo
                                        return (
                                            <button
                                                key={tipo}
                                                type="button"
                                                onClick={() => {
                                                    setTipoAccion(tipo)
                                                    setCustomTipo('')
                                                }}
                                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                                                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                                                }`}
                                            >
                                                {tipo}
                                            </button>
                                        )
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => setTipoAccion('OTRO')}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                            tipoAccion === 'OTRO'
                                                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-600'
                                        }`}
                                    >
                                        + Personalizada
                                    </button>
                                </div>

                                {tipoAccion === 'OTRO' && (
                                    <input
                                        type="text"
                                        value={customTipo}
                                        onChange={(e) => setCustomTipo(e.target.value)}
                                        placeholder="Ej: CONSULTA_PRECIO, RECLAMO..."
                                        className="w-full mt-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 uppercase font-mono"
                                        required
                                    />
                                )}
                            </div>

                            {/* Selector de Estado */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                    Estado del Mensaje
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {ESTADOS_SUGERIDOS.map((est) => {
                                        const isSelected = estado === est.value
                                        return (
                                            <button
                                                key={est.value}
                                                type="button"
                                                onClick={() => setEstado(est.value)}
                                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${est.color} ${
                                                    isSelected
                                                        ? 'ring-2 ring-white/30 shadow-lg brightness-125'
                                                        : 'opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                <span>{est.label}</span>
                                                {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Detalle Error / Notas */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                    Detalle Error / Nota de Estado (Opcional)
                                </label>
                                <textarea
                                    value={detalleError}
                                    onChange={(e) => setDetalleError(e.target.value)}
                                    rows={2}
                                    placeholder="Motivo de cancelación, error recibido o notas internas..."
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </m.div>
                </div>
            </AnimatePresence>
        </LazyMotion>
    )
}

export default HistorialEditModal
