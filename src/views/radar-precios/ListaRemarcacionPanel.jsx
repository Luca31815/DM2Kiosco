import React from 'react'
import { ClipboardCheck, Download, Trash2, ShieldAlert, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatNumber } from '../comparador/comparadorFormatters'

const ListaRemarcacionPanel = React.memo(({
    remarcacionItems,
    gananciaAdicionalTotal,
    onRemoveItem,
    onClearList
}) => {
    if (!remarcacionItems || remarcacionItems.length === 0) return null

    const handleCopyClipboard = async () => {
        const lines = [
            `📋 LISTA DE REMARCACIÓN DM2KIOSCO (${remarcacionItems.length} productos)`,
            `Ganancia mensual adicional proyectada: +${formatCurrency(gananciaAdicionalTotal)}/mes`,
            '--------------------------------------------------'
        ]
        for (const it of remarcacionItems) {
            lines.push(
                `• ${it.producto}: ${formatCurrency(it.pv_actual)} ➔ ${formatCurrency(it.sim.pvPropuesto)} (Costo real: ${formatCurrency(it.costo_real_unitario)} | Margen: ${formatNumber(it.sim.margenNuevoPct, 1)}%)`
            )
        }
        try {
            await navigator.clipboard.writeText(lines.join('\n'))
            toast.success('Lista de remarcación copiada al portapapeles')
        } catch {
            toast.error('No se pudo copiar automáticamente al portapapeles')
        }
    }

    const handleExportCSV = () => {
        const headers = [
            'Producto',
            'Categoria',
            'Ultimo_Proveedor',
            'Costo_Factura',
            'Logistica_Unitaria',
            'Costo_Real_Unitario',
            'PV_Actual',
            'Nuevo_PV_Propuesto',
            'Ganancia_Unit_Nueva',
            'Markup_Nuevo_Pct',
            'Margen_Nuevo_Pct',
            'Unidades_Mes',
            'Ganancia_Mensual_Adicional'
        ]
        const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
        const rows = remarcacionItems.map((it) => [
            escapeCsv(it.producto),
            escapeCsv(it.categoria),
            escapeCsv(it.ultimo_proveedor),
            it.ultimo_costo_compra,
            it.costo_logistico_unitario,
            it.costo_real_unitario,
            it.pv_actual,
            it.sim.pvPropuesto,
            it.sim.gananciaUnitariaNueva,
            it.sim.markupNuevoPct,
            it.sim.margenNuevoPct,
            it.unidades_vendidas,
            it.sim.gananciaMensualAdicional
        ].join(','))

        const csvContent = `\uFEFF${headers.join(',')}\n${rows.join('\n')}`
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `lista_remarcacion_kiosco_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Archivo CSV de remarcación descargado')
    }

    return (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-500/40 bg-indigo-950/15 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">
                            Lista de Remarcación Planificada ({remarcacionItems.length} productos seleccionados)
                        </h3>
                        <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                            <span>
                                Planificación en solo lectura (no modifica <code>productos_base</code> a ciegas). Ganancia adicional proyectada:{' '}
                                <strong className="text-emerald-400">+{formatCurrency(gananciaAdicionalTotal)}/mes</strong>
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopyClipboard}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 cursor-pointer"
                    >
                        <ClipboardCheck className="h-4 w-4" />
                        <span>Copiar al Portapapeles</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold text-xs cursor-pointer"
                    >
                        <Download className="h-4 w-4" />
                        <span>Exportar CSV</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClearList}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 font-semibold text-xs cursor-pointer"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Vaciar Lista</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {remarcacionItems.map((it) => (
                    <div
                        key={it.producto}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                        <div className="min-w-0">
                            <div className="font-bold text-white truncate">{it.producto}</div>
                            <div className="text-[11px] text-slate-400">
                                Costo real: {formatCurrency(it.costo_real_unitario)} ·{' '}
                                <span className="text-slate-300">{formatCurrency(it.pv_actual)}</span> ➔{' '}
                                <strong className="text-emerald-400">{formatCurrency(it.sim.pvPropuesto)}</strong>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemoveItem(it.producto)}
                            aria-label={`Quitar ${it.producto} de la lista`}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer flex-shrink-0"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
})

ListaRemarcacionPanel.displayName = 'ListaRemarcacionPanel'

export default ListaRemarcacionPanel
