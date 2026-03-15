import React, { useState } from 'react'
import DataTable from '../components/DataTable'
import { useRetiros } from '../hooks/useData'
import { Banknote, Plus, Search, Loader2, Calendar, FileText, Check, X } from 'lucide-react'
import * as api from '../services/api'
import { useSWRConfig } from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const RetirosView = () => {
    const [sortColumn, setSortColumn] = useState('fecha')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterValue, setFilterValue] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [form, setForm] = useState({ motivo: '', monto: '' })
    
    const { mutate } = useSWRConfig()
    const { data: retiros, loading } = useRetiros({
        sortColumn,
        sortOrder,
        filterColumn: 'motivo',
        filterValue
    })

    const columns = [
        { key: 'retiro_id', label: 'ID', width: 'w-24', render: (val) => <span className="font-bold text-slate-500">#{val.split('_')[1] || val}</span> },
        { 
            key: 'fecha', 
            label: 'Fecha', 
            width: 'w-40',
            render: (val) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-300">{new Date(val).toLocaleDateString()}</span>
                    <span className="text-[10px] text-slate-500">{new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs</span>
                </div>
            )
        },
        { key: 'motivo', label: 'Motivo', width: 'w-1/2', wrap: true, render: (val) => <span className="font-semibold text-slate-200">{val}</span> },
        { key: 'monto', label: 'Monto', width: 'w-32', render: (val) => <span className="font-black text-rose-400 text-lg tabular-nums">-${Number(val).toLocaleString()}</span> },
    ]

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.motivo || !form.monto) return toast.error('Completá todos los campos')
        
        setIsSaving(true)
        const loadingToast = toast.loading('Registrando retiro...')
        try {
            await api.crearRetiro({
                motivo: form.motivo,
                monto: Number(form.monto)
            })
            mutate(['retiros', { sortColumn, sortOrder, filterColumn: 'motivo', filterValue }])
            setForm({ motivo: '', monto: '' })
            setIsAdding(false)
            toast.success('Retiro registrado correctamente', { id: loadingToast })
        } catch (error) {
            toast.error('Error al registrar: ' + (error.message || 'Error desconocido'), { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Banknote className="h-10 w-10 text-rose-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Gestión de Caja
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Control de retiros manuales y salidas de dinero.</p>
                </div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                        isAdding 
                        ? 'bg-slate-800 text-slate-400 border border-white/5' 
                        : 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:scale-105 active:scale-95'
                    }`}
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                    {isAdding ? 'Cancelar' : 'Nuevo Retiro'}
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Banknote size={120} className="text-white" />
                        </div>
                        
                        <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Motivo / Concepto</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Ej: Pago de flete, Gastos diarios..."
                                        className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500/30 transition-all outline-none"
                                        value={form.motivo}
                                        onChange={e => setForm({ ...form, motivo: e.target.value })}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Monto del Retiro</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors font-bold">$</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white text-xl font-black tabular-nums placeholder-slate-600 focus:ring-2 focus:ring-rose-500/30 transition-all outline-none"
                                        value={form.monto}
                                        onChange={e => setForm({ ...form, monto: e.target.value })}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Check size={18} />}
                                Confirmar Salida
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-slate-900/20 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <DataTable
                    data={retiros}
                    columns={columns}
                    isLoading={loading}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortOrder={sortOrder}
                    onFilter={setFilterValue}
                    searchColumn="motivo"
                    searchPlaceholder="Buscar por motivo..."
                    rowKey="retiro_id"
                />
            </div>
        </motion.div>
    )
}

export default RetirosView
