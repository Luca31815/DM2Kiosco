import React from 'react'
import { Package, Coins, Edit2, Check, X, Plus, Info, Trash2 } from 'lucide-react'

export const OperationItemsTable = ({
    items,
    editingItemId,
    setEditingItemId,
    itemForm,
    setItemForm,
    handleSaveItem,
    isSaving
}) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-350 font-semibold border-b border-slate-800 pb-2 text-[10px] uppercase tracking-wider">
                <Package className="w-3.5 h-3.5 text-violet-400" />
                <span>Productos registrados en la operación</span>
            </div>
            {items.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Sin productos registrados en los detalles.</p>
            ) : (
                <div className="overflow-x-auto scroll-touch max-h-60 overflow-y-auto pr-1">
                    <table className="w-full text-left text-xs text-slate-350 border-collapse" style={{ minWidth: '500px' }}>
                        <thead>
                            <tr className="text-slate-500 border-b border-slate-800/80 pb-1">
                                <th className="py-1.5 font-normal">Producto</th>
                                <th className="py-1.5 font-normal text-right">Cant.</th>
                                <th className="py-1.5 font-normal text-right">Precio</th>
                                <th className="py-1.5 font-normal text-right">Subtotal</th>
                                <th className="py-1.5 font-normal text-center w-16">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {items.map((it) => {
                                const isEditing = editingItemId === it.id
                                return (
                                    <tr key={it.id || it.movimiento_id || it.producto_id || `it-${it.nombre}-${it.cantidad}`} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="py-2 text-slate-300 font-medium max-w-[150px] truncate" title={it.nombre || it.producto_id}>{it.nombre || it.producto_id}</td>
                                        <td className="py-2 text-right font-mono text-slate-400">
                                            {isEditing
                                                ? <input type="number" aria-label="Cantidad ítem" className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-12 text-right text-slate-100 font-mono focus:outline-none" value={itemForm.cantidad} onChange={e => setItemForm({ ...itemForm, cantidad: e.target.value })} disabled={isSaving} />
                                                : it.cantidad
                                            }
                                        </td>
                                        <td className="py-2 text-right font-mono text-slate-400">
                                            {isEditing
                                                ? <input type="number" aria-label="Precio unitario ítem" className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-16 text-right text-slate-100 font-mono focus:outline-none" value={itemForm.precio_unitario} onChange={e => setItemForm({ ...itemForm, precio_unitario: e.target.value })} disabled={isSaving} />
                                                : `$${Number(it.precio_unitario || it.precio || 0).toLocaleString('es-AR')}`
                                            }
                                        </td>
                                        <td className="py-2 text-right font-mono text-slate-200 font-medium">
                                            ${Number(it.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 text-center">
                                            {isEditing ? (
                                                <div className="flex justify-center items-center space-x-1">
                                                    <button type="button" onClick={() => handleSaveItem(it)} disabled={isSaving} aria-label="Guardar ítem" className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={() => setEditingItemId(null)} disabled={isSaving} aria-label="Cancelar edición ítem" className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={() => { setEditingItemId(it.id); setItemForm({ cantidad: it.cantidad, precio_unitario: it.precio_unitario || it.precio || '0' }) }} disabled={isSaving} aria-label="Editar ítem" className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export const OperationPaymentsTable = ({
    payments,
    editingPaymentId,
    setEditingPaymentId,
    paymentForm,
    setPaymentForm,
    handleSavePayment,
    handleDeletePayment,
    handleCreatePayment,
    isSaving
}) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2 text-slate-355 font-semibold text-[10px] uppercase tracking-wider">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Movimientos registrados en caja</span>
                </div>
                {payments.length === 0 && (
                    <button type="button" onClick={handleCreatePayment} disabled={isSaving} className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-350 transition-colors uppercase">
                        <Plus className="w-3 h-3" /><span>Crear Pago Compensante</span>
                    </button>
                )}
            </div>

            {payments.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
                    <p className="text-xs text-slate-500 italic">Sin registros de pago vinculados en caja.</p>
                </div>
            ) : (
                <div className="overflow-x-auto scroll-touch max-h-60 overflow-y-auto pr-1">
                    <table className="w-full text-left text-xs text-slate-350 border-collapse" style={{ minWidth: '500px' }}>
                        <thead>
                            <tr className="text-slate-500 border-b border-slate-800/80 pb-1">
                                <th className="py-1.5 font-normal">Caja / Cuenta</th>
                                <th className="py-1.5 font-normal">Concepto</th>
                                <th className="py-1.5 font-normal text-right">Monto</th>
                                <th className="py-1.5 font-normal text-center w-16">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {payments.map((p) => {
                                const isEditing = editingPaymentId === p.movimiento_id
                                return (
                                    <tr key={p.movimiento_id || p.id || `pay-${p.cuenta_caja}-${p.monto}`} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="py-2 text-slate-300 font-medium">{p.cuenta_caja || p.tipo_movimiento || 'Caja Principal'}</td>
                                        <td className="py-2 text-slate-400 italic max-w-[130px] truncate" title={p.notas || ''}>{p.notas || '-'}</td>
                                        <td className="py-2 text-right font-mono text-emerald-400 font-medium">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end space-x-1">
                                                    <span className="text-[10px] text-slate-500">$</span>
                                                    <input type="number" aria-label="Monto pago" className="bg-slate-805 border border-slate-700 rounded px-1.5 py-0.5 w-20 text-right text-emerald-400 font-mono font-medium focus:outline-none" value={paymentForm.monto} onChange={e => setPaymentForm({ monto: e.target.value })} disabled={isSaving} />
                                                </div>
                                            ) : `$${Number(p.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                                        </td>
                                        <td className="py-2 text-center">
                                            {isEditing ? (
                                                <div className="flex justify-center items-center space-x-1">
                                                    <button type="button" onClick={() => handleSavePayment(p.movimiento_id)} disabled={isSaving} className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors" title="Guardar"><Check className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={() => setEditingPaymentId(null)} disabled={isSaving} className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors" title="Cancelar"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center items-center space-x-1">
                                                    <button type="button" onClick={() => { setEditingPaymentId(p.movimiento_id); setPaymentForm({ monto: p.monto || '0' }) }} disabled={isSaving} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors" title="Editar monto">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeletePayment(p.movimiento_id)} disabled={isSaving} className="p-1 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded transition-colors" title="Eliminar pago">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px] flex items-start space-x-2">
                <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-slate-400 leading-relaxed">
                    {payments.length === 1 ? (
                        <p><span className="text-emerald-400 font-semibold">Auto-Curable:</span> Al contar con exactamente <span className="text-emerald-300">1 registro de pago</span>, el proceso automático reajustará el monto en caja para que coincida perfectamente con la cabecera sin alterar otros datos.</p>
                    ) : payments.length === 0 ? (
                        <p><span className="text-amber-400 font-semibold">Sin Pago:</span> Podés hacer clic en "Crear Pago Compensante" para generar el registro de caja faltante por el monto total de la operación.</p>
                    ) : (
                        <p><span className="text-purple-400 font-semibold">Múltiples Pagos:</span> Hay {payments.length} movimientos de caja asociados. Podés editar o eliminar montos individualmente antes de re-sincronizar.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
