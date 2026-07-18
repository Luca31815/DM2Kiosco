import React from 'react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Area,
    Bar,
    ReferenceLine,
} from 'recharts'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Period Selector ──────────────────────────────────────────────────────────
export const PeriodButton = React.memo(({ label, active, onClick }) => (
    <button type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
            active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
        {label}
    </button>
))
PeriodButton.displayName = 'PeriodButton'

// ── Custom Tooltip for Chart ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
        <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[160px]">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                        <span className="text-[11px] font-semibold text-slate-300">{entry.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-white tabular-nums">
                        {entry.name === 'Ingresos' ? `$${(entry.value / 1000).toFixed(1)}k` : entry.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ── Evolution Chart Card ──────────────────────────────────────────────────────
export const HomeChart = React.memo(({ chartData, chartPeriod, setChartPeriod }) => {
    const isMobile = useIsMobile()

    return (
        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-xl animate-fade-in-up animation-delay-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Evolución Comercial</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Ingresos y transacciones</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-white/5">
                    {[7, 14, 30].map(p => (
                        <PeriodButton key={p} label={`${p}d`} active={chartPeriod === p} onClick={() => setChartPeriod(p)} />
                    ))}
                </div>
            </div>

            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={isMobile ? 250 : 50}>
                    <ComposedChart data={chartData.points} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="transparent"
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={24}
                        />
                        <YAxis
                            yAxisId="ingresos"
                            orientation="left"
                            stroke="transparent"
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                            width={48}
                        />
                        <YAxis
                            yAxisId="ventas"
                            orientation="right"
                            stroke="transparent"
                            tick={{ fill: '#334155', fontSize: 9, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            width={28}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {chartData.avg > 0 && (
                            <ReferenceLine
                                yAxisId="ingresos"
                                y={chartData.avg}
                                stroke="#6366f1"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                label={{ value: 'Prom.', fill: '#6366f1', fontSize: 9, fontWeight: 700, position: 'insideTopLeft' }}
                            />
                        )}
                        <Bar
                            yAxisId="ventas"
                            dataKey="ventas"
                            name="Transacciones"
                            fill="rgba(99, 102, 241, 0.15)"
                            radius={[3, 3, 0, 0]}
                            isAnimationActive={!isMobile}
                        />
                        <Area
                            yAxisId="ingresos"
                            type="monotone"
                            dataKey="ingresos"
                            name="Ingresos"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#gradIngresos)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                            isAnimationActive={!isMobile}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-5 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
                    <span className="text-[10px] text-slate-400 font-semibold">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500/40" />
                    <span className="text-[10px] text-slate-400 font-semibold">Transacciones</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 border-t-2 border-dashed border-indigo-400" />
                    <span className="text-[10px] text-slate-400 font-semibold">Promedio</span>
                </div>
            </div>
        </div>
    )
})
HomeChart.displayName = 'HomeChart'
