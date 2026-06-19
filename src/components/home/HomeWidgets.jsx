import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colorMap } from './colorMap'

// ─────────────────────────────────────────────────────────────────────────────
// StockBar — Barra de progreso de stock crítico
// ─────────────────────────────────────────────────────────────────────────────
export const StockBar = React.memo(({ stock, maxStock = 20 }) => {
    const pct = Math.min((stock / maxStock) * 100, 100)
    const color = stock <= 2 ? 'bg-red-500' : stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
    return (
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
    )
})
StockBar.displayName = 'StockBar'

// ─────────────────────────────────────────────────────────────────────────────
// QuickAction — Botón de acción rápida del Panel Principal
// ─────────────────────────────────────────────────────────────────────────────
export const QuickAction = React.memo(({ icon: Icon, label, to, color = 'blue', delay = 0 }) => {
    const navigate = useNavigate()
    return (
        <button
            onClick={() => navigate(to)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 animate-fade-in-up group`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`p-2 rounded-lg ${colorMap[color]?.bg || ''} ${colorMap[color]?.border ? `border ${colorMap[color].border}` : ''} group-hover:scale-110 transition-transform`}>
                <Icon className={`h-4 w-4 ${colorMap[color]?.icon || 'text-slate-400'}`} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors text-center leading-tight">{label}</span>
        </button>
    )
})
QuickAction.displayName = 'QuickAction'

// ─────────────────────────────────────────────────────────────────────────────
// FileBarChart2 — Ícono personalizado (no disponible en lucide-react)
// ─────────────────────────────────────────────────────────────────────────────
export const FileBarChart2 = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
)
