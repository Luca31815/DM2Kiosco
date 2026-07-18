import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const ProductPivotTable = ({
    renderSearchInput,
    filterValue,
    setFilterValue,
    pivotData,
    periodType,
    loading
}) => {
    const scrollContainerRef = useRef(null)

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    if (loading) {
        return (
            <div className="py-20 flex justify-center items-center">
                <div className="h-8 w-8 rounded-full border-4 border-gray-700 border-t-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl relative group">
            <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-sm text-gray-400">Vista de Pivote (Cantidad Vendida)</span>
                {renderSearchInput(filterValue, setFilterValue)}
            </div>

            <button type="button"
                onClick={() => scroll('left')}
                className="absolute left-[200px] top-1/2 -translate-y-1/2 z-30 p-2 bg-gray-900/80 border border-gray-700 rounded-full text-white shadow-xl hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                title="Desplazar a la izquierda"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button"
                onClick={() => scroll('right')}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-gray-900/80 border border-gray-700 rounded-full text-white shadow-xl hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                title="Desplazar a la derecha"
            >
                <ChevronRight className="h-6 w-6" />
            </button>

            <div
                ref={scrollContainerRef}
                className="overflow-x-auto custom-scrollbar max-h-[70vh] overflow-y-auto"
            >
                <table className="w-full text-sm text-left text-gray-300 border-separate border-spacing-0">
                    <thead className="sticky top-0 z-40">
                        <tr>
                            <th className="px-6 py-4 sticky left-0 top-0 z-50 bg-gray-800 border-b border-r border-gray-700 shadow-xl min-w-[200px]">
                                Producto
                            </th>
                            {pivotData.periods.map(p => {
                                const [year, month, day] = p.split('-').map(Number)
                                const d = new Date(year, month - 1, day)
                                return (
                                    <th key={p} className="px-6 py-4 min-w-[120px] text-center whitespace-nowrap bg-gray-800 border-b border-gray-700">
                                        {periodType === 'MENSUAL'
                                            ? d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
                                            : `${d.getDate()}/${d.getMonth() + 1}`}
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {pivotData.rows.length === 0 ? (
                            <tr>
                                <td colSpan={pivotData.periods.length + 1} className="px-6 py-12 text-center text-gray-500">
                                    No hay datos para mostrar en este período.
                                </td>
                            </tr>
                        ) : (
                            pivotData.rows.map((row, i) => (
                                <tr key={row.producto} className={i % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-900/20'}>
                                    <td className="px-6 py-3 font-medium text-white sticky left-0 z-20 bg-gray-900 border-r border-gray-800 shadow-lg truncate max-w-[250px]" title={row.producto}>
                                        {row.producto}
                                    </td>
                                    {pivotData.periods.map(p => {
                                        const qty = row[p] || 0
                                        return (
                                            <td key={p} className={`px-6 py-3 text-center tabular-nums font-mono ${qty > 0 ? 'text-indigo-400 font-bold' : 'text-gray-600'}`}>
                                                {qty > 0 ? qty : '-'}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
