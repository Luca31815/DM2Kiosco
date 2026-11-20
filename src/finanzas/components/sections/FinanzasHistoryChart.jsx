import React, { memo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatARS, formatCompactARS } from '../../utils/formatters'

const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 }
const X_AXIS_TICK = { fill: '#94a3b8', fontSize: 12 }
const X_AXIS_LINE = { stroke: 'rgba(148,163,184,0.2)' }
const Y_AXIS_TICK = { fill: '#94a3b8', fontSize: 11 }
const LEGEND_WRAPPER_STYLE = { fontSize: '12px', paddingTop: '10px', color: '#cbd5e1' }
const BAR_RADIUS = [6, 6, 0, 0]
const LINE_DOT = { r: 3.5, fill: '#38bdf8' }
const GRID_STROKE = 'rgba(148,163,184,0.12)'

const yTickFormatter = (value) => formatCompactARS(value)

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-2xl bg-slate-950/95 border border-slate-700/80 p-3 shadow-2xl text-xs space-y-1.5">
      <p className="font-display font-semibold text-slate-100 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold tabular-nums text-slate-50">
            {formatARS(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const FinanzasHistoryChart = memo(({ chartData }) => (
  <div className="h-[280px] w-full">
    <ResponsiveContainer width="100%" height="100%" debounce={100}>
      <ComposedChart data={chartData} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="label"
          tick={X_AXIS_TICK}
          axisLine={X_AXIS_LINE}
          tickLine={false}
        />
        <YAxis
          tickFormatter={yTickFormatter}
          tick={Y_AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={62}
        />
        <Tooltip content={<CustomChartTooltip />} />
        <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
        <Bar
          dataKey="ingresos"
          name="Ingresos"
          fill="#10b981"
          radius={BAR_RADIUS}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Bar
          dataKey="obligaciones"
          name="Obligaciones"
          fill="#f43f5e"
          radius={BAR_RADIUS}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke="#38bdf8"
          strokeWidth={2.5}
          dot={LINE_DOT}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
))

FinanzasHistoryChart.displayName = 'FinanzasHistoryChart'

export default FinanzasHistoryChart
