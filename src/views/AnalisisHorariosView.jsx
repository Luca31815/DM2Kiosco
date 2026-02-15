import React, { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import { getAnalisisHorarioDiario, getAnalisisHorarioSemanal, getAnalisisHorarioMensual } from '../services/api'
import { Clock } from 'lucide-react'

const AnalisisHorariosView = () => {
    const [viewType, setViewType] = useState('diario')
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    // DataTable states - minimal sorting for these views as they are aggregated
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')


    useEffect(() => {
        // Reset sort when type changes
        if (viewType === 'diario') setSortColumn('fecha')
        if (viewType === 'semanal') setSortColumn('semana_del')
        if (viewType === 'mensual') setSortColumn('anio')

        setData([])
        setLoading(true)
    }, [viewType])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [viewType, sortColumn, sortOrder, filterValue])

    const fetchData = async () => {
        try {
            let fetchFunc = getAnalisisHorarioDiario

            if (viewType === 'semanal') fetchFunc = getAnalisisHorarioSemanal
            if (viewType === 'mensual') fetchFunc = getAnalisisHorarioMensual

            const { data } = await fetchFunc({
                sortColumn,
                sortOrder,
                // Simple client-side filtering support if the API supports it genericly, 
                // or we rely on 'fecha' text filtering
                filterColumn: ['diario', 'semanal'].includes(viewType) ? (viewType === 'diario' ? 'fecha' : 'semana_del') : undefined,
                filterValue
            })
            setData(data || [])
        } catch (error) {
            console.error('Error fetching historial horarios:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('desc') // Default to desc for time series usually
        }
    }

    const getColumns = () => {
        const commonColumns = [
            { key: 'ventas_madrugada', label: 'Madrugada (00-06)', render: (val) => val || 0 },
            { key: 'ventas_manana', label: 'Mañana (06-13)', render: (val) => val || 0 },
            { key: 'ventas_tarde', label: 'Tarde (13-19)', render: (val) => val || 0 },
            { key: 'ventas_noche', label: 'Noche (19-00)', render: (val) => val || 0 },
            { key: 'total_ventas', label: 'Total', render: (val) => <span className="font-bold text-blue-400">{val || 0}</span> },
        ]

        if (viewType === 'diario') {
            return [
                { key: 'fecha', label: 'Fecha', render: (val) => new Date(val).toLocaleDateString() },
                ...commonColumns
            ]
        }
        if (viewType === 'semanal') {
            return [
                { key: 'semana_del', label: 'Semana Del', render: (val) => new Date(val).toLocaleDateString() },
                ...commonColumns
            ]
        }
        if (viewType === 'mensual') {
            return [
                { key: 'anio', label: 'Año' },
                { key: 'mes', label: 'Mes' },
                ...commonColumns
            ]
        }
        return commonColumns
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Clock className="h-8 w-8 text-purple-500" />
                    Análisis Horarios
                </h2>

                <div className="flex bg-gray-800 rounded-md p-1 border border-gray-700">
                    {['diario', 'semanal', 'mensual'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setViewType(type)}
                            className={`px-4 py-2 rounded text-sm font-medium capitalize transition-colors ${viewType === type ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <DataTable
                data={data}
                columns={getColumns()}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onFilter={setFilterValue}
            />
        </div>
    )
}

export default AnalisisHorariosView
