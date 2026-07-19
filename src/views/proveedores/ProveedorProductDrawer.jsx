import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ProveedoresHistoryChart from './ProveedoresHistoryChart'

export const ProveedorProductDrawer = ({
    selectedProduct,
    setSelectedProduct,
    chartData,
    comparativaAgrupada
}) => {
    return (
        <AnimatePresence>
            {selectedProduct && (
                <>
                    <button 
                        type="button"
                        onClick={() => setSelectedProduct(null)} 
                        aria-label="Cerrar análisis"
                        className="fixed inset-0 bg-slate-950/80 z-[60] w-full border-none p-0 cursor-default" 
                    />
                    <div className="fixed top-0 right-0 h-full w-full sm:max-w-xl bg-slate-900 border-l border-white/10 z-[70] shadow-2xl flex flex-col">
                        <div className="p-5 sm:p-8 border-b border-white/5 flex justify-between items-start bg-slate-950/40">
                            <div>
                                <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Análisis</span>
                                <h2 className="text-2xl font-black text-white">{selectedProduct}</h2>
                            </div>
                            <button type="button" onClick={() => setSelectedProduct(null)} aria-label="Cerrar" className="p-3 hover:bg-white/5 rounded-2xl text-slate-500"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 sm:space-y-10 custom-scrollbar">
                            <section className="h-64 bg-slate-800/50 p-4 rounded-3xl border border-white/5">
                                <React.Suspense fallback={<div className="w-full h-full bg-slate-800/50 rounded-2xl animate-pulse" />}>
                                    <ProveedoresHistoryChart chartData={chartData} />
                                </React.Suspense>
                            </section>
                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-slate-500">Historial Comparativo</h3>
                                <div className="space-y-3">
                                    {comparativaAgrupada.map((g) => (
                                        <div key={g.proveedor || `prov-${g.ultimoCosto}-${g.ultimaFecha}`} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-black text-white uppercase">{g.proveedor}</h4>
                                                <p className="text-[10px] text-slate-500">{new Date(g.ultimaFecha).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-2xl font-black text-purple-400">${g.ultimoCosto}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
