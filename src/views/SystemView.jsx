import React, { useState } from 'react'
import useSWR from 'swr'
import { getAuditLogs, getN8nErrors, getPredictiveStock } from '../services/api'
import DataTable from '../components/DataTable'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Activity, PackageSearch, AlertCircle, Clock, Database, Terminal, User } from 'lucide-react'

// Helper para formatear fechas usando Intl nativo
const formatDate = (dateStr, includeTime = false) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const options = {
        day: 'numeric',
        month: 'short',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }
    return new Intl.DateTimeFormat('es-AR', options).format(date)
}

const SystemView = () => {
    const [activeTab, setActiveTab] = useState('audit')
    const [sortConfig, setSortConfig] = useState({ column: 'fecha', order: 'desc' })
    const [filterValue, setFilterValue] = useState('')

    // Fetchers
    const { data: auditLogs, isLoading: loadingAudit } = useSWR(
        activeTab === 'audit' ? ['auditLogs', sortConfig, filterValue] : null,
        () => getAuditLogs({ sortColumn: sortConfig.column, sortOrder: sortConfig.order, filter: filterValue })
    )

    const { data: n8nErrors, isLoading: loadingN8n } = useSWR(
        activeTab === 'n8n' ? ['n8nErrors', sortConfig, filterValue] : null,
        () => getN8nErrors({ sortColumn: sortConfig.column, sortOrder: sortConfig.order, filter: filterValue })
    )

    const { data: stockPredictions, isLoading: loadingStock } = useSWR(
        activeTab === 'stock' ? ['stockPredictions', filterValue] : null,
        () => getPredictiveStock({ filter: filterValue })
    )

    const tabs = [
        { id: 'audit', label: 'Cámara de Seguridad', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'stock', label: 'Radar de Stock', icon: PackageSearch, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { id: 'n8n', label: 'Monitor n8n', icon: Terminal, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
    ]

    const auditColumns = [
        { key: 'fecha', label: 'Fecha/Hora', render: (val) => formatDate(val, true) },
        { key: 'tabla_nombre', label: 'Tabla', render: (val) => <span className="px-2 py-1 rounded bg-white/5 text-xs font-mono uppercase tracking-tighter">{val}</span> },
        {
            key: 'accion', label: 'Acción', render: (val) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${val === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                    val === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                    }`}>{val}</span>
            )
        },
        { key: 'usuario', label: 'Usuario', render: (val) => <div className="flex items-center gap-2"><User className="h-3 w-3 text-slate-500" /><span>{val}</span></div> },
    ]

    const stockColumns = [
        { key: 'nombre', label: 'Producto' },
        { key: 'stock_actual', label: 'Stock', render: (val) => <span className={`font-bold ${val <= 0 ? 'text-red-400' : 'text-slate-300'}`}>{val}</span> },
        { key: 'ventas_diarias_promedio', label: 'Ventas Diarias (30d)', render: (val) => <span className="text-slate-400">{val} u/día</span> },
        {
            key: 'dias_para_quiebre', label: 'Días Restantes', render: (val) => (
                <div className="flex items-center gap-2">
                    {val === null ? (
                        <span className="text-slate-600 italic text-xs">Sin ventas</span>
                    ) : (
                        <>
                            <div className={`w-2 h-2 rounded-full ${val < 3 ? 'bg-red-500 animate-pulse' : val < 7 ? 'bg-amber-500' : 'bg-green-500'}`} />
                            <span className={`font-black ${val < 3 ? 'text-red-400' : val < 7 ? 'text-amber-400' : 'text-green-400'}`}>
                                {val} días
                            </span>
                        </>
                    )}
                </div>
            )
        }
    ]

    const n8nColumns = [
        { key: 'fecha', label: 'Fecha', render: (val) => formatDate(val, true) },
        { key: 'workflow_nombre', label: 'Workflow' },
        { key: 'nodo_nombre', label: 'Nodo Fallido', render: (val) => <code className="text-purple-400 text-xs">{val}</code> },
        { key: 'mensaje_error', label: 'Error', render: (val) => <span className="text-red-400 text-xs line-clamp-1 truncate max-w-xs">{val}</span> }
    ]

    const renderExpandedAudit = (row) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 font-mono text-xs">
            <div className="space-y-2">
                <div className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Valor Anterior</div>
                <pre className="bg-slate-950/50 p-3 rounded-xl border border-white/5 overflow-x-auto text-red-300/80">
                    {JSON.stringify(row.datos_anteriores, null, 2)}
                </pre>
            </div>
            <div className="space-y-2">
                <div className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Valor Nuevo</div>
                <pre className="bg-slate-950/50 p-3 rounded-xl border border-white/5 overflow-x-auto text-green-300/80">
                    {JSON.stringify(row.datos_nuevos, null, 2)}
                </pre>
            </div>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-6 space-y-6"
        >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Activity className="h-8 w-8 text-blue-500" />
                        Centro de Control Digital
                    </h1>
                    <p className="text-slate-400 font-medium">Observabilidad técnica y predicciones comerciales</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-tab-bg"
                                    className={`absolute inset-0 ${tab.bg} rounded-xl border ${tab.border} -z-10`}
                                />
                            )}
                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : 'text-slate-500'}`} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'audit' && (
                        <DataTable
                            data={auditLogs?.data || []}
                            columns={auditColumns}
                            isLoading={loadingAudit}
                            onSort={(col) => setSortConfig(s => ({ column: col, order: s.column === col && s.order === 'asc' ? 'desc' : 'asc' }))}
                            sortColumn={sortConfig.column}
                            sortOrder={sortConfig.order}
                            onFilter={setFilterValue}
                            renderExpandedRow={renderExpandedAudit}
                            rowKey="id"
                            compact
                        />
                    )}
                    {activeTab === 'stock' && (
                        <DataTable
                            data={stockPredictions?.data || []}
                            columns={stockColumns}
                            isLoading={loadingStock}
                            onFilter={setFilterValue}
                            rowKey="nombre"
                            compact
                        />
                    )}
                    {activeTab === 'n8n' && (
                        <DataTable
                            data={n8nErrors?.data || []}
                            columns={n8nColumns}
                            isLoading={loadingN8n}
                            onSort={(col) => setSortConfig(s => ({ column: col, order: s.column === col && s.order === 'asc' ? 'desc' : 'asc' }))}
                            sortColumn={sortConfig.column}
                            sortOrder={sortConfig.order}
                            onFilter={setFilterValue}
                            rowKey="id"
                            compact
                            renderExpandedRow={(row) => (
                                <div className="space-y-4 font-mono text-xs">
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <div className="text-red-400 font-black mb-2 uppercase tracking-widest text-[10px]">Detalle del Error</div>
                                        {row.mensaje_error}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Payload Context</div>
                                        <pre className="bg-slate-950/50 p-3 rounded-xl border border-white/5 overflow-x-auto text-blue-300">
                                            {JSON.stringify(row.payload_error, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4 items-center shadow-lg shadow-blue-500/5">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">v2.0</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Esquema BD</div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4 items-center shadow-lg shadow-purple-500/5">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Terminal className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">Activo</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Monitor n8n</div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4 items-center shadow-lg shadow-amber-500/5">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                        <PackageSearch className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">IA Pred.</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Radar de Stock</div>
                    </div>
                </div>
            </footer>
        </motion.div>
    )
}

export default SystemView
