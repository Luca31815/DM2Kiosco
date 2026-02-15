import React from 'react'
import { FileWarning, Loader2 } from 'lucide-react'

export default function SalesTable({ data, loading, error }) {
    if (loading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Cargando datos...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full p-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-200">
                <FileWarning className="w-5 h-5 shrink-0" />
                <div>
                    <p className="font-semibold">Error al cargar datos</p>
                    <p className="text-sm opacity-80">{error.message}</p>
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-lg border border-slate-800 border-dashed">
                <p>No se encontraron registros en la tabla &quot;ventas&quot;.</p>
                <p className="text-sm mt-1">Asegúrate de que la tabla existe y tiene datos.</p>
            </div>
        )
    }

    // Dynamically get headers from first item
    const headers = Object.keys(data[0])

    return (
        <div className="w-full bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-slate-200 uppercase tracking-wider font-semibold text-xs border-b border-slate-700">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-6 py-4">
                                    {header.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {data.map((row, rowIndex) => (
                            <tr key={row.id || rowIndex} className="hover:bg-slate-700/30 transition-colors duration-150 group">
                                {headers.map((header, colIndex) => (
                                    <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 text-slate-300 group-hover:text-white transition-colors">
                                        {formatValue(header, row[header])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-700/50">
                {data.map((row, rowIndex) => (
                    <div key={row.id || rowIndex} className="p-4 space-y-3 bg-slate-800/20">
                        {headers.map((header) => (
                            <div key={header} className="flex justify-between items-center gap-4">
                                <span className="text-xs uppercase font-medium text-slate-500 tracking-wide">
                                    {header.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-slate-200 text-right">
                                    {formatValue(header, row[header])}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

function formatValue(key, value) {
    if (value === null || value === undefined) return '-'

    if (key.toLowerCase().includes('precio') || key.toLowerCase().includes('monto') || key.toLowerCase().includes('total')) {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value))
    }

    if (key.toLowerCase().includes('fecha') || key.toLowerCase().includes('date') || key.toLowerCase().includes('created_at')) {
        return new Date(value).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    if (typeof value === 'boolean') {
        return value ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Sí</span>
        ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">No</span>
        )
    }

    return String(value)
}
