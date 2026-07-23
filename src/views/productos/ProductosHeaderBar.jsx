import React from 'react'
import { Package, Loader2, DollarSign, FileText, PackagePlus, Trash2, Bookmark, Filter } from 'lucide-react'

const CATEGORIAS_DISPONIBLES = [
    'ALMACEN',
    'BEBIDAS',
    'CIGARRILLOS',
    'FARMACIA',
    'GALLETITAS',
    'GOLOSINAS',
    'LACTEOS',
    'SNACKS',
    'SIN_CATEGORIA'
]

const SUBCATEGORIAS_DISPONIBLES = {
    BEBIDAS: ['GASEOSA', 'ALCOHOL', 'GENERAL'],
    GOLOSINAS: ['CHOCOLATE', 'ALFAJOR', 'GOLOSINA', 'GENERAL'],
    FARMACIA: ['FARMACIA', 'HIGIENE', 'GENERAL'],
    ALMACEN: ['GENERAL'],
    CIGARRILLOS: ['CIGARRILLOS', 'GENERAL'],
    GALLETITAS: ['GALLETITAS', 'GENERAL'],
    LACTEOS: ['LACTEOS', 'GENERAL'],
    SNACKS: ['SNACKS', 'GENERAL']
}

export const ProductosHeaderBar = ({
    handleSyncPrecios,
    handleExportPDF,
    handleSyncFaltantes,
    handleCleanup,
    setIsSynonymModalOpen,
    loadingStates,
    selectedCategoria = '',
    setSelectedCategoria,
    selectedSubcategoria = '',
    setSelectedSubcategoria
}) => {
    const { isSyncingPrecios = false, isExporting = false, isSyncing = false, isCleaning = false } = loadingStates ?? {}
    
    const subcats = selectedCategoria && SUBCATEGORIAS_DISPONIBLES[selectedCategoria] 
        ? SUBCATEGORIAS_DISPONIBLES[selectedCategoria] 
        : []

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Package className="h-8 w-8 md:h-10 md:w-10 text-amber-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Inventario
                        </span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1 text-sm">Gestión de productos, precios y stock inteligente por categorías.</p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button type="button"
                        onClick={handleSyncPrecios}
                        disabled={isSyncingPrecios}
                        className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                        title="Actualiza los precios de venta y compra según las últimas operaciones registradas"
                    >
                        {isSyncingPrecios ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} className="group-hover:scale-110 transition-transform" />}
                        <span className="hidden xs:inline sm:inline">{isSyncingPrecios ? '...' : 'Precios'}</span>
                    </button>
                    <button type="button"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                        title="Exportar la lista actual de productos a PDF"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} className="group-hover:scale-110 transition-transform" />}
                        <span>{isExporting ? '...' : 'PDF'}</span>
                    </button>
                    <button type="button"
                        onClick={handleSyncFaltantes}
                        disabled={isSyncing}
                        className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                        title="Busca todos los productos en Ventas, Compras y Reservas y agrega los que faltan al catálogo"
                    >
                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <PackagePlus size={14} className="group-hover:scale-110 transition-transform" />}
                        <span>{isSyncing ? '...' : 'Sync'}</span>
                    </button>
                    <button type="button"
                        onClick={handleCleanup}
                        disabled={isCleaning}
                        className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                    >
                        {isCleaning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} className="group-hover:scale-110 transition-transform" />}
                        <span>{isCleaning ? '...' : 'Limpiar'}</span>
                    </button>
                    
                    <button type="button"
                        onClick={() => setIsSynonymModalOpen(true)}
                        className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                        title="Gestionar el diccionario de sinónimos y resolver conflictos de nombres"
                    >
                        <Bookmark className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span>Dic.</span>
                    </button>
                </div>
            </div>

            {/* Filtros de Categoría y Subcategoría */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider px-2">
                    <Filter className="h-3.5 w-3.5 text-amber-400" />
                    <span>Filtro Rubro:</span>
                </div>
                
                <select
                    value={selectedCategoria}
                    onChange={(e) => {
                        if (setSelectedCategoria) setSelectedCategoria(e.target.value)
                        if (setSelectedSubcategoria) setSelectedSubcategoria('')
                    }}
                    className="bg-slate-800 text-xs font-bold text-white px-3 py-2 rounded-xl border border-white/10 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                    <option value="">Todas las Categorías</option>
                    {CATEGORIAS_DISPONIBLES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                {subcats.length > 0 && (
                    <select
                        value={selectedSubcategoria}
                        onChange={(e) => setSelectedSubcategoria && setSelectedSubcategoria(e.target.value)}
                        className="bg-slate-800 text-xs font-bold text-slate-300 px-3 py-2 rounded-xl border border-white/10 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                        <option value="">Todas las Subcategorías</option>
                        {subcats.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                )}

                {(selectedCategoria || selectedSubcategoria) && (
                    <button
                        type="button"
                        onClick={() => {
                            if (setSelectedCategoria) setSelectedCategoria('')
                            if (setSelectedSubcategoria) setSelectedSubcategoria('')
                        }}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 rounded-lg transition-colors"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    )
}
