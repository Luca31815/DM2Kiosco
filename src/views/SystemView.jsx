import React, { useState } from 'react'
import useSWR from 'swr'
import { getAuditLogs, getN8nErrors, getPredictiveStock, rollbackLog, getAISummaries } from '../services/api'
import DataTable from '../components/DataTable'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Activity, PackageSearch, AlertCircle, Clock, Database, Terminal, User, Cpu, ArrowRight, Code2, RotateCcw, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

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

const getChanges = (oldVal, newVal) => {
    if (!newVal || !oldVal) return []
    const changes = []
    const keys = Object.keys(newVal)

    keys.forEach(key => {
        const vOld = oldVal[key]
        const vNew = newVal[key]

        if (JSON.stringify(vOld) !== JSON.stringify(vNew)) {
            // Ignorar campos de timestamp internos
            if (['fecha_actualizacion', 'updated_at'].includes(key)) return

            // Lógica especial para fechas: ignorar si la diferencia es < 5 minutos
            if (key.includes('fecha') || key.includes('_at')) {
                const dOld = new Date(vOld).getTime()
                const dNew = new Date(vNew).getTime()
                if (!isNaN(dOld) && !isNaN(dNew)) {
                    const diffMinutes = Math.abs(dNew - dOld) / 1000 / 60
                    if (diffMinutes < 5) return // Omitir cambio de ruido temporal
                }
            }

            changes.push({
                key,
                from: vOld,
                to: vNew
            })
        }
    })
    return changes
}

const calculateDiff = (oldVal, newVal) => {
    if (!newVal) return null
    if (!oldVal) return <span className="text-green-400 font-bold italic">Registro Nuevo</span>

    const changes = getChanges(oldVal, newVal)

    if (changes.length === 0) return null // Si solo hubo ruido de fecha, no mostrar fila de cambios
    if (changes.length > 2) return <span className="text-blue-400 font-bold">{changes.length} campos modificados</span>

    return (
        <div className="flex flex-col gap-1">
            {changes.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-500 uppercase font-black">{c.key}:</span>
                    <span className="text-red-400/80 line-through truncate max-w-[60px]">{String(c.from)}</span>
                    <ArrowRight className="h-2 w-2 text-slate-600" />
                    <span className="text-green-400 font-bold truncate max-w-[80px]">{String(c.to)}</span>
                </div>
            ))}
        </div>
    )
}

const DailyAISummary = ({ data, isLoading }) => {
    if (isLoading) return <div className="h-32 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 animate-pulse">Cargando inteligencia...</div>
    if (!data || data.length === 0) return (
        <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <Sparkles className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium tracking-tight">No hay resúmenes generados para hoy todavía.</p>
            <p className="text-slate-500 text-xs">El sistema genera el resumen automáticamente cada día a las 22:00.</p>
        </div>
    )

    const latest = data[0]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent -z-10" />
            <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/10 backdrop-blur-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Sparkles className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight italic">Resumen del Auditor IA</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formatDate(latest.fecha)}</p>
                        </div>
                    </div>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-medium">
                    <ReactMarkdown>{latest.contenido}</ReactMarkdown>
                </div>
            </div>
        </motion.div>
    )
}

