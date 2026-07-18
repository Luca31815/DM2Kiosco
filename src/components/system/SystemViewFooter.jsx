import React from 'react'
import { Database, Terminal, PackageSearch } from 'lucide-react'

export const SystemViewFooter = () => {
    return (
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
    )
}
