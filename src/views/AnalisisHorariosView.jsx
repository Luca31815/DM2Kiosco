import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useAnalisisHorarios, useHitosViewData } from '../hooks/useData'
import { Clock, Trophy } from 'lucide-react'
import { HitosCardsGrid } from './horarios/HitosCardsGrid'
import { HitosTimelineCell } from './horarios/HitosTimelineCell'
import HeatmapMode from '../components/HeatmapMode'
import { AnalisisHorariosHeader } from './analisis-horarios/AnalisisHorariosHeader'

const AnalisisHorariosView = () => {
    const [viewType, setViewType] = useState('diario')
    const [analysisMode, setAnalysisMode] = useState('horarios') // horarios, hitos, heatmap
    const [page, setPage] = useState(1)

    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')

    const { data: horariosData, loading: loadingHorarios } = useAnalisisHorarios(viewType, {
        sortColumn,
        sortOrder,
        filterColumn: ['diario', 'semanal'].includes(viewType) ? (viewType === 'diario' ? 'fecha' : 'semana_del') : undefined,
        filterValue
    })

    const { data: hitosRawData, loading: loadingHitos } = useHitosViewData(page)

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

    const { processedHitosData, minHour, maxHour } = useMemo(() => {
        if (analysisMode !== 'hitos' || !hitosRawData) return { processedHitosData: [], minHour: 8, maxHour: 24 }

        const { hitos, dailyReports, allSales } = hitosRawData

        const dailyTotalsMap = dailyReports.reduce((acc, curr) => {
            if (!curr.fecha) return acc
            const dateKey = curr.fecha.split('T')[0]
            acc[dateKey] = curr.cant_ventas
            return acc
        }, {})

        const dailyLastSaleMap = allSales.reduce((acc, curr) => {
            if (!curr.fecha) return acc
            const dateKey = curr.fecha.substring(0, 10)

            if (!acc[dateKey]) acc[dateKey] = curr.fecha
            else {
                if (curr.fecha > acc[dateKey]) acc[dateKey] = curr.fecha
            }
            return acc
        }, {})

        let globalMinH = 8
        let globalMaxH = 21
        let hasData = false

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
            Object.values(grouped).forEach(g => {
                if (g.lastSaleTime) {
                    const h = parseInt(g.lastSaleTime.includes('T') ? g.lastSaleTime.split('T')[1].split(':')[0] : g.lastSaleTime.split(' ')[1].split(':')[0])
                    if (h > globalMaxH) globalMaxH = h
                }
            })
        }

        let pivotedData = Object.values(grouped)

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

    const columns = useMemo(() => {
        if (analysisMode === 'hitos') {
            return [
                {
                    key: 'dia',
                    label: 'Fecha',
                    width: 'w-48',
                    render: (val) => {
                        if (!val) return ''
                        const [y, m, d] = val.split('-')

                        const getLocalDateStr = (date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        };

                        const now = new Date()
                        const todayStr = getLocalDateStr(now)
                        const yesterday = new Date(now)
                        yesterday.setDate(now.getDate() - 1)
                        const yesterdayStr = getLocalDateStr(yesterday)

                        const isToday = val === todayStr
                        const isYesterday = val === yesterdayStr

                        return (
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-300">{`${d}/${m}/${y}`}</span>
                                {isToday && <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-tighter">HOY</span>}
                                {isYesterday && <span className="bg-slate-700/50 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded border border-slate-600/30 uppercase tracking-tighter">AYER</span>}
                            </div>
                        )
                    }
                },
                {
                    key: 'timeline',
                    label: `Línea de Tiempo (${minHour}:00 - ${maxHour}:00)`,
                    render: (_, row) => <HitosTimelineCell row={row} minHour={minHour} maxHour={maxHour} />
                },
                { key: 'total_ventas', label: 'Total', width: 'w-24', render: (val) => <span className="font-black text-blue-400 tabular-nums text-lg">{val}</span> },
            ]
        }

        const commonColumns = [
            { key: 'ventas_manana', label: 'Mañana (06-13)', render: (val) => <span className="font-bold text-slate-300">{val || 0}</span> },
            { key: 'ventas_tarde', label: 'Tarde (13-19)', render: (val) => <span className="font-bold text-slate-300">{val || 0}</span> },
            { key: 'ventas_noche', label: 'Noche (19-00)', render: (val) => <span className="font-bold text-slate-300">{val || 0}</span> },
            { key: 'total_ventas', label: 'Total', render: (val) => <span className="font-black text-blue-400 tabular-nums text-lg">{val || 0}</span> },
        ]

        if (viewType === 'diario') {
            return [
                {
                    key: 'fecha', label: 'Fecha', width: 'w-40', render: (val) => {
                        if (!val) return ''
                        if (typeof val === 'string' && val.includes('-')) {
                            const [y, m, d] = val.split('T')[0].split('-')
                            return <span className="font-bold text-slate-300">{`${d}/${m}/${y}`}</span>
                        }
                        return <span className="font-bold text-slate-300">{new Date(val).toLocaleDateString()}</span>
                    }
                },
                ...commonColumns
            ]
        }
        if (viewType === 'semanal') {
            return [
                {
                    key: 'semana_del', label: 'Semana Del', width: 'w-40', render: (val) => {
                        if (!val) return ''
                        if (typeof val === 'string' && val.includes('-')) {
                            const [y, m, d] = val.split('T')[0].split('-')
                            return <span className="font-bold text-slate-300">{`${d}/${m}/${y}`}</span>
                        }
                        return <span className="font-bold text-slate-300">{new Date(val).toLocaleDateString()}</span>
                    }
                },
                ...commonColumns
            ]
        }
        if (viewType === 'mensual') {
            return [
                { key: 'anio', label: 'Año', width: 'w-20', render: (val) => <span className="font-black text-slate-500">{val}</span> },
                { key: 'mes', label: 'Mes', width: 'w-24', render: (val) => <span className="font-bold text-slate-300 uppercase tracking-widest text-xs">{val}</span> },
                ...commonColumns
            ]
        }
        return commonColumns
    }, [analysisMode, viewType, minHour, maxHour])

    return (
        <div className="space-y-8">
            <AnalisisHorariosHeader
                analysisMode={analysisMode}
                setAnalysisMode={setAnalysisMode}
                viewType={viewType}
                setViewType={setViewType}
                page={page}
                setPage={setPage}
            />

            {analysisMode === 'hitos' && <HitosCardsGrid hitosRawData={hitosRawData} />}

            {analysisMode === 'heatmap' ? (
                <HeatmapMode data={processedHorariosData} />
            ) : (
                <DataTable
                    data={currentData}
                    columns={columns}
                    isLoading={loading}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortOrder={sortOrder}
                    onFilter={setFilterValue}
                    minWidth={analysisMode === 'hitos' ? '950px' : '750px'}
                />
            )}
        </div>
    )
}

export default AnalisisHorariosView
