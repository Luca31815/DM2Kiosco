import React from 'react'
import { m } from 'framer-motion'
import { Coins, CreditCard, Wallet } from 'lucide-react'

export const CarteraSummaryCards = ({
    totalEfectivo,
    totalDigital,
    totalCartera,
    formatCurrency
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cash Balance */}
            <m.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/10 flex items-center justify-between"
            >
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Efectivo en Caja</span>
                    <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                        {formatCurrency(totalEfectivo)}
                    </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                    <Coins className="size-6" />
                </div>
            </m.div>

            {/* Digital / Bank Balance */}
            <m.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/10 flex items-center justify-between"
            >
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Digital Consolidado</span>
                    <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                        {formatCurrency(totalDigital)}
                    </h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                    <CreditCard className="size-6" />
                </div>
            </m.div>

            {/* Grand Total Portfolio */}
            <m.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/10 flex items-center justify-between"
            >
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Total en Cartera</span>
                    <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                        {formatCurrency(totalCartera)}
                    </h3>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                    <Wallet className="size-6" />
                </div>
            </m.div>
        </div>
    )
}
