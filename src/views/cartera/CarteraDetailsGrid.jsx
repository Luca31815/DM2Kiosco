import React from 'react'
import { m } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

export const CarteraDetailsGrid = ({ loadingCartera, cartera, formatCurrency }) => {
    return (
        <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5 space-y-6">
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Detalle de Fondos por Método</h3>
                <p className="text-xs text-slate-500 mt-1">Suma acumulada de entradas y salidas registradas en la caja.</p>
            </div>

            {loadingCartera ? (
                <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-blue-500" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cartera?.map((item, idx) => (
                        <m.div 
                            key={item.metodo}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all flex flex-col justify-between gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-slate-200">{item.metodo}</span>
                                <span className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded-full text-slate-400 tabular-nums">
                                    {item.cantidad_movimientos} movs
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold">
                                    <span className="text-slate-500">Ingresos:</span>
                                    <span className="text-green-400 tabular-nums">+{formatCurrency(item.entradas)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-semibold">
                                    <span className="text-slate-500">Egresos:</span>
                                    <span className="text-red-400 tabular-nums">{formatCurrency(item.salidas)}</span>
                                </div>
                                <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-black">
                                    <span className="text-slate-400">Neto:</span>
                                    <span className={`${parseFloat(item.balance_neto) >= 0 ? 'text-white' : 'text-orange-400'} tabular-nums`}>
                                        {formatCurrency(item.balance_neto)}
                                    </span>
                                </div>
                            </div>
                        </m.div>
                    ))}
                </div>
            )}
        </div>
    )
}
