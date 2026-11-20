import useSWR from 'swr'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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
    const shouldFetch = Boolean(enabled && !isDemoMode)

    const { data, error, isLoading } = useSWR(
        shouldFetch ? 'triage_pending_count' : null,
        fetchTriagePendingCount,
        {
            refreshInterval: 180000,
            dedupingInterval: 30000,
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        }
    )

    return {
        count: isDemoMode ? 0 : (data || 0),
        loading: isLoading,
        error,
    }
}
