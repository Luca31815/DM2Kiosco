import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as api from '../services/api'
import { Loader2 } from 'lucide-react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const ProductAutocomplete = ({ value, onChange, placeholder = 'Buscar producto...', className = '' }) => {
    const [inputValue, setInputValue] = useState(value || '')
    const [prevPropValue, setPrevPropValue] = useState(value)
    if (value !== prevPropValue) {
        setPrevPropValue(value)
        setInputValue(value || '')
    }
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef(null)
    const inputRef = useRef(null)
    const menuRef = useRef(null)

    const debouncedQuery = useDebouncedValue(inputValue, 400)

    // Fetch suggestions using trigram similarity only when dropdown is open
    useEffect(() => {
        let isMounted = true
        const fetchSuggestions = async () => {
            if (!showSuggestions || !debouncedQuery || debouncedQuery.trim().length < 2) {
                if (isMounted) {
                    setSuggestions([])
                    setLoading(false)
                }
                return
            }
            setLoading(true)
            try {
                const results = await api.buscarProductosSimilares(debouncedQuery)
                if (isMounted) setSuggestions(results || [])
            } catch (err) {
                console.error('Error fetching suggestions:', err)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchSuggestions()
        return () => { isMounted = false }
    }, [debouncedQuery, showSuggestions])

    // Update position for portal
    const updatePosition = useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            })
        }
    }, [])

    // Attach outside-click, scroll (capture), and resize listeners ONLY when open, throttled with rAF
    useEffect(() => {
        if (!showSuggestions) return

        let rafId = null
        const scheduleUpdate = () => {
            if (rafId !== null) return
            rafId = window.requestAnimationFrame(() => {
                rafId = null
                updatePosition()
            })
        }

        const handleClickOutside = (event) => {
            const inWrapper = wrapperRef.current && wrapperRef.current.contains(event.target)
            const inMenu = menuRef.current && menuRef.current.contains(event.target)
            if (!inWrapper && !inMenu) {
                setShowSuggestions(false)
            }
        }

        scheduleUpdate()
        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true })
        window.addEventListener('resize', scheduleUpdate, { passive: true })

        return () => {
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId)
            }
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', scheduleUpdate, { capture: true })
            window.removeEventListener('resize', scheduleUpdate)
        }
    }, [showSuggestions, updatePosition])

    const handleSelect = (e, name) => {
        e.preventDefault() // Evitar pérdida de foco
        setInputValue(name)
        onChange?.(name)
        setShowSuggestions(false)
    }

    const handleInputChange = (e) => {
        const newValue = e.target.value
        setInputValue(newValue)
        onChange?.(newValue)
        setShowSuggestions(true)
        updatePosition()
    }

    const suggestionsMenu = showSuggestions && inputValue.length > 0 && suggestions.length > 0 && (
        <ul
            ref={menuRef}
            className="fixed z-[9999] bg-gray-800 border border-gray-700 rounded shadow-2xl max-h-60 overflow-y-auto divide-y divide-gray-700 scrollbar-thin scrollbar-thumb-gray-600"
            style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                marginTop: '4px'
            }}
        >
            {suggestions.map((product) => (
                <li key={product.producto_id || product.id || product.codigo || product.nombre}>
                    <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-white/5 cursor-pointer text-gray-300 transition-colors"
                        onMouseDown={(e) => handleSelect(e, product.nombre)}
                    >
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-white">{product.nombre}</span>
                                {product.similitud && (
                                    <span className="text-[9px] bg-blue-900/40 text-blue-300 px-1 rounded">
                                        {Math.round(product.similitud * 100)}% Match
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-500 uppercase">
                                Precio: ${product.precio || product.ultimo_precio_venta || '-'}
                            </span>
                        </div>
                    </button>
                </li>
            ))}
        </ul>
    )

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                aria-label={placeholder || 'Buscar producto'}
                className={`bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white focus:ring-1 focus:ring-blue-500 outline-none ${className}`}
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => {
                    updatePosition()
                    setShowSuggestions(true)
                }}
            />
            {loading && showSuggestions && (
                <div className="absolute right-2 top-2">
                    <Loader2 className="animate-spin size-4 text-gray-400" />
                </div>
            )}

            {showSuggestions && createPortal(suggestionsMenu, document.body)}
        </div>
    )
}

export default ProductAutocomplete
