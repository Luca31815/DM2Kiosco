import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react'

const DataTable = ({
    data,
    columns,
    isLoading,
    onSort,
    sortColumn,
    sortOrder,
    onFilter,
    renderExpandedRow,
    rowKey = 'id'
}) => {
    const [filterValue, setFilterValue] = useState('')
    const [expandedRow, setExpandedRow] = useState(null)

    const handleFilterChange = (e) => {
        const value = e.target.value
        setFilterValue(value)
        onFilter(value)
    }

    const toggleRow = (id) => {
        if (renderExpandedRow) {
            setExpandedRow(expandedRow === id ? null : id)
        }
    }

    return (
        <div className="w-full bg-gray-900 text-gray-200 rounded-lg shadow-lg border border-gray-800 overflow-hidden">
            {/* Header / Filter */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Filter..."
                        className="pl-10 pr-4 py-2 bg-gray-800 border-none rounded-md text-sm focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder-gray-500 w-64 transition-all duration-200"
                        value={filterValue}
                        onChange={handleFilterChange}
                    />
                </div>
                {isLoading && <Loader2 className="animate-spin h-5 w-5 text-blue-500" />}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-800 text-gray-400 uppercase font-medium">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-6 py-3 cursor-pointer hover:text-white transition-colors select-none"
                                    onClick={() => onSort(col.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        {sortColumn === col.key && (
                                            sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                    Loading data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <React.Fragment key={row[rowKey] || rowIndex}>
                                    <tr
                                        key={row[rowKey] || rowIndex}
                                        onClick={() => toggleRow(row[rowKey])}
                                        className={`hover:bg-gray-800/50 transition-colors group ${renderExpandedRow ? 'cursor-pointer' : ''} ${expandedRow === row[rowKey] ? 'bg-gray-800/50' : ''}`}
                                    >
                                        {columns.map((col) => (
                                            <td key={`${rowIndex}-${col.key}`} className="px-6 py-4 whitespace-nowrap text-gray-300 group-hover:text-white transition-colors">
                                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                    {renderExpandedRow && (
                                        <tr key={`${rowIndex}-expanded`} className="bg-gray-800/30">
                                            <td colSpan={columns.length} className="px-6 py-0">
                                                <div className={`grid transition-all duration-300 ${expandedRow === row[rowKey] ? 'grid-rows-[1fr] py-4' : 'grid-rows-[0fr] py-0'
                                                    }`}>
                                                    <div className="overflow-hidden">
                                                        {expandedRow === row[rowKey] && renderExpandedRow(row)}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DataTable
