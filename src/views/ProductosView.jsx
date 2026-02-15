import React, { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import { getProductos } from '../services/api'

const ProductosView = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortColumn, setSortColumn] = useState('nombre')
    const [sortOrder, setSortOrder] = useState('asc')
    const [filterValue, setFilterValue] = useState('')

    const columns = [
        { key: 'nombre', label: 'Producto' },
        {
            key: 'stock_actual', label: 'Stock', render: (val) => (
                <span className={`font-medium ${val < 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {val}
                </span>
            )
        },
        { key: 'ultimo_precio_venta', label: 'Precio', render: (val) => `$${val}` },
        { key: 'fecha_actualizacion', label: 'Actualizado', render: (val) => new Date(val).toLocaleDateString() },
    ]

    useEffect(() => {
        fetchData()
        // Auto-refresh every minute
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [sortColumn, sortOrder, filterValue])

    const fetchData = async () => {
        // Only set loading on first load to avoid flickering on auto-refresh
        if (data.length === 0) setLoading(true)
        try {
            const { data } = await getProductos({
                sortColumn,
                sortOrder,
                filterColumn: 'nombre',
                filterValue
            })
            setData(data || [])
        } catch (error) {
            console.error('Error fetching productos:', error)
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

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">Productos</h2>
            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={setFilterValue}
            />
        </div>
    )
}

export default ProductosView
