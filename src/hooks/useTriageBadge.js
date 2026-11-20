import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TRIAGE_ACTIVATION_DELAY_MS = 220

const fetchTriagePendingCount = async () => {
    const { count, error } = await supabase
        .from('productos_base')
        .select('*', { count: 'exact', head: true })
        .or('categoria.is.null,categoria.eq.,categoria.eq.SIN_CATEGORIA')

    if (error) {
        console.error('Error fetching triage pending count:', error)
        return 0
    }
    return count || 0
}

export function useTriageBadge(enabled = true) {
    const { isDemoMode } = useAuth()
    const [hasActivated, setHasActivated] = useState(false)

    useEffect(() => {
        if (!enabled || isDemoMode || hasActivated) return
        const timer = setTimeout(() => {
            setHasActivated(true)
        }, TRIAGE_ACTIVATION_DELAY_MS)
        return () => clearTimeout(timer)
    }, [enabled, isDemoMode, hasActivated])

    const shouldFetch = Boolean(hasActivated && !isDemoMode)

    const { data, error, isLoading } = useSWR(
        shouldFetch ? 'triage_pending_count' : null,
        fetchTriagePendingCount,
        {
            refreshInterval: 180000,
            dedupingInterval: 60000,
            revalidateOnFocus: false,
            revalidateIfStale: false,
            shouldRetryOnError: false,
        }
    )

    return {
        count: isDemoMode ? 0 : (data || 0),
        loading: isLoading,
        error,
    }
}
