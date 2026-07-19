import React from 'react'
import { useAuth } from '../context/AuthContext'
import LoginView from '../views/LoginView'
import { Loader2 } from 'lucide-react'

const LoadingScreen = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-4 opacity-80" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Verificando autenticación...
        </p>
    </div>
)

const AuthGuard = ({ children }) => {
    const { session, loading, isDemoMode } = useAuth()

    if (loading) {
        return <LoadingScreen />
    }

    if (!session && !isDemoMode) {
        return <LoginView />
    }

    return children
}

export default AuthGuard
