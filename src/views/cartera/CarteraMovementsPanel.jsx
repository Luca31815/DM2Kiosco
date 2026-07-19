import React from 'react'
import { Search, RefreshCw, X, Check, Pencil } from 'lucide-react'

export const CarteraMovementsPanel = ({
    searchVal,
    setSearchVal,
    setPage,
    loadingMovements,
    movements,
    editingMovId,
    showCustomInput,
    editMethodVal,
    setEditMethodVal,
    setShowCustomInput,
    setCustomMethodVal,
    uniqueMethods,
    customMethodVal,
    handleSaveMethod,
    setEditingMovId,
    handleEditStart,
    formatCurrency,
    totalPages,
    page
}) => {
    return (
        <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Historial de Movimientos</h3>
                    <p className="text-xs text-slate-500 mt-1">Busca y modifica individualmente los métodos de pago asignados.</p>
                </div>
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-3.5 w-3.5 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar método..."
                        className="bg-slate-800 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs text-white w-full sm:w-48 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                        value={searchVal}
                        onChange={(e) => { setSearchVal(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {loadingMovements ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" /></div>
            ) : movements.length === 0 ? (
                <div className="p-12 text-center text-slate-500 italic bg-white/3 rounded-xl border border-white/5 text-xs">
                    No se encontraron transacciones con ese método de pago.
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/3">
                        <table className="w-full text-xs text-left" style={{ minWidth: '600px' }}>
                            <thead className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3 text-center">Tipo</th>
                                    <th className="px-4 py-3">Operación</th>
                                    <th className="px-4 py-3">Método</th>
                                    <th className="px-4 py-3 text-right">Monto</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {movements.map((mov) => {
                                    const isEditing = editingMovId === mov.movimiento_id
                                    return (
                                        <tr key={mov.movimiento_id} className="hover:bg-white/5 transition-all">
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                                                {new Date(mov.fecha).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                                                    mov.tipo === 'ENTRADA' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {mov.tipo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-bold text-slate-200 uppercase tracking-tighter text-[10px] bg-white/5 px-2 py-0.5 rounded mr-1">
                                                    {mov.referencia_tipo}
                                                </span>
                                                <span className="font-semibold text-slate-400 text-[10px]">{mov.referencia_id}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {isEditing ? (
                                                    !showCustomInput ? (
                                                        <div className="flex gap-1.5 items-center">
                                                            <select
                                                                value={editMethodVal}
                                                                aria-label="Editar método de pago"
                                                                onChange={e => {
                                                                    if (e.target.value === '__custom__') {
                                                                        setShowCustomInput(true);
                                                                        setEditMethodVal('');
                                                                    } else {
                                                                        setEditMethodVal(e.target.value);
                                                                    }
                                                                }}
                                                                className="bg-slate-800 border-none rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                            >
                                                                {uniqueMethods.map(m => (
                                                                    <option key={m} value={m}>{m}</option>
                                                                ))}
                                                                <option value="__custom__">Escribir otro...</option>
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1.5 items-center">
                                                            <input
                                                                type="text"
                                                                aria-label="Otro método de pago"
                                                                className="bg-slate-800 border-none rounded px-2 py-1 text-xs text-white w-28 focus:ring-1 focus:ring-blue-500 outline-none"
                                                                placeholder="Otro método..."
                                                                value={customMethodVal}
                                                                onChange={e => setCustomMethodVal(e.target.value)}
                                                            />
                                                            <button 
                                                                type="button"
                                                                onClick={() => { setShowCustomInput(false); setCustomMethodVal(''); setEditMethodVal(mov.metodo); }}
                                                                aria-label="Cancelar edición de método"
                                                                className="p-1 hover:bg-slate-700 rounded text-slate-400"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="font-bold text-slate-200">{mov.metodo}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-white whitespace-nowrap tabular-nums">
                                                {formatCurrency(mov.monto)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                {isEditing ? (
                                                    <div className="flex justify-center gap-1.5">
                                                        <button type="button"
                                                            onClick={() => handleSaveMethod(mov.movimiento_id)}
                                                            className="p-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded transition-all"
                                                            title="Guardar"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => setEditingMovId(null)}
                                                            className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all"
                                                            title="Cancelar"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button type="button"
                                                        onClick={() => handleEditStart(mov)}
                                                        className="p-1 hover:bg-white/10 text-slate-400 hover:text-blue-400 rounded transition-all"
                                                        title="Editar método de pago"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                Página {page} de {totalPages}
                            </span>
                            <div className="flex gap-1">
                                <button type="button"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-all text-xs font-bold"
                                >
                                    Anterior
                                </button>
                                <button type="button"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-all text-xs font-bold"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
