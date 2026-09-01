import React, { useState, useMemo, useCallback } from 'react'
import DataTable from '../components/DataTable'
import { useHistorialBot } from '../hooks/useData'
import * as api from '../services/api'
import { toast } from 'react-hot-toast'
import {
    History,
    CheckCircle,
    XCircle,
    AlertCircle,
    Ban,
    Tag,
    RefreshCw,
    Clock,
    Loader2,
    Sparkles,
    AlertTriangle,
    MessageSquare,
    Terminal,
    ArrowUpRight
} from 'lucide-react'
import HistorialEditModal from './historial/HistorialEditModal'

const ExpandedRow = ({ row, onEdit, onCancel, isCanceling }) => {
    const isCancelled = row.estado === 'CANCELADO'
    const isPending = row.estado === 'PENDIENTE' || row.estado === 'PROCESANDO'

    return (
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 mx-2 mb-3 text-sm text-slate-300 space-y-4 shadow-xl">
            {/* Header info de fila expandida */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-800 text-purple-300 border border-slate-700">
                        Log #{row.log_id}
                    </span>
                    {row.operacion_id && (
                        <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-800/60 flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {row.operacion_id}
                        </span>
                    )}
                    {row.chat_id && (
                        <span className="text-xs text-slate-400 font-mono">
                            Remitente: {row.chat_id}
                        </span>
                    )}
                </div>

                {/* Acciones directas en fila expandida */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all"
                    >
                        <Tag className="w-3.5 h-3.5" />
                        Cambiar Etiqueta / Estado
                    </button>

                    {!isCancelled && (
                        <button
                            type="button"
                            disabled={isCanceling}
                            onClick={() => onCancel(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                            {isCanceling ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Ban className="w-3.5 h-3.5" />
                            )}
                            {row.operacion_id ? 'Cancelar Operación' : 'Cancelar Mensaje'}
                        </button>
                    )}
                </div>
            </div>

            {/* Mensajes y Detalles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mensaje Inicial */}
                <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase text-[11px] font-bold tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        Mensaje Original (WhatsApp / Usuario):
                    </span>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-200 font-sans italic min-h-[50px] break-words whitespace-pre-wrap">
                        {row.mensaje_inicial || <span className="text-slate-600 italic">Sin mensaje inicial registrado</span>}
                    </div>
                </div>

                {/* Mensaje Enviado / Respuesta */}
                <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase text-[11px] font-bold tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Respuesta del Bot / Confirmación:
                    </span>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-200 font-sans min-h-[50px] break-words whitespace-pre-wrap">
                        {row.mensaje_enviado || <span className="text-slate-600 italic">Sin respuesta registrada aún</span>}
                    </div>
                </div>
            </div>

            {/* Detalle Error (si existe) */}
            {row.detalle_error && (
                <div className="space-y-1.5">
                    <span className="text-red-400 uppercase text-[11px] font-bold tracking-wider flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        Detalle del Error / Traza:
                    </span>
                    <div className="bg-red-950/20 text-red-300 p-3 rounded-xl border border-red-900/40 font-mono text-xs break-words whitespace-pre-wrap">
                        {row.detalle_error}
                    </div>
                </div>
            )}
        </div>
    )
}

const SEARCH_COLUMNS = [
    { key: 'tipo_accion', label: 'Acción' },
    { key: 'operacion_id', label: 'ID Operación' },
    { key: 'mensaje_inicial', label: 'Mensaje Inicial' },
    { key: 'mensaje_enviado', label: 'Mensaje Enviado' },
    { key: 'log_id', label: 'ID Log' },
]

const HistorialView = () => {
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('tipo_accion')
    const [statusTab, setStatusTab] = useState('TODOS')
    const [editingMessage, setEditingMessage] = useState(null)
    const [cancelingLogId, setCancelingLogId] = useState(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const { data: rawData, loading, mutate } = useHistorialBot({
        sortColumn,
        sortOrder,
        filterColumn,
        filterValue
    })

    // Refresco manual con animación
    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await mutate()
            toast.success('Historial actualizado')
        } catch (err) {
            console.error('Error al refrescar historial:', err)
            toast.error('Error al actualizar historial')
        } finally {
            setIsRefreshing(false)
        }
    }

    // Estadísticas / KPIs
    const stats = useMemo(() => {
        if (!rawData || !rawData.length) {
            return { total: 0, pendientes: 0, enviados: 0, errores: 0, cancelados: 0 }
        }
        let pendientes = 0
        let enviados = 0
        let errores = 0
        let cancelados = 0

        rawData.forEach((row) => {
            const st = (row.estado || '').toUpperCase()
            if (st === 'PENDIENTE' || st === 'PROCESANDO') pendientes++
            else if (st === 'ENVIADO' || st === 'EXITO') enviados++
            else if (st === 'ERROR') errores++
            else if (st === 'CANCELADO') cancelados++
        })

        return {
            total: rawData.length,
            pendientes,
            enviados,
            errores,
            cancelados
        }
    }, [rawData])

    // Filtrado por pestaña de estado
    const filteredData = useMemo(() => {
        if (!rawData) return []
        if (statusTab === 'TODOS') return rawData
        if (statusTab === 'PROCESANDO') {
            return rawData.filter((r) => {
                const st = (r.estado || '').toUpperCase()
                return st === 'PENDIENTE' || st === 'PROCESANDO'
            })
        }
        if (statusTab === 'ENVIADOS') {
            return rawData.filter((r) => {
                const st = (r.estado || '').toUpperCase()
                return st === 'ENVIADO' || st === 'EXITO'
            })
        }
        if (statusTab === 'ERRORES') {
            return rawData.filter((r) => (r.estado || '').toUpperCase() === 'ERROR')
        }
        if (statusTab === 'CANCELADOS') {
            return rawData.filter((r) => (r.estado || '').toUpperCase() === 'CANCELADO')
        }
        return rawData
    }, [rawData, statusTab])

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    // Cancelación segura de mensaje / operación
    const handleCancelMessage = useCallback(async (row) => {
        const isOp = row.operacion_id && row.operacion_id.trim() !== ''
        const confirmMsg = isOp
            ? `¿Estás seguro de cancelar la operación ${row.operacion_id}? Se revertirán los movimientos de stock y dinero.`
            : `¿Estás seguro de cancelar el mensaje #${row.log_id}?`

        if (!window.confirm(confirmMsg)) return

        setCancelingLogId(row.log_id)
        const toastId = toast.loading(isOp ? 'Cancelando operación y revirtiendo movimientos...' : 'Cancelando mensaje...')

        try {
            await api.cancelarMensajeHistorial({
                log_id: row.log_id,
                operacion_id: row.operacion_id
            })

            toast.success(
                isOp ? `Operación ${row.operacion_id} cancelada con éxito` : `Mensaje #${row.log_id} marcado como cancelado`,
                { id: toastId }
            )
            mutate()
        } catch (err) {
            console.error('Error al cancelar:', err)
            toast.error(`Error al cancelar: ${err.message || 'Error desconocido'}`, { id: toastId })
        } finally {
            setCancelingLogId(null)
        }
    }, [mutate])

    // Columnas de la tabla
    const columns = useMemo(() => [
        {
            key: 'log_id',
            label: 'ID',
            width: 'w-20',
            render: (val) => <span className="font-mono text-slate-500 text-xs">#{val}</span>
        },
        {
            key: 'fecha',
            label: 'Fecha',
            width: 'w-44',
            render: (val) => (
                <span className="text-xs text-slate-300 font-medium">
                    {val ? new Date(val).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                </span>
            )
        },
        {
            key: 'operacion_id',
            label: 'Operación',
            width: 'w-40',
            render: (val) => {
                if (!val) return <span className="text-slate-600 text-xs">-</span>
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-950/70 text-blue-300 border border-blue-800/50">
                        {val}
                    </span>
                )
            }
        },
        {
            key: 'tipo_accion',
            label: 'Acción / Etiqueta',
            width: 'w-36',
            render: (val, row) => (
                <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50">
                        {val || 'DESCONOCIDO'}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setEditingMessage(row)
                        }}
                        title="Cambiar etiqueta"
                        className="p-1 rounded-md text-slate-500 hover:text-purple-400 hover:bg-slate-800 transition-colors"
                    >
                        <Tag className="w-3 h-3" />
                    </button>
                </div>
            )
        },
        {
            key: 'estado',
            label: 'Estado',
            width: 'w-36',
            render: (val) => {
                const st = (val || '').toUpperCase()
                if (st === 'ENVIADO' || st === 'EXITO') {
                    return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            <CheckCircle className="w-3 h-3" /> ENVIADO
                        </span>
                    )
                }
                if (st === 'PENDIENTE' || st === 'PROCESANDO') {
                    return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/50 animate-pulse">
                            <Clock className="w-3 h-3 animate-spin" /> {st}
                        </span>
                    )
                }
                if (st === 'ERROR') {
                    return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-950/60 text-red-400 border border-red-800/50">
                            <XCircle className="w-3 h-3" /> ERROR
                        </span>
                    )
                }
                if (st === 'CANCELADO') {
                    return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-950/60 text-orange-400 border border-orange-800/50">
                            <Ban className="w-3 h-3" /> CANCELADO
                        </span>
                    )
                }
                return <span className="text-slate-400 text-xs">{val || 'SIN ESTADO'}</span>
            }
        },
        {
            key: 'mensaje_inicial',
            label: 'Mensaje',
            width: 'w-1/3',
            wrap: true,
            render: (val, row) => (
                <div className="space-y-0.5 max-w-md">
                    <span className="text-slate-200 text-xs block truncate" title={val || row.mensaje_enviado || ''}>
                        {val || row.mensaje_enviado || <span className="text-slate-600 italic">Sin texto</span>}
                    </span>
                    {row.detalle_error && (
                        <span className="text-red-400 text-[10px] block truncate font-mono">
                            ⚠️ {row.detalle_error}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'acciones',
            label: 'Acciones',
            width: 'w-32',
            render: (_, row) => {
                const isCanceling = cancelingLogId === row.log_id
                const isCancelled = (row.estado || '').toUpperCase() === 'CANCELADO'

                return (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Botón Editar Etiqueta */}
                        <button
                            type="button"
                            onClick={() => setEditingMessage(row)}
                            title="Cambiar etiqueta o estado"
                            className="p-1.5 text-purple-400 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                            <Tag className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Cancelar */}
                        {!isCancelled && (
                            <button
                                type="button"
                                disabled={isCanceling}
                                onClick={() => handleCancelMessage(row)}
                                title={row.operacion_id ? 'Cancelar y revertir operación' : 'Cancelar mensaje en proceso'}
                                className="p-1.5 text-orange-400 hover:text-white bg-orange-950/40 hover:bg-orange-900/60 border border-orange-800/50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                            >
                                {isCanceling ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Ban className="w-3.5 h-3.5" />
                                )}
                            </button>
                        )}
                    </div>
                )
            }
        }
    ], [cancelingLogId, handleCancelMessage])

    return (
        <div className="space-y-6">
            {/* Header con título y botón de actualización */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                            <History className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                            Historial de Mensajes y Operaciones
                        </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                        Monitoreo en tiempo real, cancelación de mensajes en proceso y gestión de etiquetas.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white shadow-lg transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Tarjetas / KPIs de Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Total Registros
                    </span>
                    <span className="text-xl font-black text-white">{stats.total}</span>
                </div>

                <div className={`p-3.5 rounded-2xl border backdrop-blur-sm transition-all ${
                    stats.pendientes > 0
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] animate-pulse'
                        : 'bg-slate-900/60 border-slate-800'
                }`}>
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En Proceso
                    </span>
                    <span className="text-xl font-black text-amber-300">{stats.pendientes}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Enviados
                    </span>
                    <span className="text-xl font-black text-emerald-300">{stats.enviados}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Errores
                    </span>
                    <span className="text-xl font-black text-red-300">{stats.errores}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Cancelados
                    </span>
                    <span className="text-xl font-black text-orange-300">{stats.cancelados}</span>
                </div>
            </div>

            {/* Pestañas de Filtrado por Estado */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl w-fit">
                {[
                    { id: 'TODOS', label: 'Todos' },
                    {
                        id: 'PROCESANDO',
                        label: '⏳ En Proceso / Pendientes',
                        badge: stats.pendientes > 0 ? stats.pendientes : null
                    },
                    { id: 'ENVIADOS', label: '✅ Enviados / Éxito' },
                    { id: 'ERRORES', label: '⚠️ Errores', badge: stats.errores > 0 ? stats.errores : null },
                    { id: 'CANCELADOS', label: '🚫 Cancelados' },
                ].map((tab) => {
                    const isActive = statusTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isActive
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tabla Principal */}
            <DataTable
                data={filteredData}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={setFilterValue}
                searchColumns={SEARCH_COLUMNS}
                searchColumn={filterColumn}
                onSearchColumnChange={setFilterColumn}
                renderExpandedRow={(row) => (
                    <ExpandedRow
                        row={row}
                        onEdit={(r) => setEditingMessage(r)}
                        onCancel={handleCancelMessage}
                        isCanceling={cancelingLogId === row.log_id}
                    />
                )}
                rowKey="log_id"
                minWidth="900px"
            />

            {/* Modal para Editar Etiqueta / Estado */}
            <HistorialEditModal
                isOpen={!!editingMessage}
                message={editingMessage}
                onClose={() => setEditingMessage(null)}
                onSuccess={() => mutate()}
            />
        </div>
    )
}

export default HistorialView
