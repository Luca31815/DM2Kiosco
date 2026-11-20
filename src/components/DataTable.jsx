import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Search, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react'

const EMPTY_ARRAY = []

const getRowId = (row, idx, rowKey) => {
    const keyVal = typeof rowKey === 'function' ? rowKey(row) : row?.[rowKey]
    return keyVal !== undefined && keyVal !== null ? keyVal : idx
}

function renderCellContent(col, row) {
    try {
        if (col.render) return col.render(row[col.key], row)
        const val = row[col.key]
        return val !== undefined && val !== null && val !== '' ? val : '-'
    } catch (err) {
        console.error(`Error rendering column ${col.key}:`, err)
        return <span className="text-red-500/50 text-[10px] italic">Error</span>
    }
}

function getVisiblePages(currentPage, totalPages) {
    if (totalPages <= 5) {
        const pages = []
        for (let p = 1; p <= totalPages; p++) pages.push(p)
        return pages
    }

    const pages = [1]
    if (currentPage > 3) {
        pages.push('ellipsis-start')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let p = start; p <= end; p++) {
        pages.push(p)
    }

    if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end')
    }
    pages.push(totalPages)
    return pages
}

const DataTableRow = memo(({ row, rowId, columns, compact, renderExpandedRow, isExpanded, toggleRow }) => {
    return (
        <React.Fragment>
            <tr
                onClick={(e) => {
                    if (!renderExpandedRow) return
                    if (e.target.closest('button, input, textarea, select, label, [role="button"]:not(tr)')) {
                        return
                    }
                    toggleRow(rowId)
                }}
                role={renderExpandedRow ? 'button' : undefined}
                tabIndex={renderExpandedRow ? 0 : undefined}
                onKeyDown={(e) => {
                    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'LABEL'].includes(e.target.tagName)) {
                        return
                    }
                    if (renderExpandedRow && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        toggleRow(rowId)
                    }
                }}
                className={`hover:bg-white/10 transition-colors duration-75 group ${renderExpandedRow ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-white/10' : ''}`}
            >
                {columns.map((col) => (
                    <td
                        key={col.key}
                        className={`text-slate-300 group-hover:text-white transition-colors font-medium ${compact ? 'px-3 py-2 text-[11px]' : 'px-4 md:px-6 py-3'} ${col.wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'}`}
                    >
                        {renderCellContent(col, row)}
                    </td>
                ))}
            </tr>
            {renderExpandedRow && isExpanded && (
                <tr className="bg-blue-600/5 animate-fade-in">
                    <td colSpan={columns.length} className="px-2 md:px-6 py-4 border-l-2 border-blue-500 shadow-inner overflow-hidden">
                        {renderExpandedRow(row)}
                    </td>
                </tr>
            )}
        </React.Fragment>
    )
})
DataTableRow.displayName = 'DataTableRow'

