import React from 'react'
import { ChevronRight } from 'lucide-react'

export const ReservaStockSection = ({ stock = [] }) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
                <ChevronRight className="h-4 w-4" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Entregas de Stock</h4>
            </div>
            <div className="bg-slate-950/20 rounded-xl border border-white/5 p-4 divide-y divide-white/5">
                {stock.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-2 italic font-medium">Sin movimientos de stock</p>
                ) : stock.map((s) => (
                    <div key={s.movimiento_id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                        <span className="text-xs font-bold text-slate-400 truncate max-w-[180px]">{s.producto}</span>
                        <span className="text-sm font-black text-orange-400 tabular-nums">-{s.cantidad}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
