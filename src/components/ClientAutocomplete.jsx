import React, { useState, useEffect, useRef } from 'react'
import { useClientes } from '../hooks/useData'
import { Loader2 } from 'lucide-react'

const ClientAutocomplete = ({ value, onChange, placeholder = 'Buscar cliente...', className = '' }) => {
    const [inputValue, setInputValue] = useState(value || '')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const wrapperRef = useRef(null)

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
    const { data: suggestions, loading } = useClientes({
        filterColumn: 'nombre',
        filterValue: debouncedQuery,
        pageSize: 10,
        sortColumn: 'nombre',
        sortOrder: 'asc'
    })

    // Handle clicks outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (name) => {
        setInputValue(name)
        onChange(name)
        setShowSuggestions(false)
    }

    const handleInputChange = (e) => {
        const newValue = e.target.value
        setInputValue(newValue)
        onChange(newValue)
        setShowSuggestions(true)
    }

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                className={`bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white focus:ring-1 focus:ring-blue-500 outline-none ${className}`}
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
            />
            {loading && showSuggestions && (
                <div className="absolute right-2 top-2">
                    <Loader2 className="animate-spin size-4 text-gray-400" />
                </div>
            )}

            {showSuggestions && inputValue.length > 0 && suggestions.length > 0 && (
                <ul className="absolute z-[100] w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-700 scrollbar-thin scrollbar-thumb-gray-600">
                    {suggestions.map((client, index) => (
                        <li
                            key={index}
                            className="px-4 py-2 hover:bg-white/5 cursor-pointer text-gray-300 transition-colors"
                            onClick={() => handleSelect(client.nombre)}
                        >
                            <span className="font-medium text-white">{client.nombre}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default ClientAutocomplete
