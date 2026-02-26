import React, { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useAnalisisHorarios, useHitosViewData } from '../hooks/useData'
import { Clock, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

const AnalisisHorariosView = () => {
    const [viewType, setViewType] = useState('diario')
    const [analysisMode, setAnalysisMode] = useState('horarios')
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

    const getColumns = () => {
        if (analysisMode === 'hitos') {
            return [
                {
                    key: 'dia',
                    label: 'Fecha',
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
                            <div className="relative w-full h-18 bg-white/5 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
                                {Array.from({ length: totalH + 1 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-0 bottom-0 border-r border-white/5 text-[9px] font-black text-slate-600 pt-1 px-1"
                                        style={{ left: `${(i / totalH) * 100}%` }}
                                    >
                                        <span>{startH + i}h</span>
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
                                            <div className="w-px h-full bg-yellow-500/40 group-hover:bg-yellow-500/80 transition-all duration-300"></div>
                                            <div className="absolute top-[-16px] flex flex-col items-center">
                                                <div className="bg-yellow-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-[0_0_15px_rgba(234,179,8,0.4)] transform -translate-x-1/2 flex items-center gap-1 group-hover:scale-110 transition-transform">
                                                    <Trophy className="h-2.5 w-2.5" />
                                                    {m.n}
                                                </div>
                                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-yellow-500 transform -translate-x-1/2"></div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {lastPos >= 0 && lastPos <= 100 && (
                                    <div
                                        className="absolute top-0 bottom-0 flex flex-col items-center group z-20"
                                        style={{ left: `${lastPos}%` }}
                                    >
                                        <div className="w-px h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                                        <div className="absolute top-7 bg-blue-600 border border-blue-400/50 text-[10px] font-black text-white px-2 py-0.5 rounded-lg shadow-xl transform -translate-x-1/2 backdrop-blur-md group-hover:scale-110 transition-transform">
                                            {row.total_ventas} v.
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-blue-600 mt-[-1.5px] shadow-[0_0_12px_rgba(59,130,246,0.9)] group-hover:scale-125 transition-transform"></div>
                                    </div>
                                )}
                            </div>
                        )
                    }
                },
                { key: 'total_ventas', label: 'Total', render: (val) => <span className="font-black text-blue-400 tabular-nums text-lg">{val}</span> },
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
                    key: 'fecha', label: 'Fecha', render: (val) => {
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
                    key: 'semana_del', label: 'Semana Del', render: (val) => {
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
                { key: 'anio', label: 'Año', render: (val) => <span className="font-black text-slate-500">{val}</span> },
                { key: 'mes', label: 'Mes', render: (val) => <span className="font-bold text-slate-300 uppercase tracking-widest text-xs">{val}</span> },
                ...commonColumns
            ]
        }
        return commonColumns
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${analysisMode === 'horarios' ? 'bg-purple-500/10' : 'bg-yellow-500/10'} border border-white/5 shadow-2xl`}>
                            {analysisMode === 'horarios' ? <Clock className="h-8 w-8 text-purple-400" /> : <Trophy className="h-8 w-8 text-yellow-400" />}
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            {analysisMode === 'horarios' ? 'Análisis Horarios' : 'Hitos de Negocio'}
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Inteligencia de ventas y picos de demanda.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex glass-panel p-1 border-white/10 rounded-xl">
                        <button
                            onClick={() => setAnalysisMode('horarios')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${analysisMode === 'horarios' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Horarios
                        </button>
                        <button
                            onClick={() => setAnalysisMode('hitos')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${analysisMode === 'hitos' ? 'bg-yellow-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Hitos
                        </button>
                    </div>

                    {analysisMode === 'horarios' && (
                        <div className="flex glass-panel p-1 border-white/10 rounded-xl">
                            {['diario', 'semanal', 'mensual'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setViewType(type)}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewType === type ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}

                    {analysisMode === 'hitos' && (
                        <div className="flex glass-panel p-1 border-white/10 rounded-xl gap-1">
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-2 rounded-lg text-[10px] font-black text-slate-400 hover:bg-white/5 transition-all"
                            >
                                Anterior
                            </button>
                            <div className="px-3 py-2 text-[10px] font-black text-yellow-500 bg-white/5 rounded-lg border border-white/5">
                                Período {page}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all ${page === 1 ? 'opacity-20' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                Sig.
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {analysisMode === 'hitos' && hitosRawData?.hitos?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[10, 20, 30, 40].map((n, i) => {
                        let sumMinutes = 0
                        let count = 0

                        hitosRawData.hitos.forEach(h => {
                            if (h.hito_logrado === n && h.hora_exacta) {
                                const [hStr, mStr] = h.hora_exacta.split(':')
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

                        let displayH = 8 + avgH
                        let displayM = avgM
                        if (displayM >= 60) {
                            displayH += 1
                            displayM -= 60
                        }

                        const avgTime = count > 0 ? `${displayH.toString().padStart(2, '0')}:${displayM.toString().padStart(2, '0')}` : '--:--'

                        return (
                            <motion.div
                                key={n}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-6 rounded-2xl flex flex-col items-center group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black group-hover:text-slate-400 transition-colors">Hito {n} Ventas</span>
                                <span className="text-4xl font-black text-yellow-500 mt-2 tabular-nums group-hover:scale-110 transition-transform">{avgTime} <span className="text-sm font-medium text-slate-600">hs</span></span>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic leading-none">Promedio en {count} días</span>
                                </div>
                            </motion.div>
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
        </motion.div>
    )
}

export default AnalisisHorariosView
