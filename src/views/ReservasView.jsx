import React, { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import { getReservas, getReservasAbiertas, getReservasDetalles } from '../services/api'
import { Loader2 } from 'lucide-react'

const ReservasView = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortColumn, setSortColumn] = useState('fecha_creacion')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [showOpenOnly, setShowOpenOnly] = useState(true)

    const columns = [
        { key: 'reserva_id', label: 'ID' },
        { key: 'fecha_creacion', label: 'Fecha', render: (val) => new Date(val).toLocaleString() },
        {
            key: 'cliente',
            label: 'Cliente',
            render: (val, row) => val || row.Cliente // Handle both casing possibilities
        },
        { key: 'total_reserva', label: 'Total', render: (val) => `$${val}` },
        { key: 'total_pagado', label: 'Pagado', render: (val) => `$${val || 0}` }, // Added missing column
        { key: 'saldo_pendiente', label: 'Saldo', render: (val) => `$${val}` },
        {
            key: 'estado_pago', label: 'Estado Pago', render: (val) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'Pagado' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                    {val}
                </span>
            )
        },
        { key: 'estado_entrega', label: 'Entrega' },
    ]

    useEffect(() => {
        fetchData()
    }, [sortColumn, sortOrder, filterValue, showOpenOnly])

    const fetchData = async () => {
        setLoading(true)
        try {
            const fetchFunction = showOpenOnly ? getReservasAbiertas : getReservas
            const { data } = await fetchFunction({
                sortColumn,
                sortOrder,
                filterColumn: 'cliente', // Note: Check case sensitivity in actual DB
                filterValue
            })
            setData(data || [])
        } catch (error) {
            console.error('Error fetching reservas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    const ExpandedRow = ({ row }) => {
        const [details, setDetails] = useState([])
        const [loadingDetails, setLoadingDetails] = useState(true)

        useEffect(() => {
            const loadDetails = async () => {
                try {
                    const data = await getReservasDetalles(row.reserva_id)
                    setDetails(data || [])
                } catch (error) {
                    console.error("Error loading details", error)
                } finally {
                    setLoadingDetails(false)
                }
            }
            loadDetails()
        }, [row.reserva_id])

        if (loadingDetails) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

        return (
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mx-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Detalles de Reserva</h4>
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
                        <tr>
                            <th className="px-4 py-2">Producto</th>
                            <th className="px-4 py-2 text-right">Cantidad</th>
                            <th className="px-4 py-2 text-right">Precio Unitario</th>
                            <th className="px-4 py-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {details.map((detail) => (
                            <tr key={detail.id}>
                                <td className="px-4 py-2">{detail.producto}</td>
                                <td className="px-4 py-2 text-right">{detail.cantidad}</td>
                                <td className="px-4 py-2 text-right">${detail.precio_unitario}</td>
                                <td className="px-4 py-2 text-right">${detail.subtotal}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Reservas</h2>
                <div className="flex gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                    <button
                        onClick={() => setShowOpenOnly(true)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${showOpenOnly ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Abiertas
                    </button>
                    <button
                        onClick={() => setShowOpenOnly(false)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!showOpenOnly ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
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
                onFilter={setFilterValue}
                renderExpandedRow={(row) => <ExpandedRow row={row} />}
                rowKey="reserva_id"
            />
        </div>
    )
}

export default ReservasView