const DataTable = memo(({
    data = EMPTY_ARRAY,
    columns = EMPTY_ARRAY,
    isLoading,
    onSort,
    sortColumn,
    sortOrder,
    onFilter,
    renderExpandedRow,
    rowKey = 'id',
    compact = false,
    searchColumns = EMPTY_ARRAY,
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

    const debounceTimerRef = useRef(null)
    const onFilterRef = useRef(onFilter)

    useEffect(() => {
        onFilterRef.current = onFilter
    }, [onFilter])

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (!serverSide) {
            setInternalPage(1)
        }
    }, [data.length, serverSide])

    const totalRows = serverSide ? totalCount : data.length
    const totalPages = Math.ceil(totalRows / itemsPerPage)
    const safeTotalPages = Math.max(1, totalPages)
    const rawCurrentPage = serverSide ? externalPage : internalPage
    const effectivePage = Math.min(Math.max(1, rawCurrentPage || 1), safeTotalPages)

    const goToPage = useCallback((nextPage) => {
        if (serverSide) {
            if (typeof onPageChange === 'function') {
                onPageChange(nextPage)
            }
        } else {
            setInternalPage(nextPage)
        }
    }, [serverSide, onPageChange])

    const paginatedData = useMemo(() => {
        if (serverSide) return data
        const start = (effectivePage - 1) * itemsPerPage
        return data.slice(start, start + itemsPerPage)
    }, [serverSide, data, effectivePage, itemsPerPage])

    const visiblePages = useMemo(
        () => getVisiblePages(effectivePage, totalPages),
        [effectivePage, totalPages]
    )

    const handleFilterChange = useCallback((val) => {
        setFilterValue(val)
        if (!serverSide) {
            setInternalPage(1)
        }
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = null
        }
        if (typeof onFilterRef.current !== 'function') return
        if (val === '') {
            onFilterRef.current('')
            return
        }
        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null
            if (typeof onFilterRef.current === 'function') {
                onFilterRef.current(val)
            }
        }, 250)
    }, [serverSide])

    const toggleRow = useCallback((id) => {
        if (renderExpandedRow) {
            setExpandedRow(prev => prev === id ? null : id)
        }
    }, [renderExpandedRow])

    const exportToCSV = useCallback(() => {
        if (!data || data.length === 0) return

        const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
        const headers = columns.map(col => escapeCell(col.label)).join(',')
        const rows = data.map(row =>
            columns.map(col => escapeCell(row[col.key])).join(',')
        ).join('\n')

        const csvContent = `\uFEFF${headers}\n${rows}`
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `export_${Date.now()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, [data, columns])

    return (
        <div className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '300px' }}>
            {/* Header / Filter */}
            <div className="p-4 md:p-6 flex flex-col gap-3 bg-white/5 shrink-0">
                {/* Row 1: Search filter controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {searchColumns && searchColumns.length > 0 && (
                        <select
                            value={searchColumn}
                            onChange={(e) => typeof onSearchColumnChange === 'function' && onSearchColumnChange(e.target.value)}
                            aria-label="Seleccionar columna de búsqueda"
                            className="bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-300 py-2.5 pl-4 pr-10 cursor-pointer backdrop-blur-md outline-none transition-colors w-full sm:w-auto shrink-0"
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
                                    className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full outline-none transition-colors"
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
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors active:scale-95"
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
                    <thead className="bg-slate-900/95 text-slate-400 uppercase text-[11px] font-black tracking-widest border-y border-white/5 sticky top-0 z-20">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`${compact ? 'px-3 py-3' : 'px-4 md:px-6 py-4'} cursor-pointer hover:bg-white/5 hover:text-white transition-colors select-none ${col.width ? col.width : ''}`}
                                    onClick={() => typeof onSort === 'function' && onSort(col.key)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && typeof onSort === 'function' && onSort(col.key)}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate">{col.label}</span>
                                        {sortColumn === col.key && (
                                            <div className="shrink-0 animate-fade-in">
                                                {sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-blue-400" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-400" />}
                                            </div>
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
                            paginatedData.map((row, rowIndex) => {
                                const id = getRowId(row, rowIndex, rowKey)
                                return (
                                    <DataTableRow
                                        key={id}
                                        row={row}
                                        rowId={id}
                                        columns={columns}
                                        compact={compact}
                                        renderExpandedRow={renderExpandedRow}
                                        isExpanded={expandedRow === id}
                                        toggleRow={toggleRow}
                                    />
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalRows > itemsPerPage && (
                <div className="p-3 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white/5 border-t border-white/5 shrink-0">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest order-2 sm:order-1">
                        <span className="text-slate-200">{(effectivePage - 1) * itemsPerPage + 1}</span>–<span className="text-slate-200">{Math.min(effectivePage * itemsPerPage, totalRows)}</span>
                        <span className="hidden sm:inline"> de <span className="text-slate-200">{totalRows}</span></span>
                    </span>

                    <div className="flex items-center gap-1.5 order-1 sm:order-2">
                        <button type="button"
                            onClick={() => goToPage(Math.max(1, effectivePage - 1))}
                            disabled={effectivePage === 1}
                            aria-label="Página anterior"
                            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1">
                            {visiblePages.map((item) => {
                                if (typeof item === 'string') {
                                    return <span key={item} className="text-slate-700 px-1 text-xs">…</span>
                                }
                                return (
                                    <button type="button"
                                        key={item}
                                        onClick={() => goToPage(item)}
                                        className={`min-w-[32px] min-h-[32px] rounded-lg text-xs font-black transition-colors ${effectivePage === item ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                                    >
                                        {item}
                                    </button>
                                )
                            })}
                        </div>

                        <button type="button"
                            onClick={() => goToPage(Math.min(totalPages, effectivePage + 1))}
                            disabled={effectivePage === totalPages}
                            aria-label="Página siguiente"
                            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
})
DataTable.displayName = 'DataTable'

export default DataTable
