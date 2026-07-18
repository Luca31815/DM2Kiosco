import React from 'react'
import { AnimatePresence } from 'framer-motion'

export const ProveedoresMergeModal = ({
    isMergeModalOpen,
    setIsMergeModalOpen,
    isMergingProgress,
    targetSupplierName,
    setTargetSupplierName,
    selectedSupplier,
    proveedores,
    handleMerge
}) => {
    return (
        <AnimatePresence>
            {isMergeModalOpen && (
                <>
                    <div 
                        onClick={() => !isMergingProgress && setIsMergeModalOpen(false)} 
                        role="button"
                        tabIndex={0}
                        aria-label="Cerrar modal de fusión"
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isMergingProgress && setIsMergeModalOpen(false)}
                        className="fixed inset-0 bg-slate-950/80 z-[100]" 
                    />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 z-[110] shadow-2xl p-8 space-y-6">
                        <h3 className="text-xl font-black text-white">Fusionar Proveedor</h3>
                        <select 
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            value={targetSupplierName}
                            aria-label="Seleccionar proveedor de destino"
                            onChange={(e) => setTargetSupplierName(e.target.value)}
                        >
                            <option value="">-- Seleccionar destino --</option>
                            {proveedores.reduce((acc, p) => {
                                if (p.nombre !== selectedSupplier?.nombre) {
                                    acc.push(<option key={p.nombre} value={p.nombre}>{p.nombre}</option>)
                                }
                                return acc
                            }, [])}
                        </select>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsMergeModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase">Cancelar</button>
                            <button type="button" onClick={handleMerge} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase">Confirmar</button>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
