import React, { useMemo } from 'react'
import { Edit2, Check, X, Loader2, TrendingUp, TrendingDown, Clock, Timer } from 'lucide-react'
import ProductAutocomplete from '../../components/ProductAutocomplete'

export const useProductosColumns = ({
    editingId,
    editForm,
    setEditForm,
    isSaving,
    handleSave,
    handleEditStart
}) => {
    return useMemo(() => [
        {
            key: 'nombre',
            label: 'Producto',
            wrap: true,
            width: 'w-[45%]',
            render: (val, row) => (
                <div className="flex flex-col">
                    {editingId === row.producto_id ? (
                        <div className="min-w-[200px] flex flex-col gap-2 py-1">
                            <ProductAutocomplete
                                value={editForm.nombre}
                                onChange={v => setEditForm({ ...editForm, nombre: v })}
                                className="bg-slate-800/50 border-white/10"
                            />
                            {editForm.nombre?.trim().toUpperCase() !== row.nombre && (
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className="relative">
                                        <input 
                                            type="checkbox"
                                            checked={editForm.p_guardar_alias}
                                            onChange={e => setEditForm({ ...editForm, p_guardar_alias: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`w-8 h-4 rounded-full transition-colors ${editForm.p_guardar_alias ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${editForm.p_guardar_alias ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors uppercase tracking-tight">Guardar como alias</span>
                                </label>
                            )}
                        </div>
                    ) : (
                        <span className="font-bold text-slate-200">{val}</span>
                    )}
                </div>
            )
        },
        {
            key: 'ultimo_precio_venta',
            label: 'Precio Venta',
            width: 'w-28',
            render: (val) => (
                <div className="flex items-center gap-1.5 font-black text-emerald-400 tabular-nums">
                    <TrendingUp className="h-3 w-3 opacity-50" />
                    ${val}
                </div>
            )
        },
        {
            key: 'ultimo_costo_compra',
            label: 'Precio Compra',
            width: 'w-28',
            render: (val) => (
                <div className="flex items-center gap-1.5 font-black text-slate-400 tabular-nums opacity-80">
                    <TrendingDown className="h-3 w-3 opacity-50" />
                    ${val}
                </div>
            )
        },
        {
            key: 'stock_actual',
            label: 'Stock',
            width: 'w-36',
            render: (val, row) => editingId === row.producto_id ? (
                <input
                    type="number"
                    aria-label="Stock actual"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 border-none rounded-lg px-2 py-1 w-20 text-right text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                    value={editForm.stock_actual}
                    onChange={e => setEditForm({ ...editForm, stock_actual: e.target.value })}
                />
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                        <div
                            style={{ width: `${Math.min((val / 20) * 100, 100)}%` }}
                            className={`h-full ${val < 10 ? 'bg-rose-500' : val < 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                    </div>
                    <span className={`font-black tabular-nums ${val < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {val}
                    </span>
                </div>
            )
        },
        {
            key: 'dias_para_quiebre',
            label: 'Predicción',
            width: 'w-28',
            render: (val) => (
                <div className="flex flex-col gap-1">
                    {val !== null ? (
                        <>
                            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                                <Timer className={`h-3 w-3 ${val < 3 ? 'text-rose-500 animate-pulse' : val < 7 ? 'text-amber-500' : 'text-emerald-500'}`} />
                                <span className={val < 3 ? 'text-rose-400' : val < 7 ? 'text-amber-400' : 'text-emerald-400'}>
                                    {val} días
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">Stock estimado</span>
                        </>
                    ) : (
                        <span className="text-[10px] text-slate-600 italic">Sin datos de venta</span>
                    )}
                </div>
            )
        },
        {
            key: 'fecha_actualizacion',
            label: 'Update',
            width: 'w-28',
            render: (val) => val ? (
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(val).toLocaleDateString()}
                </div>
            ) : <span className="text-slate-700">-</span>
        },
        {
            key: 'acciones',
            label: 'Acciones',
            width: 'w-24',
            render: (_, row) => (
                <div className="flex justify-center gap-1">
                    {editingId === row.producto_id ? (
                        <>
                            <button type="button"
                                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                                disabled={isSaving}
                                className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all active:scale-95"
                                title="Guardar cambios"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                disabled={isSaving}
                                className="p-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all active:scale-95"
                                title="Cancelar"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <button type="button"
                            onClick={(e) => { e.stopPropagation(); handleEditStart(row); }}
                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            title="Editar / Unificar"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ], [editingId, editForm, isSaving, handleSave, handleEditStart, setEditForm])
}
