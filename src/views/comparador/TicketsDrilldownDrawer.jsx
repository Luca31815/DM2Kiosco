import React from 'react'
import { X, Receipt, Calendar, User, ShoppingCart } from 'lucide-react'
import { formatCurrency, formatNumber } from './comparadorFormatters'

const TicketsDrilldownDrawer = React.memo(({
    isOpen,
    onClose,
    activePeriod,
    onSwitchPeriod,
    inicioA,
    finA,
    inicioB,
    finB,
    categoria,
    producto,
    ticketsData,
    loading
}) => {
    if (!isOpen) return null

    const tickets = ticketsData?.tickets || []

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                            <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">
                                Visor de Tickets Reales (Auditoría Directa)
                            </h3>
                            <p className="text-xs text-slate-400">
                                {producto ? `Producto: ${producto}` : categoria ? `Categoría: ${categoria}` : 'Todo el Kiosco'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar visor de tickets"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Selector Período A vs B */}
                <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                        <button
                            type="button"
                            onClick={() => onSwitchPeriod('A')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activePeriod === 'A'
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Período Base A ({inicioA} a {finA})
                        </button>
                        <button
                            type="button"
                            onClick={() => onSwitchPeriod('B')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activePeriod === 'B'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Período Comp. B ({inicioB} a {finB})
                        </button>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                        {tickets.length} ticket(s) mostrados
                    </span>
                </div>

                {/* Lista de Tickets */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
                            Consultando tickets reales en public.ventas + public.ventas_detalles...
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            No se registraron tickets para este filtro en el Período {activePeriod}.
                        </div>
                    ) : (
                        tickets.map((t) => (
                            <div
                                key={t.venta_id}
                                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2.5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-black">
                                            #{t.venta_id} {t.nro_diario ? `(Diario #${t.nro_diario})` : ''}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {String(t.fecha).replace('T', ' ').slice(0, 16)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 mr-2">Total Ticket:</span>
                                        <strong className="text-sm font-black text-emerald-400 tabular-nums">
                                            {formatCurrency(t.total_venta)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-slate-500" />
                                        {t.cliente}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ShoppingCart className="h-3.5 w-3.5 text-slate-500" />
                                        Subtotal filtrado: <strong className="text-slate-200">{formatCurrency(t.subtotal_filtrado)}</strong> ({formatNumber(t.unidades_filtradas)} u)
                                    </span>
                                </div>

                                <div className="space-y-1 pt-1">
                                    {t.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-900/80"
                                        >
                                            <div className="truncate pr-2">
                                                <span className="font-bold text-slate-200">{item.producto}</span>
                                                <span className="text-[10px] text-slate-400 ml-2">({item.categoria})</span>
                                            </div>
                                            <div className="tabular-nums text-slate-300 flex-shrink-0">
                                                {formatNumber(item.cantidad)} × {formatCurrency(item.precio_unitario)} ={' '}
                                                <strong className="text-white">{formatCurrency(item.subtotal)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
})

TicketsDrilldownDrawer.displayName = 'TicketsDrilldownDrawer'

export default TicketsDrilldownDrawer
