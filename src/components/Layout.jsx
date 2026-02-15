import React, { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex bg-gray-950 min-h-screen relative">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Top Bar for Toggle */}
                <div className="p-4 border-b border-gray-800 flex items-center bg-gray-900/50 backdrop-blur-sm sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 mr-4 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">DM2Kiosco</h1>
                </div>

                <div className="p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Layout