const formatQueryContext = (context) => {
    if (!context) return null

    // Separar Stack de Query si existe el nuevo formato
    // Formato: "STACK:... | QUERY:..."
    const parts = context.split(' | QUERY:')
    const stackPart = parts[0].replace('STACK:', '')
    const queryPart = parts[1] || parts[0]

    // Extraer nombres de funciones del stack de PL/pgSQL
    // Formato típico: "PL/pgSQL function fn_name() line 5 at ..."
    const stackMatch = [...stackPart.matchAll(/function\s+([\w.]+)\(/g)].map(m => m[1])

    // Si no hay stack (formato viejo o consulta simple), intentar extraer de la query
    if (stackMatch.length === 0) {
        const queryMatch = queryPart.match(/public\.(\w+)/i) || queryPart.match(/FROM\s+(\w+)/i)
        if (queryMatch) stackMatch.push(queryMatch[1])
    }

    // Filtrar la función de auditoría propia de la lista si aparece
    const functions = [...new Set(stackMatch.filter(fn => fn !== 'fn_audit_trigger'))]

    if (functions.length === 0) {
        return <span className="text-[9px] text-slate-600 truncate max-w-[100px]">{queryPart.substring(0, 20)}...</span>
    }

    return (
        <div className="flex flex-col gap-1 mt-1">
            {functions.map((fn, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    <Code2 className="h-2.5 w-2.5 text-blue-400/70" />
                    <span className="font-mono">{fn}</span>
                </div>
            ))}
        </div>
    )
}

const SystemView = () => {
    const [activeTab, setActiveTab] = useState('audit')
    const [sortConfig, setSortConfig] = useState({ column: 'fecha', order: 'desc' })
    const [filterValue, setFilterValue] = useState('')
    const [rollbackStatus, setRollbackStatus] = useState({ id: null, status: 'idle' })

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

    const { data: aiSummaries, isLoading: loadingAI } = useSWR(
        activeTab === 'audit' || activeTab === 'ia' ? 'aiSummaries' : null,
        () => getAISummaries({ pageSize: 5 })
    )

    const handleRollback = async (id) => {
        if (!confirm('¿Seguro que querés deshacer este cambio?')) return
        setRollbackStatus({ id, status: 'loading' })
        try {
            const res = await rollbackLog(id)
            if (res.success) {
                alert('¡Cambio deshecho con éxito!')
                setRollbackStatus({ id: null, status: 'success' })
            } else {
                alert('Error: ' + res.error)
                setRollbackStatus({ id: null, status: 'error' })
            }
        } catch (err) {
            alert('Falló el rollback: ' + err.message)
            setRollbackStatus({ id: null, status: 'error' })
        }
    }

    const tabs = [
        { id: 'audit', label: 'Cámara de Seguridad', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'ia', label: 'Resúmenes IA', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
        { id: 'stock', label: 'Radar de Stock', icon: PackageSearch, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { id: 'n8n', label: 'Monitor n8n', icon: Terminal, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
    ]

    const auditColumns = [
        { key: 'fecha', label: 'Fecha/Hora', render: (val) => formatDate(val, true) },
        { key: 'nombre_tabla', label: 'Tabla', render: (val) => <span className="px-2 py-1 rounded bg-white/5 text-xs font-mono uppercase tracking-tighter">{val}</span> },
        {
            key: 'accion', label: 'Acción', render: (val) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${val === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                    val === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                    }`}>{val}</span>
            )
        },
        {
            key: 'resumen', label: 'Cambios', render: (_, row) => calculateDiff(row.valor_anterior, row.valor_nuevo)
        },
        {
            key: 'usuario', label: 'Origen', render: (val, row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {val === 'postgres' ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Cpu className="h-3 w-3 text-purple-400" />
                                <span className="text-purple-300 font-bold text-[10px] uppercase tracking-wider">Sistema (n8n)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-slate-500" />
                                <span className="text-slate-300">{val}</span>
                            </div>
                        )}
                    </div>
                    {row.query_context && formatQueryContext(row.query_context)}
                </div>
            )
        },
        {
            key: 'acciones', label: '', render: (_, row) => (
                <button
                    onClick={() => handleRollback(row.id)}
                    disabled={rollbackStatus.id === row.id && rollbackStatus.status === 'loading'}
                    className={`p-2 rounded-lg border transition-all hover:scale-110 active:scale-95 ${rollbackStatus.id === row.id && rollbackStatus.status === 'loading'
                        ? 'bg-slate-800 border-white/10 opacity-50 cursor-not-allowed'
                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                        }`}
                    title="Deshacer este cambio"
                >
                    <RotateCcw className={`h-3 w-3 ${rollbackStatus.id === row.id && rollbackStatus.status === 'loading' ? 'animate-spin' : ''}`} />
                </button>
            )
        }
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
                    {JSON.stringify(row.valor_anterior, null, 2)}
                </pre>
            </div>
            <div className="space-y-2">
                <div className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Valor Nuevo</div>
                <pre className="bg-slate-950/50 p-3 rounded-xl border border-white/5 overflow-x-auto text-green-300/80">
                    {JSON.stringify(row.valor_nuevo, null, 2)}
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
                    {activeTab === 'ia' && (
                        <div className="space-y-6">
                            <DailyAISummary data={aiSummaries?.data} isLoading={loadingAI} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 text-cyan-400">
                                        <Clock className="h-5 w-5" />
                                        <h4 className="font-bold tracking-tight">Historial de Resúmenes</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {aiSummaries?.data?.slice(1).map((s, i) => (
                                            <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-400">{formatDate(s.fecha)}</span>
                                                    <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                                </div>
                                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{s.contenido.substring(0, 100)}...</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl border border-blue-500/10 space-y-4">
                                    <div className="flex items-center gap-3 text-blue-400">
                                        <Database className="h-5 w-5" />
                                        <h4 className="font-bold tracking-tight">Estado del Auditor</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        El motor de IA analiza todos los cambios significativos guardados en la tabla de auditoría,
                                        filtrando el ruido técnico para ofrecerte una visión clara del negocio.
                                    </p>
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                                            <span>Cobertura</span>
                                            <span>100%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="space-y-6">
                            <DailyAISummary data={aiSummaries?.data} isLoading={loadingAI} />
                            <DataTable
                                data={(auditLogs?.data || []).filter(row => {
                                    const changes = getChanges(row.valor_anterior, row.valor_nuevo)
                                    // Si no hay cambios significativos Y no es INSERT/DELETE, ocultar
                                    return changes.length > 0 || row.accion !== 'UPDATE'
                                })}
                                columns={auditColumns}
                                isLoading={loadingAudit}
                                sortConfig={sortConfig}
                                onSort={setSortConfig}
                                filterValue={filterValue}
                                onFilterChange={setFilterValue}
                                expandableRow={renderExpandedAudit}
                            />
                        </div>
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
