import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useProductos } from '../hooks/useData'

const ProductosView = () => {
    const [sortColumn, setSortColumn] = useState('nombre')
    const [sortOrder, setSortOrder] = useState('asc')
    const [filterValue, setFilterValue] = useState('')

    const { data, loading } = useProductos({
        sortColumn,
        sortOrder,
        filterColumn: 'nombre',
        filterValue
    })

    const columns = [
        { key: 'nombre', label: 'Producto' },
        { key: 'ultimo_precio_venta', label: 'Precio Venta', render: (val) => `$${val}` },
        { key: 'ultimo_costo_compra', label: 'Precio Compra', render: (val) => `$${val}` },
        {
            key: 'stock_actual', label: 'Stock', render: (val) => (
                <span className={`font-medium ${val < 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {val}
                </span>
            )
        },
        { key: 'fecha_actualizacion', label: 'Actualización', render: (val) => new Date(val).toLocaleDateString() },
    ]

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
