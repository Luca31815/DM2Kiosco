import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import SalesTable from './SalesTable'
import { RefreshCw } from 'lucide-react'

export default function Dashboard() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('ventas')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error
            setData(data)
        } catch (err) {
            console.error('Error fetching data:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Registro de Ventas</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Visualizando los últimos movimientos
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl -z-10 rounded-full dark:bg-indigo-500/10" />
                <SalesTable data={data} loading={loading} error={error} />
            </div>
        </div>
    )
}
