import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useAnalisisHorarios, useHitosViewData } from '../hooks/useData'
import { Clock, Trophy } from 'lucide-react'

const AnalisisHorariosView = () => {
    const [viewType, setViewType] = useState('diario')
    const [analysisMode, setAnalysisMode] = useState('horarios') // 'horarios' | 'hitos'
    const [page, setPage] = useState(1)

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

    const { data: hitosRawData, loading: loadingHitos } = useHitosViewData(page)

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
        if (analysisMode !== 'hitos' || !hitosRawData) return { processedHitosData: [], minHour: 8, maxHour: 24 }

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
        let globalMinH = 8 // Forced start at 08:00
        let globalMaxH = 21 // Minimum end at 21:00
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
                if (hour > globalMaxH) globalMaxH = hour
            })
            // Extra check for last sales
            Object.values(grouped).forEach(g => {
                if (g.lastSaleTime) {
                    const h = parseInt(g.lastSaleTime.includes('T') ? g.lastSaleTime.split('T')[1].split(':')[0] : g.lastSaleTime.split(' ')[1].split(':')[0])
                    if (h > globalMaxH) globalMaxH = h
                }
            })
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
            minHour: 8,
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
                        const isToday = val === new Date().toISOString().split('T')[0]
                        const isYesterday = val === new Date(Date.now() - 86400000).toISOString().split('T')[0]

                        return (
                            <div className="flex items-center gap-2">
                                <span>{`${d}/${m}/${y}`}</span>
                                {isToday && <span className="bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">HOY</span>}
                                {isYesterday && <span className="bg-gray-700 text-gray-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-600/30">AYER</span>}
                            </div>
                        )
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
                            <div className="relative w-full h-16 bg-gray-900/40 rounded-lg border border-gray-800 overflow-hidden text-xs">
                                {Array.from({ length: totalH + 1 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-0 bottom-0 border-r border-gray-800/50 text-[9px] text-gray-700 pt-1"
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
                                            className="absolute top-4 bottom-0 flex flex-col items-center group z-10"
                                            style={{ left: `${mPos}%` }}
                                        >
                                            <div className="w-px h-full bg-yellow-500/30 group-hover:bg-yellow-500/60 transition-colors"></div>
                                            {/* Flag Banderín */}
                                            <div className="absolute top-[-14px] flex flex-col items-center">
                                                <div className="bg-yellow-500 text-gray-900 text-[10px] font-black px-1.5 py-0.5 rounded-sm shadow-[0_0_10px_rgba(234,179,8,0.3)] transform -translate-x-1/2 flex items-center gap-1">
                                                    <Trophy className="h-2 w-2" />
                                                    {m.n}
                                                </div>
                                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-yellow-500 transform -translate-x-1/2"></div>
                                            </div>

                                            {/* Tooltip on hover */}
                                            <div className="absolute bottom-full mb-4 bg-gray-900 border border-yellow-500/30 text-[10px] text-yellow-500 px-2 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none transform -translate-x-1/2">
                                                Hito #{m.n} logreado a las {m.hour}hs
                                            </div>
                                        </div>
                                    )
                                })}

                                {lastPos >= 0 && lastPos <= 100 && (
                                    <div
                                        className="absolute top-0 bottom-0 flex flex-col items-center group z-20"
                                        style={{ left: `${lastPos}%` }}
                                    >
                                        <div className="w-px h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                        {/* Ribbon for Total */}
                                        <div className="absolute top-6 bg-blue-600/90 border border-blue-400/50 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-lg transform -translate-x-1/2 backdrop-blur-sm">
                                            Ventas: {row.total_ventas}
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-blue-600 mt-[-1.25px] shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
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

                    {/* Pagination for Hitos */}
                    {analysisMode === 'hitos' && (
                        <div className="flex bg-gray-800 rounded-md p-1 border border-gray-700 gap-1">
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                            >
                                &lt; Periodo Anterior
                            </button>
                            <div className="px-2 py-1.5 text-xs font-bold text-yellow-500 bg-gray-900/50 rounded border border-gray-700">
                                14 Días
                            </div>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                            >
                                Siguiente &gt;
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Summary for Hitos */}
            {analysisMode === 'hitos' && hitosRawData?.hitos?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[10, 20, 30, 40].map(n => {
                        // Calculate average for this milestone across all days
                        let sumMinutes = 0
                        let count = 0

                        hitosRawData.hitos.forEach(h => {
                            if (h.hito_logrado === n && h.hora_exacta) {
                                const [hStr, mStr] = h.hora_exacta.split(':')
                                // Assuming typical opening at 08:00
                                const minutesSinceOpening = (parseInt(hStr, 10) * 60 + parseInt(mStr, 10)) - (8 * 60)
                                if (minutesSinceOpening > 0) {
                                    sumMinutes += minutesSinceOpening
                                    count++
                                }
                            }
                        })

                        const avgMinutes = count > 0 ? (sumMinutes / count) : 0
                        const avgH = Math.floor(avgMinutes / 60)
                        const avgM = Math.round(avgMinutes % 60)

                        // Format for display (8am + avg offset)
                        let displayH = 8 + avgH
                        let displayM = avgM
                        if (displayM >= 60) {
                            displayH += 1
                            displayM -= 60
                        }

                        const avgTime = count > 0 ? `${displayH.toString().padStart(2, '0')}:${displayM.toString().padStart(2, '0')}` : '--:--'

                        return (
                            <div key={n} className="bg-gray-700/30 border border-gray-700 p-4 rounded-xl flex flex-col items-center">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Hito {n} Ventas</span>
                                <span className="text-2xl font-black text-yellow-500 mt-1">{avgTime} <span className="text-xs font-normal text-gray-400">hs</span></span>
                                <span className="text-[10px] text-gray-500 mt-1 italic italic">Promedio histórico ({count} días)</span>
                            </div>
                        )
                    })}
                </div>
            )}

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
