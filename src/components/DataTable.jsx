import React, { useState, memo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Search, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { LazyMotion, domAnimation, m } from 'framer-motion'

const DataTableRow = memo(({ row, rowIndex, columns, compact, renderExpandedRow, isExpanded, toggleRow, rowKey }) => {
    return (
        <React.Fragment>
            <tr
                onClick={() => toggleRow(row[rowKey] !== undefined ? row[rowKey] : rowIndex)}
                role={renderExpandedRow ? "button" : undefined}
                tabIndex={renderExpandedRow ? 0 : undefined}
                onKeyDown={(e) => {
                    if (renderExpandedRow && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        toggleRow(row[rowKey] !== undefined ? row[rowKey] : rowIndex);
                    }
                }}
                className={`hover:bg-white/10 transition-colors duration-75 group ${renderExpandedRow ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-white/10' : ''}`}
                style={{ transform: 'translateZ(0)' }}
            >
                {columns.map((col) => (
                    <td key={col.key} className={`text-slate-300 group-hover:text-white transition-colors font-medium ${compact ? 'px-3 py-2 text-[11px]' : 'px-4 md:px-6 py-3'} ${col.wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'}`}>
                        {(() => {
                            try {
                                return col.render ? col.render(row[col.key], row) : row[col.key] || '-'
                            } catch (err) {
                                console.error(`Error rendering column ${col.key}:`, err)
                                return <span className="text-red-500/50 text-[10px] italic">Error</span>
                            }
                        })()}
                    </td>
                ))}
            </tr>
            {renderExpandedRow && isExpanded && (
                <m.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-blue-600/5"
                >
                    <td colSpan={columns.length} className="px-2 md:px-6 py-4 border-l-2 border-blue-500 shadow-inner overflow-hidden">
                        {renderExpandedRow(row)}
                    </td>
                </m.tr>
            )}
        </React.Fragment>
    )
})
DataTableRow.displayName = 'DataTableRow'

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
    renderSearchInput,
    serverSide = false,
    totalCount = 0,
    onPageChange,
    currentPage: externalPage,
    itemsPerPage = 20,
    minWidth
}) => {
    const [filterValue, setFilterValue] = useState('')
    const [expandedRow, setExpandedRow] = useState(null)
    const [internalPage, setInternalPage] = useState(1)
    const [prevDataLength, setPrevDataLength] = useState(data.length)

    if (data.length !== prevDataLength) {
        if (!serverSide) setInternalPage(1)
        setPrevDataLength(data.length)
    }

    const currentPage = serverSide ? externalPage : internalPage
    const setCurrentPage = serverSide ? onPageChange : setInternalPage

    const totalRows = serverSide ? totalCount : data.length
    const totalPages = Math.ceil(totalRows / itemsPerPage)
    const paginatedData = serverSide ? data : data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleFilterChange = useCallback((val) => {
        setFilterValue(val)
        onFilter(val)
    }, [onFilter])

    const toggleRow = useCallback((id) => {
        if (renderExpandedRow) {
            setExpandedRow(prev => prev === id ? null : id)
        }
    }, [renderExpandedRow])

    const exportToCSV = useCallback(() => {
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
    }, [data, columns])

    return (
        <LazyMotion features={domAnimation}>
            <div className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '300px' }}>
                {/* Header / Filter */}
                <div className="p-4 md:p-6 flex flex-col gap-3 bg-white/5 shrink-0">
                    {/* Row 1: Search filter controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {searchColumns && searchColumns.length > 0 && (
                            <select
                                value={searchColumn}
                                onChange={(e) => onSearchColumnChange(e.target.value)}
                                aria-label="Seleccionar columna de búsqueda"
                                className="bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-300 py-2.5 pl-4 pr-10 cursor-pointer backdrop-blur-md outline-none transition-all w-full sm:w-auto shrink-0"
                            >
                                {searchColumns.map((col) => (
                                    <option key={col.key} value={col.key}>
                                        {col.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        <div className="relative flex-1 group">
                            {renderSearchInput ? (
                                renderSearchInput(filterValue, handleFilterChange)
                            ) : (
                                <>
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Buscar en tabla..."
                                        aria-label="Buscar en tabla"
                                        className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full outline-none transition-all"
                                        value={filterValue}
                                        onChange={(e) => handleFilterChange(e.target.value)}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    {/* Row 2: Export + loading */}
                    <div className="flex items-center justify-between">
                        <button type="button"
                            onClick={exportToCSV}
                            disabled={isLoading || data.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Exportar CSV</span>
                            <span className="sm:hidden">CSV</span>
                        </button>
                        {isLoading && <Loader2 className="animate-spin h-5 w-5 text-blue-500" />}
                        {!isLoading && totalRows > 0 && (
                            <span className="text-xs text-slate-600 font-medium">
                                {totalRows} registros
                            </span>
                        )}
                    </div>
                </div>

                {/* Table — horizontal scroll on mobile */}
                <div className="overflow-auto custom-scrollbar flex-1 -webkit-overflow-scrolling-touch">
                    <table className="w-full text-left text-sm border-collapse" style={{ minWidth: minWidth || (compact ? '500px' : '600px') }}>
                        <thead className="bg-white/5 text-slate-400 uppercase text-[11px] font-black tracking-widest border-y border-white/5 sticky top-0 z-20 backdrop-blur-md">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`${compact ? 'px-3 py-3' : 'px-4 md:px-6 py-4'} cursor-pointer hover:bg-white/5 hover:text-white transition-all select-none ${col.width ? col.width : ''}`}
                                        onClick={() => onSort(col.key)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort(col.key)}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="truncate">{col.label}</span>
                                            {sortColumn === col.key && (
                                                <m.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="shrink-0">
                                                    {sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-blue-400" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-400" />}
                                                </m.div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                                            <span className="text-slate-500 font-medium">Procesando datos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center text-slate-500 italic font-medium">
                                        No se encontraron registros coincidentes.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, rowIndex) => (
                                    <DataTableRow
                                        key={row[rowKey] || rowIndex}
                                        row={row}
                                        rowIndex={rowIndex}
                                        columns={columns}
                                        compact={compact}
                                        renderExpandedRow={renderExpandedRow}
                                        isExpanded={expandedRow === (row[rowKey] !== undefined ? row[rowKey] : rowIndex)}
                                        toggleRow={toggleRow}
                                        rowKey={rowKey}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalRows > itemsPerPage && (
                    <div className="p-3 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white/5 border-t border-white/5 shrink-0">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest order-2 sm:order-1">
                            <span className="text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="text-slate-200">{Math.min(currentPage * itemsPerPage, totalRows)}</span>
                            <span className="hidden sm:inline"> de <span className="text-slate-200">{totalRows}</span></span>
                        </span>

                        <div className="flex items-center gap-1.5 order-1 sm:order-2">
                            <button type="button"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                aria-label="Página anterior"
                                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    // Mostrar solo algunas páginas si hay muchas
                                    if (
                                        totalPages <= 5 ||
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button type="button"
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`min-w-[32px] min-h-[32px] rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        (page === 2 && currentPage > 3) ||
                                        (page === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return <span key={page} className="text-slate-700 px-1 text-xs">…</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button type="button"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                aria-label="Página siguiente"
                                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </LazyMotion>
    )
}

export default DataTable
