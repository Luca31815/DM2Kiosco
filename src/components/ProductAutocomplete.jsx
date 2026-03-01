import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useProductos } from '../hooks/useData'
import { Loader2 } from 'lucide-react'

const ProductAutocomplete = ({ value, onChange, placeholder = 'Buscar producto...', className = '' }) => {
    const [inputValue, setInputValue] = useState(value || '')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
    const wrapperRef = useRef(null)
    const inputRef = useRef(null)

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(inputValue)
        }, 400)
        return () => clearTimeout(timer)
    }, [inputValue])

    // Sync external value changes
    useEffect(() => {
        setInputValue(value || '')
    }, [value])

    // Fetch suggestions
    const { data: suggestions, loading } = useProductos({
        filterColumn: 'nombre',
        filterValue: debouncedQuery,
        pageSize: 10,
        sortColumn: 'nombre',
        sortOrder: 'asc'
    })

    // Update position for portal
    const updatePosition = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            })
        }
    }

    // Handle clicks outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [])

    const handleSelect = (e, name) => {
        e.preventDefault() // Evitar pérdida de foco
        setInputValue(name)
        onChange(name)
        setShowSuggestions(false)
    }

    const handleInputChange = (e) => {
        const newValue = e.target.value
        setInputValue(newValue)
        onChange(newValue)
        setShowSuggestions(true)
        updatePosition()
    }

    const suggestionsMenu = showSuggestions && inputValue.length > 0 && suggestions.length > 0 && (
        <ul
            className="fixed z-[9999] bg-gray-800 border border-gray-700 rounded shadow-2xl max-h-60 overflow-y-auto divide-y divide-gray-700 scrollbar-thin scrollbar-thumb-gray-600"
            style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                marginTop: '4px'
            }}
        >
            {suggestions.map((product) => (
                <li
                    key={product.producto_id}
                    className="px-4 py-2 hover:bg-white/5 cursor-pointer text-gray-300 transition-colors"
                    onMouseDown={(e) => handleSelect(e, product.nombre)}
                >
                    <div className="flex flex-col">
                        <span className="font-medium text-white">{product.nombre}</span>
                        <span className="text-[10px] text-gray-500 uppercase">En stock: {product.stock_actual} • ${product.ultimo_precio_venta || '-'}</span>
                    </div>
                </li>
            ))}
        </ul>
    )

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                ref={inputRef}
                type="text"
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
