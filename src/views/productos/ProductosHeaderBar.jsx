import React from 'react'
import { Package, Loader2, DollarSign, FileText, PackagePlus, Trash2, Bookmark } from 'lucide-react'

export const ProductosHeaderBar = ({
    handleSyncPrecios,
    isSyncingPrecios,
    handleExportPDF,
    isExporting,
    handleSyncFaltantes,
    isSyncing,
    handleCleanup,
    isCleaning,
    setIsSynonymModalOpen
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                    <Package className="h-8 w-8 md:h-10 md:w-10 text-amber-500" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                        Inventario
                    </span>
                </h2>
                <p className="text-slate-400 font-medium mt-1 text-sm">Gestión de productos, precios y stock inteligente.</p>
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
    )
}
