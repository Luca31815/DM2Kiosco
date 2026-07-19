import React from 'react'
import { m } from 'framer-motion'

export const ReportesFloatingBar = ({
    totals,
    ticketPromedio,
    margenNetoTotal
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-2 pb-2 sm:pb-6 sm:px-4">
            <m.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-950/90 backdrop-blur-xl border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-3 md:px-8 md:py-3.5 grid grid-cols-3 md:flex md:flex-row items-center justify-between w-full max-w-4xl mx-auto pointer-events-auto gap-2 md:gap-10"
            >
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Ingresos</span>
                    <span className="text-base md:text-lg font-black text-white tabular-nums">${Math.floor(totals.ingresos).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-0.5">Egresos</span>
                    <span className="text-base md:text-lg font-black text-white tabular-nums">${Math.floor(totals.egresos).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Balance</span>
                    <span className={`text-base md:text-lg font-black tabular-nums ${totals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${Math.floor(totals.balance).toLocaleString()}</span>
                </div>
                <div className="hidden md:flex items-center gap-8 border-l border-white/8 pl-10">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Ticket Prom.</span>
                        <span className="text-base font-black text-slate-300 tabular-nums">${Math.floor(ticketPromedio).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Operaciones</span>
                        <span className="text-base font-black text-slate-300 tabular-nums">{(totals.ventas + totals.compras).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Margen</span>
                        <span className={`text-base font-black tabular-nums ${margenNetoTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{margenNetoTotal.toFixed(1)}%</span>
                    </div>
                </div>
            </m.div>
        </div>
    )
}
