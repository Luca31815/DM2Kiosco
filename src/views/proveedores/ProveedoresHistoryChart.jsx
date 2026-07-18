import React from 'react'
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts'

export default function ProveedoresHistoryChart({ chartData }) {
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
