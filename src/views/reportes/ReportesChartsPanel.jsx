import React from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, LabelList
} from 'recharts'
import { Target, Activity } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[180px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{label}</p>
            {payload.map((p) => (
                <div key={p.dataKey || p.name} className="flex justify-between items-center gap-4 text-xs font-bold mb-1">
                    <span style={{ color: p.color }}>{p.name === 'ingresos' ? 'Ingresos' : p.name === 'egresos' ? 'Egresos' : 'Saldo'}</span>
                    <span className="text-white tabular-nums">${Math.floor(p.value).toLocaleString()}</span>
                </div>
            ))}
        </div>
    )
}

export function ReportesEvolucionChart({ chartData, reportType }) {
    return (
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={chartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => {
                    if (reportType === 'diario' && val?.includes('-')) {
                        const parts = val.split('-')
                        return `${parts[2]}/${parts[1]}`
                    }
                    return val
                }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIngresos)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                <Area type="monotone" dataKey="egresos" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEgresos)" dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export function ReportesTopProductsChart({ aggregatedTopData, loadingTop }) {
    if (loadingTop) {
        return <div className="space-y-3 mt-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-white/5 rounded-xl animate-pulse" />)}</div>
    }
    if (aggregatedTopData.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-600 text-sm italic">Sin datos disponibles</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <BarChart layout="vertical" data={aggregatedTopData} margin={{ left: 15, right: 55, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="producto" type="category" axisLine={false} tickLine={false} fontSize={10} width={100} tick={{ fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#ffffff04' }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                        <div className="bg-slate-900 border border-white/10 rounded-xl p-3 text-[10px] font-bold space-y-1">
                            <p className="text-white font-black">{d.producto}</p>
                            <p className="text-emerald-400">Ganancia: ${Math.floor(d.ganancia_total).toLocaleString()}</p>
                            <p className="text-slate-400">Cantidad: {Number(d.cantidad_total || 0).toLocaleString()}</p>
                        </div>
                    )
                }} />
                <Bar dataKey="ganancia_total" radius={[0, 6, 6, 0]} barSize={18}>
                    {aggregatedTopData.map((entry, index) => (
                        <Cell key={entry.producto || `cell-${entry.ganancia_total}-${index}`} fill={index === 0 ? '#10b981' : `rgba(16,185,129,${0.6 - index * 0.1})`} />
                    ))}
                    <LabelList dataKey="ganancia_total" position="right" fill="#64748b" fontSize={10} fontWeight="bold" formatter={(val) => `$${Math.floor(val / 1000)}k`} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
