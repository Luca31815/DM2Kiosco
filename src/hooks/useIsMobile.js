import { useCallback, useSyncExternalStore } from 'react'

const mediaQueryStores = new Map()

function getMediaQueryStore(maxWidth) {
    if (mediaQueryStores.has(maxWidth)) {
        return mediaQueryStores.get(maxWidth)
    }

    const listeners = new Set()
    const query = `(max-width: ${maxWidth}px)`
    const mql = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(query)
        : null

    let currentMatches = mql ? mql.matches : false

    const handleChange = (event) => {
        currentMatches = event.matches
        listeners.forEach((listener) => listener())
    }

    const subscribe = (listener) => {
        if (!mql) return () => {}
        if (listeners.size === 0) {
            currentMatches = mql.matches
            mql.addEventListener('change', handleChange)
        }
        listeners.add(listener)
        return () => {
            listeners.delete(listener)
            if (listeners.size === 0) {
                mql.removeEventListener('change', handleChange)
            }
        }
    }

    const getSnapshot = () => (mql ? mql.matches : currentMatches)
    const getServerSnapshot = () => false

    const store = { subscribe, getSnapshot, getServerSnapshot }
    mediaQueryStores.set(maxWidth, store)
    return store
}

export function useIsMobile(maxWidth = 768) {
    const store = getMediaQueryStore(maxWidth)
    const subscribe = useCallback((listener) => store.subscribe(listener), [store])
    return useSyncExternalStore(subscribe, store.getSnapshot, store.getServerSnapshot)
}
