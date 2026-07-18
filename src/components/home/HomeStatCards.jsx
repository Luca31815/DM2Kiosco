import React, { useState, useEffect, useRef } from 'react'
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
} from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts'
import { colorMap } from './colorMap'

// ── Animated Number Counter ──────────────────────────────────────────────────
export const AnimatedNumber = ({ value, prefix = '', suffix = '', duration = 800 }) => {
    const [display, setDisplay] = useState(value)
    const prevRef = useRef(value)
    const rafRef = useRef(null)

    useEffect(() => {
        const start = prevRef.current
        const end = value
        if (start === end) return
        const startTime = performance.now()
        const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = start + (end - start) * eased
            setDisplay(current)
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            } else {
                prevRef.current = end
            }
        }
        rafRef.current = requestAnimationFrame(animate)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [value, duration])

    return <>{prefix}{typeof display === 'number' && !isNaN(display) ? Math.round(display).toLocaleString('es-AR') : display}{suffix}</>
}

// ── Skeleton Loader ──────────────────────────────────────────────────────────
export const SkeletonCard = () => (
    <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 skeleton rounded-xl" />
            <div className="w-16 h-6 skeleton rounded-full" />
        </div>
        <div className="w-20 h-3 skeleton rounded mb-3" />
        <div className="w-32 h-8 skeleton rounded" />
    </div>
)

// ── Mini Sparkline ───────────────────────────────────────────────────────────
export const Sparkline = React.memo(({ data, color = '#3b82f6' }) => {
    if (!data || data.length < 2) return null
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const w = 80, h = 32, pad = 2
    const points = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2)
        const y = pad + (1 - (v - min) / range) * (h - pad * 2)
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
            <defs>
                <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
})
Sparkline.displayName = 'Sparkline'

// ── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = React.memo(({ title, value, icon: Icon, trend, trendValue, trendLabel, color = 'blue', sparkData, subtitle, delay = 0, onClick }) => {
    const c = colorMap[color] || colorMap.blue

    return (
        <div
            className={`bg-slate-900 p-4 sm:p-5 rounded-xl sm:rounded-2xl relative overflow-hidden border border-white/5 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/10 animate-fade-in-up ${c.glow} ${onClick ? 'cursor-pointer' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
        >
            {/* Ambient glow */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 ${c.bg} rounded-full blur-2xl pointer-events-none transition-opacity duration-300`} />

            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${c.bg} border ${c.border} shadow-sm`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${c.icon}`} />
                </div>
                {trendValue !== undefined && trendValue !== null && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black ${
                        trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
                        trend === 'down' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-700/50 text-slate-400'
                    }`}>
                        {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                        {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                        {trend === 'neutral' && <Minus className="h-3 w-3" />}
                        {trendValue}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] mb-1">{title}</p>
                <h3 className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                    {value}
                </h3>
                {(subtitle || trendLabel) && (
                    <p className="text-slate-500 text-[10px] sm:text-[11px] font-semibold mt-1.5">{subtitle || trendLabel}</p>
                )}
            </div>

            {sparkData && sparkData.length > 1 && (
                <div className="relative z-10 mt-3 opacity-70">
                    <Sparkline data={sparkData} color={c.line} />
                </div>
            )}
        </div>
    )
})
StatCard.displayName = 'StatCard'
