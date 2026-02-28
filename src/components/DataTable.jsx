import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Search, Loader2, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DataTable = ({
    data,
    columns,
    isLoading,
    onSort,
    sortColumn,
    sortOrder,
    onFilter,
    renderExpandedRow,
    rowKey = 'id',
    compact = false,
    searchColumns = [],
    searchColumn,
    onSearchColumnChange,
    renderSearchInput
}) => {
    const [filterValue, setFilterValue] = useState('')
    const [expandedRow, setExpandedRow] = useState(null)

    const handleFilterChange = (val) => {
        setFilterValue(val)
        onFilter(val)
    }

    const toggleRow = (id) => {
        if (renderExpandedRow) {
            setExpandedRow(expandedRow === id ? null : id)
        }
    }

    const exportToCSV = () => {
        if (!data || data.length === 0) return

        const headers = columns.map(col => col.label).join(',')
        const rows = data.map(row =>
            columns.map(col => {
                const val = row[col.key] || ''
                // Simple escape for commas
                return `"${String(val).replace(/"/g, '""')}"`
            }).join(',')
        ).join('\n')

        const csvContent = `data:text/csv;charset=utf-8,\uFEFF${headers}\n${rows}`
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `export_${new Date().getTime()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="w-full glass-panel rounded-2xl overflow-visible">
            {/* Header / Filter */}
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/5 overflow-visible">
                <div className="relative flex items-center gap-4 w-full sm:w-auto">
                    {searchColumns && searchColumns.length > 0 && (
                        <select
                            value={searchColumn}
                            onChange={(e) => onSearchColumnChange(e.target.value)}
                            className="bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-300 py-2.5 pl-4 pr-10 cursor-pointer backdrop-blur-md outline-none transition-all"
                        >
                            {searchColumns.map((col) => (
                                <option key={col.key} value={col.key}>
                                    {col.label}
                                </option>
                            ))}
                        </select>
                    )}
                    <div className="relative w-full sm:w-auto group">
                        {renderSearchInput ? (
                            renderSearchInput(filterValue, handleFilterChange)
                        ) : (
                            <>
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar en tabla..."
                                    className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full sm:w-80 outline-none backdrop-blur-md transition-all"
                                    value={filterValue}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                />
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={exportToCSV}
                        disabled={isLoading || data.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        <span>Exportar</span>
                    </button>
                    {isLoading && <Loader2 className="animate-spin h-5 w-5 text-blue-500" />}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-visible custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-white/5 text-slate-400 uppercase text-[11px] font-black tracking-widest border-y border-white/5">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`${compact ? 'px-4 py-3' : 'px-6 py-4'} cursor-pointer hover:bg-white/5 hover:text-white transition-all select-none`}
                                    onClick={() => onSort(col.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        {sortColumn === col.key && (
                                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                                {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 text-blue-400" /> : <ChevronDown className="h-4 w-4 text-blue-400" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode='wait'>
                            {isLoading ? (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                                            <span className="text-slate-500 font-medium">Procesando datos...</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ) : data.length === 0 ? (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center text-slate-500 italic font-medium">
                                        No se encontraron registros coincidentes.
                                    </td>
                                </motion.tr>
                            ) : (
                                data.map((row, rowIndex) => (
                                    <React.Fragment key={row[rowKey] || rowIndex}>
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: rowIndex * 0.03 }}
                                            onClick={() => toggleRow(row[rowKey] !== undefined ? row[rowKey] : rowIndex)}
                                            className={`hover:bg-white/10 transition-all group ${renderExpandedRow ? 'cursor-pointer' : ''} ${expandedRow === (row[rowKey] !== undefined ? row[rowKey] : rowIndex) ? 'bg-white/10' : ''}`}
                                        >
                                            {columns.map((col) => (
                                                <td key={`${rowIndex}-${col.key}`} className={`whitespace-nowrap text-slate-300 group-hover:text-white transition-colors font-medium ${compact ? 'px-4 py-2 text-[11px]' : 'px-6 py-3.5'}`}>
                                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                                </td>
                                            ))}
                                        </motion.tr>
                                        {renderExpandedRow && expandedRow === (row[rowKey] !== undefined ? row[rowKey] : rowIndex) && (
                                            <motion.tr
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-blue-600/5"
                                            >
                                                <td colSpan={columns.length} className="px-6 py-6 border-l-2 border-blue-500 shadow-inner">
                                                    {renderExpandedRow(row)}
                                                </td>
                                            </motion.tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DataTable
