import { useState, useEffect } from 'react'

export function useIsMobile(maxWidth = 768) {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(`(max-width: ${maxWidth}px)`).matches
    })

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`)
        const handler = (e) => setIsMobile(e.matches)
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [maxWidth])

    return isMobile
}
