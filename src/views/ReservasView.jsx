import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useReservas, useReservasDetalles, useMovimientosDinero, useMovimientosStock } from '../hooks/useData'
import { Loader2, Edit2, Check, X, Search, Calendar, User, Package, CreditCard, ChevronRight, Trash2 } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import ProductAutocomplete from '../components/ProductAutocomplete'
import ClientAutocomplete from '../components/ClientAutocomplete'
import { toast } from 'react-hot-toast'

import { ReservasExpandedRow as ExpandedRow } from '../components/reservas/ReservasExpandedRow'

const ReservasView = () => {
    const [sortColumn, setSortColumn] = useState('fecha_creacion')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [filterColumn, setFilterColumn] = useState('cliente')
    const [showOpenOnly, setShowOpenOnly] = useState(true)
    const [page, setPage] = useState(1)
    const pageSize = 20

    const options = React.useMemo(() => ({
        sortColumn,
        sortOrder,
        filterColumn,
        filterValue,
        page,
        pageSize
    }), [sortColumn, sortOrder, filterColumn, filterValue, page, pageSize])

    const { data, count, loading } = useReservas(options, showOpenOnly)

    const searchColumns = useMemo(() => [
        { key: 'cliente', label: 'Cliente' },
        { key: 'lista_productos', label: 'Producto' },
        { key: 'reserva_id', label: 'ID Reserva' },
        { key: 'estado_pago', label: 'Estado Pago' },
        { key: 'estado_entrega', label: 'Entrega' }
    ], [])

    const columns = useMemo(() => [
        { key: 'reserva_id', label: 'ID', width: 'w-40', render: (val) => <span className="font-bold text-slate-500 truncate block">{val}</span> },
        {
            key: 'fecha_creacion', label: 'Fecha', width: 'w-44', render: (val) => {
                if (!val) return ''
                const date = new Date(val)
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-300">{date.toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs</span>
                    </div>
                )
            }
        },
        {
            key: 'cliente',
            label: 'Cliente',
            width: 'w-1/4',
            wrap: true,
            render: (val, row) => {
                const name = val || row.Cliente || 'N/A'
                return (
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                            <User className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="font-bold text-slate-200 truncate" title={name}>{name}</span>
                    </div>
                )
            }
        },
        { key: 'total_reserva', label: 'Total', width: 'w-24', render: (val) => <span className="font-black text-slate-400 tabular-nums">${val?.toLocaleString() || '0'}</span> },
        { key: 'total_pagado', label: 'Pagado', width: 'w-24', render: (val) => <span className="font-black text-emerald-400 tabular-nums">${val?.toLocaleString() || '0'}</span> },
        { key: 'saldo_pendiente', label: 'Saldo', width: 'w-24', render: (val) => <span className={`font-black tabular-nums ${val > 0 ? 'text-rose-400' : 'text-slate-500'}`}>${val?.toLocaleString() || '0'}</span> },
        {
            key: 'estado_pago', label: 'Status', width: 'w-28', render: (val) => (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${val === 'Pagado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                    {val}
                </span>
            )
        },
        {
            key: 'estado_entrega', label: 'Entrega', width: 'w-28', render: (val) => (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${val === 'Entregado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}>
                    {val}
                </span>
            )
        },
    ], [])

    const handleSort = (column) => {
        setPage(1)
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    const handleFilter = (val) => {
        setFilterValue(val)
        setPage(1)
    }

    const renderSearchInput = (value, onChange) => {
        if (filterColumn === 'lista_productos') {
            return (
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 z-10" />
                    <ProductAutocomplete
                        value={value}
                        onChange={onChange}
                        className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200"
                    />
                </div>
            )
        }
        if (filterColumn === 'cliente') {
            return (
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 z-10" />
                    <ClientAutocomplete
                        value={value}
                        onChange={onChange}
                        className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200"
                    />
                </div>
            )
        }
        return (
            <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
                <input
                    type="text"
                    placeholder={`Buscar por ${searchColumns.find(c => c.key === filterColumn)?.label.toLowerCase()}...`}
                    className="pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder-slate-500 w-full outline-none transition-all"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Calendar className="h-8 w-8 md:h-10 md:w-10 text-blue-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Reservas
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">Control de pedidos pendientes y señas.</p>
                </div>

                <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-white/5 w-full md:w-auto justify-center md:justify-start">
                    <button type="button"
                        onClick={() => { setShowOpenOnly(true); setPage(1); }}
                        className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[38px] ${showOpenOnly ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Abiertas
                    </button>
                    <button type="button"
                        onClick={() => { setShowOpenOnly(false); setPage(1); }}
                        className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[38px] ${!showOpenOnly ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Todas
                    </button>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={handleFilter}
                searchColumns={searchColumns}
                searchColumn={filterColumn}
                onSearchColumnChange={(col) => { setFilterColumn(col); setPage(1); }}
                renderSearchInput={renderSearchInput}
                renderExpandedRow={(row) => <ExpandedRow row={row} />}
                rowKey="reserva_id"
                serverSide={true}
                totalCount={count}
                currentPage={page}
                onPageChange={setPage}
                itemsPerPage={pageSize}
                minWidth="1000px"
            />
        </div>
    )
}

export default ReservasView
