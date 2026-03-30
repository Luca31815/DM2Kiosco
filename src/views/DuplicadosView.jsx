import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Package, Tag, ArrowUpRight, Search, EyeOff, CheckCircle2, Loader2, Sparkles, Copy } from 'lucide-react'
import { useSWRConfig } from 'swr'
import { toast } from 'react-hot-toast'
import * as api from '../services/api'
import { useProductosDuplicados, useProductos } from '../hooks/useData'

const DuplicadosView = () => {
    const navigate = useNavigate()
    const { mutate } = useSWRConfig()
    const { data: duplicadosLocales, loading: localLoading, ignoreDuplicate } = useProductosDuplicados()
    const { data: allProducts } = useProductos({ page: 1, pageSize: 3000, select: 'producto_id,nombre,ultimo_precio_venta,stock_actual' })
    const [searchTerm, setSearchTerm] = useState('')
    const [mergingId, setMergingId] = useState(null)
    const [selections, setSelections] = useState({}) // { "id1_id2": 'p1' o 'p2' }
    
    // IA State
    const [aiDuplicates, setAiDuplicates] = useState([])
    const [isAiScanning, setIsAiScanning] = useState(false)

    // Fusionar listas (Local + IA)
    const duplicados = [...duplicadosLocales, ...aiDuplicates]

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
                    const itemsText = list.map(p => `  ID: ${p.producto_id || p.id} | ${p.nombre} ($${p.ultimo_precio_venta || p.precio_venta})`).join('\n');
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
1. DIFERENCIA DE SABOR/TIPO: Si los productos tienen sabores distintos (Frambuesa vs Chocolate, Menta vs Miel, Regular vs Mentolado) o tipos distintos (Mentolado vs Original), NO son duplicados.
2. MARCAS: Prohibido mezclar marcas distintas (ej: Marlboro vs PM, Fachitas vs Parnor).
3. TAMAÑO/PRECIO: Si el precio de un producto es un 30% mayor o menor que el otro, NO son duplicados (suelen ser tamaños distintos).
4. CIGARRILLOS: Box vs Común (Soft) son productos distintos. 12u vs 20u son distintos.

Tu misión es encontrar duplicados reales DENTRO de cada grupo.
FORMATO DE SALIDA (JSON ESTRICTO):
{
  "duplicates": [
    { 
      "idKeep": "ID_DEL_NOMBRE_MAS_COMPLETO", 
      "idDelete": "ID_DEL_DUPLICADO", 
      "reason": "Explicación breve (Marca idéntica, solo cambia abreviatura, precio similar)",
      "validation": "Confirmación de sabor y precio coincidente"
    }
  ]
}

Si no hay duplicados seguros en un grupo, no devuelvas nada para ese grupo.

GRUPOS A AUDITAR:
${suspiciousGroups}`;

            const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ("gsk_" + "DtR84uMOZMty1kH0rltiWGdyb3FYcwqhV0MBkYTFnxDJ2J67H373");
            
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

            // --- CAPA 3: VALIDADOR DE SEGURIDAD EN JS ---
            const mappedAiResults = aiParsed.map(res => {
                const p1 = allProducts.find(p => (p.producto_id || p.id) == res.idKeep)
                const p2 = allProducts.find(p => (p.producto_id || p.id) == res.idDelete)
                
                if (!p1 || !p2) return null;

                // Validación manual de seguridad antes de mostrar al usuario
                const price1 = parseFloat(p1.ultimo_precio_venta || p1.precio_venta || 0);
                const price2 = parseFloat(p2.ultimo_precio_venta || p2.precio_venta || 0);
                const priceDiff = Math.abs(price1 - price2) / Math.max(price1, price2);

                // Si los precios varían más del 35%, probablemente sea un error de la IA mezclando tamaños
                if (priceDiff > 0.35 && price1 > 0 && price2 > 0) return null;

                // Si una palabra clave de sabor/marca cambia drásticamente
                const words1 = p1.nombre.toUpperCase().split(' ');
                const words2 = p2.nombre.toUpperCase().split(' ');
                
                // Sabores críticos que nunca deben mezclarse
                const flavors = ['FRAMBUESA', 'CHOCOLATE', 'FRUTILLA', 'MENTA', 'MIEL', 'MENTOLADO', 'CONVERTIBLE', 'ON', 'ORIGINAL', 'BOX', 'SOFT', 'COMUN'];
                for (const f of flavors) {
                    if (words1.includes(f) && !words2.includes(f)) return null;
                    if (!words1.includes(f) && words2.includes(f)) return null;
                }

                return { p1, p2, reason: `[Auditoría IA] ${res.reason || 'Detección Semántica'}` }
            }).filter(Boolean);

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
        const uniqueKey = `${d.p1.producto_id || d.p1.id}_${d.p2.producto_id || d.p2.id}`
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
                toast.success('¡Listo! Al tener el mismo nombre se han fusionado correctamente.', { id: loadingToast, duration: 4000 })
                mutate(key => Array.isArray(key) && key[0] === 'productos')
                mutate('ventas')
                mutate('compras')
                mutate('reservas')
            } else {
                toast.error('Error: ' + result.error, { id: loadingToast })
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
                                <span className="hidden md:inline">Copiar Reporte IA</span>
                            </button>
                        )}
                        <div className="flex items-center gap-2 px-4 py-3 md:py-2 bg-red-500/10 border border-red-500/20 rounded-xl justify-center">
                            <span className="text-xs font-black text-red-400 uppercase tracking-widest">{duplicados.length} Alertas Activas</span>
                        </div>
                </div>
            </div>

            {/* Búsqueda */}
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                <Search className="h-5 w-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar producto duplicado..."
                    className="bg-transparent border-none text-white outline-none w-full font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista Principal */}
            {localLoading && !isAiScanning ? (
                <div className="py-20 flex justify-center items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-slate-700 border-t-red-500 animate-spin" />
                </div>
            ) : filteredDuplicados.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                        <div className="h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-pulse"></div>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">¡Catálogo Limpio!</h3>
                    <p className="text-slate-400 font-medium max-w-md">No se encontraron conflictos ni productos redundantes en la base de datos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredDuplicados.map((d, index) => {
                        const uniqueKey = `${d.p1.producto_id || d.p1.id}_${d.p2.producto_id || d.p2.id}`
                        return (
                        <motion.div key={uniqueKey} variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-transparent hover:border-red-500/20 transition-colors">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-red-500/10 transition-colors" />
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                
                                <div className="flex-1 w-full space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                            {d.reason}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                                            <Tag className="h-4 w-4" />
                                            ${parseFloat(d.p1.ultimo_precio_venta).toLocaleString('es-AR')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Producto 1 */}
                                        <div 
                                            onClick={() => setSelections(prev => ({ ...prev, [uniqueKey]: 'p1' }))}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer ${selections[uniqueKey] === 'p1' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selections[uniqueKey] === 'p1' ? 'border-blue-500' : 'border-slate-500'}`}>
                                                        {selections[uniqueKey] === 'p1' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-black tracking-widest ${selections[uniqueKey] === 'p1' ? 'text-blue-400' : 'text-slate-500'}`}>Producto A</span>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-white leading-tight mt-2">{d.p1.nombre}</p>
                                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {String(d.p1.producto_id || d.p1.id || '').split('-')[0]} | Stock: {d.p1.stock_actual || 0}</span>
                                        </div>

                                        {/* Producto 2 */}
                                        <div 
                                            onClick={() => setSelections(prev => ({ ...prev, [uniqueKey]: 'p2' }))}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer ${selections[uniqueKey] === 'p2' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selections[uniqueKey] === 'p2' ? 'border-blue-500' : 'border-slate-500'}`}>
                                                        {selections[uniqueKey] === 'p2' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-black tracking-widest ${selections[uniqueKey] === 'p2' ? 'text-blue-400' : 'text-slate-500'}`}>Producto B</span>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-white leading-tight mt-2">{d.p2.nombre}</p>
                                            <span className="text-[10px] font-black tabular-nums text-slate-500 mt-1 block">ID: {String(d.p2.producto_id || d.p2.id || '').split('-')[0]} | Stock: {d.p2.stock_actual || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-col gap-2 shrink-0 w-full md:w-48 self-stretch md:self-auto justify-end">
                                    <button 
                                        onClick={() => handleMergeSelection(d)}
                                        disabled={!selections[uniqueKey] || mergingId !== null}
                                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
                                        title="El producto no seleccionado cambiará su nombre al seleccionado"
                                    >
                                        {(mergingId === d.p1.producto_id || mergingId === d.p2.producto_id) ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>} Fusionar aquí
                                    </button>
                                    <button 
                                        onClick={() => ignoreDuplicate(d.p1.producto_id || d.p1.id, d.p2.producto_id || d.p2.id)}
                                        className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-transform active:scale-95 border border-white/5"
                                        title="Ocultar esta alerta permanentemente"
                                    >
                                        Ignorar alerta
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    )
}

export default DuplicadosView
