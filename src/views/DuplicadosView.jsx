import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Package, Tag, ArrowUpRight, Search, EyeOff, CheckCircle2, Loader2, Sparkles, Copy, Trash2, RefreshCcw } from 'lucide-react'
import { useSWRConfig } from 'swr'
import { toast } from 'react-hot-toast'
import * as api from '../services/api'
import { useProductosDuplicadosTrigram, useProductos } from '../hooks/useData'
import { useMemo } from 'react'
import { checkDuplicateStatus } from '../utils/duplicateRules'

const DuplicadosView = () => {
    const navigate = useNavigate()
    const { mutate } = useSWRConfig()
    const { data: duplicadosSQL, loading: sqlLoading, ignoreDuplicate: ignoreSQL, ignoredPairs } = useProductosDuplicadosTrigram()
    const { data: allProducts } = useProductos({ pageSize: 5000 })
    const [searchTerm, setSearchTerm] = useState('')
    const [mergingId, setMergingId] = useState(null)
    const [selections, setSelections] = useState({}) // { "id1_id2": 'p1' o 'p2' }
    const [activeTab, setActiveTab] = useState('sugerencias') // 'sugerencias' o 'conflictos'
    
    // IA State
    const [aiDuplicates, setAiDuplicates] = useState([])
    const [isAiScanning, setIsAiScanning] = useState(false)

    // Fusionar listas (SQL Trigrams + IA) y separar por estado de validación
    const { duplicados, conflictos } = useMemo(() => {
        const combined = [...duplicadosSQL, ...aiDuplicates];
        
        const valid = [];
        const rejected = [];

        combined.forEach(d => {
            const status = checkDuplicateStatus(d.p1, d.p2, ignoredPairs);
            if (status.isDuplicate) {
                valid.push(d);
            } else if (status.reason && !status.reason.includes("Ignorado") && !status.reason.includes("incompletos")) {
                rejected.push({ ...d, conflictReason: status.reason });
            }
        });

        // Eliminar duplicados de ID en la lista de conflictos (si ya están en la de válidos)
        const validIds = new Set(valid.map(v => `${v.p1.id}_${v.p2.id}`));
        const uniqueConflicts = rejected.filter(r => !validIds.has(`${r.p1.id}_${r.p2.id}`));

        return { duplicados: valid, conflictos: uniqueConflicts };
    }, [duplicadosSQL, aiDuplicates, ignoredPairs]);

    const handleAiScan = async () => {
        if (!allProducts || allProducts.length === 0) return toast.error('El catálogo aún no cargó');
        
        setIsAiScanning(true);
        const loadingToast = toast.loading('Analizando el catálogo completo con la Inteligencia Artificial (Groq Llama-3.3)...');
        
        try {
            // --- CAPA 1: PRE-FILTRADO LOCAL (Filtro Anti-Mareo) ---
            // Agrupamos productos por las primeras 2 palabras para reducir ruido
            const groups = {};
            allProducts.forEach(p => {
                const words = p.nombre?.trim().split(/\s+/) || [];
                const key = words.slice(0, 2).join(' ').toUpperCase();
                if (!groups[key]) groups[key] = [];
                groups[key].push(p);
            });

            // Solo enviamos grupos que tengan más de un producto (sospechosos)
            const suspiciousGroups = Object.entries(groups)
                .filter(([_, list]) => list.length > 1)
                .map(([name, list]) => {
                    const itemsText = list.map(p => `  ID: ${p.producto_id || p.id} | ${p.nombre} (Venta: $${p.ultimo_precio_venta || p.precio_venta || 0} | Costo: $${p.ultimo_costo_compra || 0})`).join('\n');
                    return `### GRUPO SOSPECHOSO: ${name}\n${itemsText}`;
                })
                .join('\n\n');

            if (!suspiciousGroups) {
                toast.success('No se detectaron grupos sospechosos para auditar.', { id: loadingToast });
                setIsAiScanning(false);
                return;
            }

            const prompt = `Actúa como un Auditor de Inventario Senior para Kioscos Argentinos.
Analiza los siguientes GRUPOS SOSPECHOSOS de productos duplicados.

PROHIBICIONES ABSOLUTAS (Si las rompes, la sugerencia es INVÁLIDA):
1. SABORES/VARIANTES: Si comparten un atributo (ej: Original) pero uno tiene otro que el segundo no tiene y viceversa (ej: Original Comun vs Original Box), NO son duplicados. Pero si uno es una versión más simple del otro (ej: Fanta vs Fanta Naranja), SÍ pueden serlo.
2. SINÓNIMOS: En alfajores, "NEGRO" y "CHOCOLATE" son lo mismo. En cigarrillos, "MENTOLADO" y "CONVERTIBLE" son lo mismo.
3. MARCAS: Prohibido mezclar marcas distintas. Si uno tiene marca y el otro es genérico, SÍ pueden ser duplicados.
4. ESTRUCTURA/CAPAS: Solo descarta contradicciones directas (Simple vs Triple). Si uno es Triple y el otro es genérico, trátalo como duplicado probable.
5. PRECIOS/COSTOS: Si uno tiene venta $0 pero el costo coincide (error < 5%), es un duplicado probable.
6. REGLA DE ORO (MAGNITUDES): Diferencias numéricas (12u vs 20u, 500ml vs 1L, 100g vs 150g) definen productos distintos.

Tu misión es encontrar duplicados reales DENTRO de cada grupo.
FORMATO DE SALIDA (JSON ESTRICTO):
{
  "duplicates": [
    { 
      "idKeep": "ID_DEL_NOMBRE_MAS_COMPLETO", 
      "idDelete": "ID_DEL_DUPLICADO", 
      "reason": "Explicación breve (Marca idéntica, abreviatura, precio/costo similar)",
      "validation": "Confirmación de sabor y precios (venta/costo) coincidentes"
    }
  ]
}

Si no hay duplicados seguros en un grupo, no devuelvas nada para ese grupo.

GRUPOS A AUDITAR:
${suspiciousGroups}`;

            const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
            
            if (!GROQ_KEY) {
                throw new Error("No se encontró la API Key de Groq (VITE_GROQ_API_KEY) en las variables de entorno.");
            }

            const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });

            const jsonResponse = await response.json();
            if (jsonResponse.error) throw new Error(jsonResponse.error.message);

            const textResult = jsonResponse.choices[0].message.content;
            let aiParsed = JSON.parse(textResult);

            if (aiParsed.duplicates) aiParsed = aiParsed.duplicates;
            if (!Array.isArray(aiParsed)) aiParsed = [];

            const mappedAiResults = aiParsed.map(res => {
                const p1 = allProducts.find(p => (p.producto_id || p.id) == res.idKeep)
                const p2 = allProducts.find(p => (p.producto_id || p.id) == res.idDelete)
                if (!p1 || !p2) return null;
                return { p1, p2, reason: `[Auditoría IA] ${res.reason || 'Detección Semántica'}` }
            }).filter(Boolean);

            // El filtrado por ignoredPairs y por isLikelyDuplicate se hace ahora en el useMemo global
            setAiDuplicates(mappedAiResults);
            
            if (mappedAiResults.length > 0) {
                toast.success(`La IA encontró ${mappedAiResults.length} duplicados ocultos usando contexto semántico.`, { id: loadingToast, duration: 6000 });
            } else {
                toast.success('La IA determinó que tu inventario está impecable. No hay más duplicados.', { id: loadingToast, duration: 5000 });
            }

        } catch (error) {
            console.error("Detalle completo del error IA:", error);
            toast.error(`Fallo IA: ${error.message}`, { id: loadingToast, duration: 8000 });
        } finally {
            setIsAiScanning(false);
        }
    }

    const handleMergeSelection = async (d) => {
        const id1 = String(d.p1.producto_id || d.p1.id || '');
        const id2 = String(d.p2.producto_id || d.p2.id || '');
        const uniqueKey = `${id1}_${id2}`
        const selectedKey = selections[uniqueKey]
        if (!selectedKey) {
            toast.error('Por favor, selecciona cuál de los dos nombres querés dejar como principal.');
            return;
        }

        const keepProduct = selectedKey === 'p1' ? d.p1 : d.p2;
        const deleteProduct = selectedKey === 'p1' ? d.p2 : d.p1;

        if (!confirm(`¿Confirmás que querés que el producto duplicado pase a llamarse "${keepProduct.nombre}"? Esto hará exactamente la misma fusión que la pantalla de inventario.`)) {
            return;
        }

        const dataToSend = {
            producto_id: deleteProduct.producto_id || deleteProduct.id,
            nombre: keepProduct.nombre?.trim().toUpperCase(),
            ultimo_precio_venta: parseFloat(deleteProduct.ultimo_precio_venta || 0),
            ultimo_costo_compra: parseFloat(deleteProduct.ultimo_costo_compra || 0),
            stock_actual: parseInt(deleteProduct.stock_actual || 0)
        }

        const loadingToast = toast.loading(`Renombrando para fusionar con "${keepProduct.nombre}"...`)
        setMergingId(deleteProduct.producto_id || deleteProduct.id)
        
        try {
            const result = await api.actualizarProducto(dataToSend)
            if (result.success) {
                toast.success(result.mensaje || '¡Listo! Al tener el mismo nombre se han fusionado correctamente.', { id: loadingToast, duration: 4000 })
                mutate(key => Array.isArray(key) && key[0] === 'productos')
                mutate('ventas')
                mutate('compras')
                mutate('reservas')

                // Filtrar localmente de la lista de la IA para desaparecer de inmediato
                setAiDuplicates(prev => prev.filter(item => {
                    const currentId1 = String(item.p1.producto_id || item.p1.id);
                    const currentId2 = String(item.p2.producto_id || item.p2.id);
                    return !(
                        (currentId1 === id1 && currentId2 === id2) || 
                        (currentId1 === id2 && currentId2 === id1)
                    );
                }));
            } else {
                toast.error('Error al fusionar: ' + (result.error || 'Desconocido'), { id: loadingToast, duration: 5000 })
            }
        } catch (error) {
            toast.error('Error de red: ' + (error.message || 'Desconocido'), { id: loadingToast })
        } finally {
            setMergingId(null)
        }
    }

    const handleCopyAiReport = () => {
        if (!aiDuplicates || aiDuplicates.length === 0) {
            toast.error('No hay resultados de la IA para copiar.');
            return;
        }

        const report = aiDuplicates.map(d => {
            return `---
REGLA/RAZÓN: ${d.reason}
Producto 1: [${d.p1.producto_id || d.p1.id}] ${d.p1.nombre} ($${d.p1.ultimo_precio_venta || d.p1.precio_venta})
Producto 2: [${d.p2.producto_id || d.p2.id}] ${d.p2.nombre} ($${d.p2.ultimo_precio_venta || d.p2.precio_venta})`
        }).join('\n\n');

        navigator.clipboard.writeText(report).then(() => {
            toast.success('Reporte copiado al portapapeles. Pegalo en el chat para que el soporte pueda corregirlo.');
        }).catch(err => {
            console.error('Error al copiar:', err);
            toast.error('Error al copiar al portapapeles.');
        });
    }

    const handleCleanup = async () => {
        if (!confirm('¿Estás seguro de que querés limpiar el catálogo? Se eliminarán permanentemente todos los productos que NO tengan ninguna venta, compra ni reserva registrada.')) {
            return;
        }

        const loadingToast = toast.loading('Buscando y eliminando productos huérfanos...');
        try {
            const result = await api.cleanupOrphanedProducts();
            if (result.success) {
                if (result.count > 0) {
                    toast.success(`¡Limpieza completada! Se eliminaron ${result.count} productos que no tenían uso.`, { id: loadingToast, duration: 5000 });
                    mutate(key => Array.isArray(key) && key[0] === 'productos');
                } else {
                    toast.success('No se encontraron productos huérfanos para eliminar. ¡Tu catálogo está impecable!', { id: loadingToast, duration: 5000 });
                }
            } else {
                toast.error('Error al limpiar: ' + result.error, { id: loadingToast });
            }
        } catch (error) {
            toast.error('Error de red: ' + error.message, { id: loadingToast });
        }
    }

    const filteredDuplicados = duplicados.filter(d => {
        const name1 = d.p1?.nombre || '';
        const name2 = d.p2?.nombre || '';
        return name1.toLowerCase().includes(searchTerm.toLowerCase()) || 
               name2.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                        Incidencias de Catálogo
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Análisis de posibles productos duplicados o redundantes.</p>
                </div>
                {/* Contadores y Botón IA */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <button 
                        onClick={handleAiScan}
                        disabled={isAiScanning}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-95 disabled:opacity-50"
                    >
                        {isAiScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        <span className="hidden md:inline">Auditoría IA</span>
                        <span className="md:hidden">IA</span>
                    </button>
                    {aiDuplicates.length > 0 && (
                        <button 
                            onClick={handleCopyAiReport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all active:scale-95"
                            title="Copiar reporte técnico para soporte"
                        >
                            <Copy className="h-5 w-5" />
                        </button>
                    )}
                    <button 
                        onClick={handleCleanup}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-red-400 rounded-xl font-bold transition-all active:scale-95"
                        title="Eliminar productos que no tienen ventas, compras ni reservas"
                    >
                        <Trash2 className="h-5 w-5" />
                        <span className="hidden md:inline">Limpiar Huérfanos</span>
                    </button>
                    <div className="flex items-center gap-2 px-4 py-3 md:py-2 bg-red-500/10 border border-red-500/20 rounded-xl justify-center">
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">{duplicados.length} Alertas</span>
                       {/* Tabs de Selección */}
            <div className="flex items-center gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('sugerencias')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'sugerencias' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Sugerencias ({duplicados.length})
                </button>
                <button
                    onClick={() => setActiveTab('conflictos')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'conflictos' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <EyeOff className="h-4 w-4" />
                    Conflictos Detectados ({conflictos.length})
                </button>
            </div>

            {/* Búsqueda */}
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                <Search className="h-5 w-5 text-slate-500" />
                <input
                    type="text"
                    placeholder={`Buscar en ${activeTab === 'sugerencias' ? 'sugerencias' : 'conflictos'}...`}
                    className="bg-transparent border-none text-white outline-none w-full font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista Principal */}
            {sqlLoading && !isAiScanning ? (
                <div className="py-20 flex justify-center items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-slate-700 border-t-red-500 animate-spin" />
                </div>
            ) : (activeTab === 'sugerencias' ? (
                filteredDuplicados.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 font-medium">
                        No hay sugerencias que coincidan con la búsqueda.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredDuplicados.map((d) => {
                            const id1 = String(d.p1.producto_id || d.p1.id || '');
                            const id2 = String(d.p2.producto_id || d.p2.id || '');
                            const uniqueKey = `${id1}_${id2}`;
                            return (
                                <DuplicateCard 
                                    key={uniqueKey} 
                                    d={d} 
                                    uniqueKey={uniqueKey} 
                                    selections={selections}
                                    setSelections={setSelections}
                                    handleMergeSelection={handleMergeSelection}
                                    ignoreSQL={ignoreSQL}
                                    setAiDuplicates={setAiDuplicates}
                                    mergingId={mergingId}
                                    variants={itemVariants}
                                />
                            );
                        })}
                    </div>
                )
            ) : (
                conflictos.filter(c => {
                    const n1 = c.p1.nombre.toLowerCase();
                    const n2 = c.p2.nombre.toLowerCase();
                    return n1.includes(searchTerm.toLowerCase()) || n2.includes(searchTerm.toLowerCase());
                }).length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 font-medium">
                        No se detectaron conflictos activos para esta búsqueda.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {conflictos.filter(c => {
                            const n1 = c.p1.nombre.toLowerCase();
                            const n2 = c.p2.nombre.toLowerCase();
                            return n1.includes(searchTerm.toLowerCase()) || n2.includes(searchTerm.toLowerCase());
                        }).map((c) => {
                            const id1 = String(c.p1.producto_id || c.p1.id || '');
                            const id2 = String(c.p2.producto_id || c.p2.id || '');
                            const uniqueKey = `conflict_${id1}_${id2}`;
                            return (
                                <ConflictCard 
                                    key={uniqueKey} 
                                    d={c} 
                                    variants={itemVariants}
                                    ignoreSQL={ignoreSQL}
                                />
                            );
                        })}
                    </div>
                )
            ))}
        </motion.div>
    );
};

const DuplicateCard = ({ d, uniqueKey, selections, setSelections, handleMergeSelection, ignoreSQL, setAiDuplicates, mergingId, variants }) => {
    const id1 = String(d.p1.producto_id || d.p1.id || '');
    const id2 = String(d.p2.producto_id || d.p2.id || '');

    return (
        <motion.div variants={variants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-transparent hover:border-red-500/20 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-red-500/10 transition-colors" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                            {d.reason || 'Sugerencia de Fusión'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                            <Tag className="h-4 w-4" />
                            ${parseFloat(d.p1.ultimo_precio_venta || d.p1.precio_venta || 0).toLocaleString('es-AR')}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            onClick={() => setSelections(prev => ({ ...prev, [uniqueKey]: 'p1' }))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${selections[uniqueKey] === 'p1' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                            <p className="text-lg font-bold text-white leading-tight mt-2">{d.p1.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {id1.split('-')[0]} | Stock: {d.p1.stock_actual || 0}</span>
                        </div>
                        <div 
                            onClick={() => setSelections(prev => ({ ...prev, [uniqueKey]: 'p2' }))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${selections[uniqueKey] === 'p2' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                            <p className="text-lg font-bold text-white leading-tight mt-2">{d.p2.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {id2.split('-')[0]} | Stock: {d.p2.stock_actual || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full md:w-48 self-stretch md:self-auto justify-end">
                    <button 
                        onClick={() => handleMergeSelection(d)}
                        disabled={!selections[uniqueKey] || mergingId !== null}
                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        {(mergingId === d.p1.producto_id || mergingId === d.p2.producto_id) ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>} Fusionar aquí
                    </button>
                    <button 
                        onClick={() => {
                            ignoreSQL(id1, id2);
                            setAiDuplicates(prev => prev.filter(item => {
                                const cId1 = String(item.p1.producto_id || item.p1.id);
                                const cId2 = String(item.p2.producto_id || item.p2.id);
                                return !((cId1 === id1 && cId2 === id2) || (cId1 === id2 && cId2 === id1));
                            }));
                        }}
                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-transform active:scale-95 border border-white/5"
                    >
                        Ignorar alerta
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ConflictCard = ({ d, variants, ignoreSQL }) => {
    const id1 = String(d.p1.producto_id || d.p1.id || '');
    const id2 = String(d.p2.producto_id || d.p2.id || '');

    return (
        <motion.div variants={variants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-transparent hover:border-amber-500/20 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-2">
                            <EyeOff className="h-3 w-3" />
                            Conflicto Detectado
                        </div>
                        <span className="text-slate-400 text-sm font-medium italic">
                            {d.conflictReason}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-lg font-bold text-white leading-tight">{d.p1.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">Venta: ${parseFloat(d.p1.ultimo_precio_venta || d.p1.precio_venta || 0).toLocaleString()}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-lg font-bold text-white leading-tight">{d.p2.nombre}</p>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">Venta: ${parseFloat(d.p2.ultimo_precio_venta || d.p2.precio_venta || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full md:w-48 self-stretch md:self-auto justify-end">
                    <button 
                        onClick={() => ignoreSQL(id1, id2)}
                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-transform active:scale-95 border border-white/5"
                    >
                        Ignorar Conflicto
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default DuplicadosView;
