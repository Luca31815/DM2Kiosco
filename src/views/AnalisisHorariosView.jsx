import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useAnalisisHorarios, useHitosViewData } from '../hooks/useData'
import { Clock, Trophy } from 'lucide-react'

const AnalisisHorariosView = () => {
    const [viewType, setViewType] = useState('diario')
    const [analysisMode, setAnalysisMode] = useState('horarios') // 'horarios' | 'hitos'

    // DataTable states
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    // Hooks
    const { data: horariosData, loading: loadingHorarios } = useAnalisisHorarios(viewType, {
        sortColumn, // Note: The API might expect different sort columns based on viewType
        sortOrder,
        filterColumn: ['diario', 'semanal'].includes(viewType) ? (viewType === 'diario' ? 'fecha' : 'semana_del') : undefined,
        filterValue
    })

    const { data: hitosRawData, loading: loadingHitos } = useHitosViewData()

    // Derived state for Horarios
    const processedHorariosData = useMemo(() => {
        if (analysisMode !== 'horarios' || !horariosData) return []

        return horariosData.map(row => {
            const total = (Number(row.ventas_madrugada) || 0) +
                (Number(row.ventas_manana) || 0) +
                (Number(row.ventas_tarde) || 0) +
                (Number(row.ventas_noche) || 0)
            return {
                ...row,
                total_ventas: total
            }
        })
    }, [horariosData, analysisMode])

    // Derived state for Hitos
    const { processedHitosData, minHour, maxHour } = useMemo(() => {
        if (analysisMode !== 'hitos' || !hitosRawData) return { processedHitosData: [], minHour: 0, maxHour: 24 }

        const { hitos, dailyReports, allSales } = hitosRawData

        // Map daily totals
        const dailyTotalsMap = dailyReports.reduce((acc, curr) => {
            if (!curr.fecha) return acc
            const dateKey = curr.fecha.split('T')[0]
            acc[dateKey] = curr.cant_ventas
            return acc
        }, {})

        // Calculate Last Sale Time per day
        const dailyLastSaleMap = allSales.reduce((acc, curr) => {
            if (!curr.fecha) return acc
            const dateKey = curr.fecha.substring(0, 10)

            if (!acc[dateKey]) acc[dateKey] = curr.fecha
            else {
                if (curr.fecha > acc[dateKey]) acc[dateKey] = curr.fecha
            }
            return acc
        }, {})

        // Calculate global min/max hours
        let globalMinH = 24
        let globalMaxH = 0
        let hasData = false

        // Combine data
        const grouped = hitos.reduce((acc, curr) => {
            if (!curr.dia) return acc
            const date = curr.dia
            if (!acc[date]) {
                acc[date] = {
                    dia: date,
                    total_ventas: dailyTotalsMap[date] || 0,
                    milestones: [],
                    lastSaleTime: null
                }
            }
            acc[date].milestones.push({
                n: curr.hito_logrado,
                hour: curr.hora_exacta?.substring(0, 5)
            })
            return acc
        }, {})

        // Incorporate daily reports and last sale times
        Object.keys(dailyLastSaleMap).forEach(date => {
            hasData = true
            if (!grouped[date]) {
                grouped[date] = {
                    dia: date,
                    total_ventas: dailyTotalsMap[date] || 0,
                    milestones: [],
                    lastSaleTime: null
                }
            }

            if (dailyLastSaleMap[date]) {
                grouped[date].lastSaleTime = dailyLastSaleMap[date]
                // Extract hour
                let timePart = ''
                if (dailyLastSaleMap[date].includes('T')) {
                    timePart = dailyLastSaleMap[date].split('T')[1]
                } else if (dailyLastSaleMap[date].includes(' ')) {
                    timePart = dailyLastSaleMap[date].split(' ')[1]
                }

                if (timePart) {
                    const h = parseInt(timePart.split(':')[0], 10)
                    if (!isNaN(h)) {
                        if (h < globalMinH) globalMinH = h
                        if (h > globalMaxH) globalMaxH = h
                    }
                }
            }
        })

        if (hasData) {
            hitos.forEach(h => {
                const hour = parseInt(h.hora_exacta?.split(':')[0] || 0)
                if (hour < globalMinH) globalMinH = hour
                if (hour > globalMaxH) globalMaxH = hour
            })
        } else {
            globalMinH = 0
            globalMaxH = 24
        }

        let pivotedData = Object.values(grouped)

        // Client-side Sort
        if (sortColumn) {
            pivotedData.sort((a, b) => {
                let valA = a[sortColumn]
                let valB = b[sortColumn]

                if (sortColumn === 'dia') {
                    valA = new Date(valA)
                    valB = new Date(valB)
                } else if (sortColumn === 'total_ventas') {
                    valA = parseFloat(valA || 0)
                    valB = parseFloat(valB || 0)
                }
                if (sortColumn === 'timeline' && a.lastSaleTime && b.lastSaleTime) {
                    valA = a.lastSaleTime
                    valB = b.lastSaleTime
                }

                if (!valA && !valB) return 0
                if (!valA) return 1
                if (!valB) return -1

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1
                return 0
            })
        } else {
            pivotedData.sort((a, b) => (new Date(a.dia) > new Date(b.dia) ? -1 : 1))
        }

        return {
            processedHitosData: pivotedData,
            minHour: Math.max(0, globalMinH - 1),
            maxHour: Math.min(24, globalMaxH + 1)
        }

    }, [hitosRawData, analysisMode, sortColumn, sortOrder])

    const currentData = analysisMode === 'horarios' ? processedHorariosData : processedHitosData
    const loading = analysisMode === 'horarios' ? loadingHorarios : loadingHitos

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('desc')
        }
    }

    const getColumns = () => {
        if (analysisMode === 'hitos') {
            return [
                {
                    key: 'dia',
                    label: 'Fecha',
                    render: (val) => {
                        if (!val) return ''
                        const [y, m, d] = val.split('-')
                        return `${d}/${m}/${y}`
                    }
                },
                {
                    key: 'timeline',
                    label: `Línea de Tiempo (${minHour}:00 - ${maxHour}:00)`,
                    render: (_, row) => {
                        const startH = minHour
                        const totalH = maxHour - minHour || 24
                        const getPos = (timeStr) => {
                            if (!timeStr) return -1
                            let h, m
                            try {
                                if (typeof timeStr === 'string') {
                                    const part = timeStr.includes('T') ? timeStr.split('T')[1] : (timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr)
                                    if (!part || !part.includes(':')) return -1
                                    const [hStr, mStr] = part.split(':')
                                    h = parseInt(hStr, 10)
                                    m = parseInt(mStr, 10)
                                } else if (timeStr instanceof Date) {
                                    h = timeStr.getHours()
                                    m = timeStr.getMinutes()
                                } else {
                                    return -1
                                }
                            } catch (e) {
                                return -1
                            }
                            if (isNaN(h) || isNaN(m)) return -1
                            const val = h + m / 60
                            return ((val - startH) / totalH) * 100
                        }

                        const lastPos = row.lastSaleTime ? getPos(row.lastSaleTime) : -1

                        return (
                            <div className="relative w-full h-16 bg-gray-800/20 rounded-lg border border-gray-700/50 overflow-hidden text-xs">
                                {Array.from({ length: totalH + 1 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-0 bottom-0 border-r border-gray-700/20 text-[9px] text-gray-600 pt-1"
                                        style={{ left: `${(i / totalH) * 100}%` }}
                                    >
                                        <span className="ml-1">{startH + i}h</span>
                                    </div>
                                ))}

                                {row.milestones?.map(m => {
                                    const mPos = getPos(m.hour)
                                    if (mPos < 0 || mPos > 100) return null
                                    return (
                                        <div
                                            key={m.n}
                                            className="absolute top-5 bottom-0 flex flex-col items-center group z-10"
                                            style={{ left: `${mPos}%` }}
                                        >
                                            <div className="w-px h-full bg-yellow-500/50 group-hover:bg-yellow-400"></div>
                                            <div className="absolute top-[-10px] bg-gray-900 border border-yellow-500/30 text-[9px] text-yellow-500 px-1 rounded transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                #{m.n} ({m.hour})
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-[-2px]"></div>
                                        </div>
                                    )
                                })}

                                {lastPos >= 0 && lastPos <= 100 && (
                                    <div
                                        className="absolute top-2 bottom-0 flex flex-col items-center group z-20"
                                        style={{ left: `${lastPos}%` }}
                                    >
                                        <div className="w-px h-full bg-blue-500 group-hover:bg-blue-400"></div>
                                        <div className="absolute top-0 bg-blue-900/80 border border-blue-500/50 text-[10px] text-blue-200 px-1 py-0.5 rounded transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                            Total: {row.total_ventas}
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                )}
                            </div>
                        )
                    }
                },
                { key: 'total_ventas', label: 'Total', render: (val) => <span className="font-bold text-blue-400">{val}</span> },
            ]
        }

        const commonColumns = [
            { key: 'ventas_manana', label: 'Mañana (06-13)', render: (val) => val || 0 },
            { key: 'ventas_tarde', label: 'Tarde (13-19)', render: (val) => val || 0 },
            { key: 'ventas_noche', label: 'Noche (19-00)', render: (val) => val || 0 },
            { key: 'total_ventas', label: 'Total', render: (val) => <span className="font-bold text-blue-400">{val || 0}</span> },
        ]

        if (viewType === 'diario') {
            return [
                {
                    key: 'fecha', label: 'Fecha', render: (val) => {
                        if (!val) return ''
                        if (typeof val === 'string' && val.includes('-')) {
                            const [y, m, d] = val.split('T')[0].split('-')
                            return `${d}/${m}/${y}`
                        }
                        return new Date(val).toLocaleDateString()
                    }
                },
                ...commonColumns
            ]
        }
        if (viewType === 'semanal') {
            return [
                {
                    key: 'semana_del', label: 'Semana Del', render: (val) => {
                        if (!val) return ''
                        if (typeof val === 'string' && val.includes('-')) {
                            const [y, m, d] = val.split('T')[0].split('-')
                            return `${d}/${m}/${y}`
                        }
                        return new Date(val).toLocaleDateString()
                    }
                },
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
                    {analysisMode === 'horarios' ? <Clock className="h-8 w-8 text-purple-500" /> : <Trophy className="h-8 w-8 text-yellow-500" />}
                    {analysisMode === 'horarios' ? 'Análisis Horarios' : 'Hitos de Ventas'}
                </h2>

                <div className="flex items-center gap-4">
                    {/* Mode Toggle */}
                    <div className="flex bg-gray-800 rounded-md p-1 border border-gray-700">
                        <button
                            onClick={() => setAnalysisMode('horarios')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${analysisMode === 'horarios' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            Horarios
                        </button>
                        <button
                            onClick={() => setAnalysisMode('hitos')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${analysisMode === 'hitos' ? 'bg-yellow-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            Hitos
                        </button>
                    </div>

                    {/* Period Selector (Only for Horarios) */}
                    {analysisMode === 'horarios' && (
                        <div className="flex bg-gray-800 rounded-md p-1 border border-gray-700">
                            {['diario', 'semanal', 'mensual'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setViewType(type)}
                                    className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-colors ${viewType === type ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <DataTable
                data={currentData}
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
