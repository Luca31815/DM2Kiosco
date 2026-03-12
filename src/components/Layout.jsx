import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { Menu, Search, Command } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import CommandPalette from './CommandPalette'
import { useAuth } from '../context/AuthContext'

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <div className="flex bg-slate-950 min-h-screen relative overflow-hidden font-outfit">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-mesh" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-mesh" style={{ animationDelay: '-10s' }} />
            </div>

            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
            }} />

            <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10">
                {/* Top Bar for Toggle */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 mr-4 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <LogoTrigger />
                    </div>

                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/10 transition-all active:scale-95 group"
                    >
                        <Search className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium pr-8">Buscar...</span>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-white/5 text-[10px] font-black uppercase">
                            <Command className="h-3 w-3" /> K
                        </div>
                    </button>
                </div>

                <div className="p-4 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-16">
                        {children}
                    </div>
                </div>

                {/* Status Badge - Only visible when Live */}
                <AuthBadge />
            </main>
        </div>
    )
}

const LogoTrigger = () => {
    const [clicks, setClicks] = useState(0)
    const { isDemoMode } = useAuth()

    useEffect(() => {
        if (clicks === 0) return
        const timer = setTimeout(() => setClicks(0), 2000)
        return () => clearTimeout(timer)
    }, [clicks])

    const handleClick = () => {
        if (!isDemoMode) return
        const newClicks = clicks + 1
        if (newClicks >= 5) {
            setClicks(0)
            const key = prompt('Introduce la Clave Maestra para autorizar este dispositivo:')
            if (key) {
                window.location.search = `?admin=${encodeURIComponent(key)}`
            }
        } else {
            setClicks(newClicks)
        }
    }

    return (
        <div onClick={handleClick} className="flex items-center gap-3 cursor-default select-none">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">DM2Kiosco</h1>
        </div>
    )
}

const AuthBadge = () => {
    const { isDemoMode } = useAuth();
    if (isDemoMode) {
        // En modo demo, si hay un 'admin' en la URL, lo limpiamos para que no quede expuesto
        useEffect(() => {
            const url = new URL(window.location.href);
            if (url.searchParams.has('admin')) {
                url.searchParams.delete('admin');
                window.history.replaceState({}, '', url.toString());
            }
        }, []);
        return null;
    }

    // Modo Live: mostramos el badge y la función de Lock
    const handleLock = () => {
        if (confirm('¿Querés BLOQUEAR el dashboard y volver al modo restringido?')) {
            window.location.search = '?logout=true';
        }
    };

    return (
        <div
            onClick={handleLock}
            className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full border border-green-500/20 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-lg backdrop-blur-md bg-green-500/10 text-green-500 hover:bg-green-500/20 group"
        >
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-green-500" />
                <span>Fijado (Live)</span>
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">| Click para Bloquear</span>
            </div>
        </div>
    );
}

export default Layout
