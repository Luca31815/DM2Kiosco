import React from 'react'
import { CreditCard, Check, Trash2, X, Edit2 } from 'lucide-react'

export const ReservaPaymentSection = ({
    dinero = [],
    editingPaymentId,
    setEditingPaymentId,
    editPaymentForm,
    setEditPaymentForm,
    handleSavePayment,
    handleDeletePayment
}) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
                <CreditCard className="h-4 w-4" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Pagos / Señas</h4>
            </div>
            <div className="bg-slate-950/20 rounded-xl border border-white/5 p-4 divide-y divide-white/5">
                {dinero.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-2 italic font-medium">Sin movimientos de dinero</p>
                ) : dinero.map((m) => (
                    <div key={m.movimiento_id}>
                        {editingPaymentId === m.movimiento_id ? (
                            <div className="flex flex-col gap-2 py-2.5">
                                <div className="flex gap-2">
                                    <select
                                        value={editPaymentForm.metodo}
                                        aria-label="Método de pago"
                                        onChange={e => setEditPaymentForm({ ...editPaymentForm, metodo: e.target.value })}
                                        className="bg-slate-900 border-none rounded-lg text-xs px-2 py-1 text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 w-1/2"
                                    >
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                        <option value="Transferencia">Transferencia</option>
                                    </select>
                                    <div className="flex items-center bg-slate-900 rounded-lg px-2 py-1 w-1/2">
                                        <span className="text-xs text-slate-500 mr-1">$</span>
                                        <input
                                            type="number"
                                            aria-label="Monto"
                                            value={editPaymentForm.monto}
                                            onChange={e => setEditPaymentForm({ ...editPaymentForm, monto: e.target.value })}
                                            className="bg-transparent border-none text-xs text-right text-slate-200 outline-none w-full tabular-nums"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-1">
                                    <button type="button"
                                        onClick={() => handleSavePayment(m)}
                                        className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-all"
                                        title="Guardar"
                                        aria-label="Guardar pago"
                                    >
                                        <Check size={12} />
                                    </button>
                                    <button type="button"
                                        onClick={() => handleDeletePayment(m)}
                                        className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all"
                                        title="Eliminar"
                                        aria-label="Eliminar pago"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <button type="button"
                                        onClick={() => setEditingPaymentId(null)}
                                        className="p-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-all"
                                        title="Cancelar"
                                        aria-label="Cancelar edición"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center py-2.5 group/pay">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{m.metodo}</span>
                                    <span className="text-[10px] text-slate-600">{new Date(m.fecha).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-emerald-400 tabular-nums">${m.monto}</span>
                                    <button type="button"
                                        onClick={() => {
                                            setEditingPaymentId(m.movimiento_id)
                                            setEditPaymentForm({ metodo: m.metodo, monto: m.monto })
                                        }}
                                        aria-label="Editar pago"
                                        className="p-1 text-slate-600 hover:text-white hover:bg-white/5 rounded transition-all opacity-0 group-hover/pay:opacity-100"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
