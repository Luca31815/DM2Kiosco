import React, { useState, useMemo } from 'react'
import { AlertCircle, Tag, Search, EyeOff, CheckCircle2, Loader2, Sparkles, Copy, Trash2 } from 'lucide-react'
import { useSWRConfig } from 'swr'
import { toast } from 'react-hot-toast'
import * as api from '../services/api'
import { useProductosDuplicadosTrigram, useProductos, useProductosSinonimos } from '../hooks/useData'
import { checkDuplicateStatus, FLAVORS, BRANDS, FORMATS } from '../utils/duplicateRules'
import { DuplicadosHeaderBar } from './duplicados/DuplicadosHeaderBar'
import { DuplicateCard, ConflictCard } from './duplicados/DuplicadosCards'
import { performAiScan } from './duplicados/aiScanService'

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

const DuplicadosView = () => {
    const { mutate } = useSWRConfig()
    const { data: duplicadosSQL, loading: sqlLoading, ignoreDuplicate: ignoreSQL, ignoredPairs } = useProductosDuplicadosTrigram()
    // allProducts is fetched internally by useProductosDuplicadosTrigram (pageSize: 5000)
    // We still need it here for the AI scan feature
    const { data: allProducts } = useProductos({ pageSize: 5000 })
    const { data: learnedSynonyms } = useProductosSinonimos()
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
            const status = checkDuplicateStatus(d.p1, d.p2, ignoredPairs, learnedSynonyms);
            if (status.isDuplicate) {
                valid.push(d);
            } else if (status.reason && !/Ignorado|incompletos/.test(status.reason)) {
                rejected.push({ ...d, conflictReason: status.reason });
            }
        });

        // Eliminar duplicados de ID en la lista de conflictos (si ya están en la de válidos)
        const validIds = new Set(valid.map(v => `${v.p1.id}_${v.p2.id}`));
        const uniqueConflicts = rejected.filter(r => !validIds.has(`${r.p1.id}_${r.p2.id}`));

        return { duplicados: valid, conflictos: uniqueConflicts };
    }, [duplicadosSQL, aiDuplicates, ignoredPairs, learnedSynonyms]);

    const handleAiScan = () => performAiScan(allProducts, setAiDuplicates, setIsAiScanning);

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
                // Guardar Sinónimo para Aprendizaje (Regla 3)
                try {
                    await api.registrarSinonimo(deleteProduct.nombre, keepProduct.nombre)
                    console.log(`Aprendido: "${deleteProduct.nombre}" -> "${keepProduct.nombre}"`)
                    toast.success(`Sistema alimentado: "${deleteProduct.nombre}" ahora es un sinónimo de "${keepProduct.nombre}"`, { 
                        icon: '🧠',
                        duration: 3000 
                    })
                } catch (sErr) {
                    console.error('Error al registrar sinónimo de aprendizaje:', sErr)
                }

                toast.success('Fusión completada con éxito', { id: loadingToast })
                
                // Actualizar listas locales
                mutate(key => Array.isArray(key) && key[0] === 'productos')
                
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

    const filteredDuplicados = useMemo(() => duplicados.filter(d => {
        const name1 = d.p1?.nombre || '';
        const name2 = d.p2?.nombre || '';
        return name1.toLowerCase().includes(searchTerm.toLowerCase()) ||
               name2.toLowerCase().includes(searchTerm.toLowerCase())
    }), [duplicados, searchTerm])

    const filteredConflictos = useMemo(() => conflictos.filter(c => {
        const n1 = c.p1.nombre.toLowerCase();
        const n2 = c.p2.nombre.toLowerCase();
        return n1.includes(searchTerm.toLowerCase()) || n2.includes(searchTerm.toLowerCase());
    }), [conflictos, searchTerm])





    return (
        <div className="space-y-8">
            <DuplicadosHeaderBar
                handleAiScan={handleAiScan}
                isAiScanning={isAiScanning}
                aiDuplicatesLength={aiDuplicates.length}
                handleCopyAiReport={handleCopyAiReport}
                handleCleanup={handleCleanup}
                duplicadosCount={duplicados.length}
            />

            {/* Tabs de Selección */}
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-full sm:w-fit">
                <button type="button"
                    onClick={() => setActiveTab('sugerencias')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[44px] ${activeTab === 'sugerencias' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Sugerencias ({duplicados.length})
                </button>
                <button type="button"
                    onClick={() => setActiveTab('conflictos')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[44px] ${activeTab === 'conflictos' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <EyeOff className="h-4 w-4" />
                    Conflictos ({conflictos.length})
                </button>
            </div>

            {/* Búsqueda */}
            <div className="bg-slate-900 p-4 rounded-2xl flex items-center gap-4 border border-white/5">
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
                filteredConflictos.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 font-medium">
                        No se detectaron conflictos activos para esta búsqueda.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredConflictos.map((c) => {
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
        </div>
    );
};

export default DuplicadosView;
