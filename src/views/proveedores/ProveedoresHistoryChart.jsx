import React, { useState, useEffect } from 'react'

export default function ProveedoresHistoryChart({ chartData }) {
    const [Recharts, setRecharts] = useState(null)

    useEffect(() => {
        import('recharts').then(setRecharts)
    }, [])

    if (!Recharts) return <div className="h-full w-full animate-pulse bg-white/5 rounded-xl" />

    const { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } = Recharts

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="fecha" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="costo" stroke="#3b82f6" fillOpacity={0.3} fill="#3b82f6" />
            </AreaChart>
        </ResponsiveContainer>
    )
}
