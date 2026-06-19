import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// KPICard — Tarjeta de KPI global para la vista de Reportes
// ─────────────────────────────────────────────────────────────────────────────
export const KPICard = ({ title, value, subValue, trend, icon: Icon, colorClass, accentBg }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden p-6 rounded-3xl border border-white/8 bg-slate-900 shadow-xl hover:border-white/15 transition-all duration-300"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${accentBg || 'bg-blue-500'}`} />
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/8 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-xl ${
                        trend >= 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                        {trend >= 0
                            ? <ArrowUpRight className="h-3 w-3" />
                            : <ArrowDownRight className="h-3 w-3" />
                        }
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{title}</h4>
            <div className="flex flex-col gap-1">
                <span className="text-3xl font-black text-white tracking-tight tabular-nums">{value}</span>
                {subValue && (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{subValue}</span>
                )}
            </div>
        </div>
    </motion.div>
)

// ─────────────────────────────────────────────────────────────────────────────
// MiniStat — Mini-KPI para interior de tarjeta
// ─────────────────────────────────────────────────────────────────────────────
export const MiniStat = ({ label, value, colorClass = 'text-white' }) => (
    <div className="flex justify-between items-center bg-white/4 hover:bg-white/7 transition-colors p-3 rounded-xl border border-white/5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-black tabular-nums ${colorClass}`}>{value}</span>
    </div>
)
