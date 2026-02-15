import { supabase } from '../lib/supabase'

export const fetchTableData = async (tableName, options = {}) => {
    const { sortColumn, sortOrder, filterColumn, filterValue, page, pageSize, dateRange, dateColumn } = options

    let query = supabase.from(tableName).select('*', { count: 'exact' })

    if (filterColumn && filterValue) {
        query = query.ilike(filterColumn, `%${filterValue}%`)
    }

    if (dateRange && dateColumn && dateRange.start) {
        query = query.gte(dateColumn, dateRange.start)
    }

    if (dateRange && dateColumn && dateRange.end) {
        // Add one day to include the end date fully if it's just a date string, 
        // or assume the user handles time. For simplicity with standard date pickers:
        query = query.lte(dateColumn, dateRange.end)
    }

    if (sortColumn && sortOrder) {
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' })
    }

    if (page !== undefined && pageSize !== undefined) {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
        console.error(`Error fetching data from ${tableName}:`, error)
        throw error
    }

    return { data, count }
}

export const fetchDetails = async (tableName, foreignKeyColumn, foreignKeyValue) => {
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(foreignKeyColumn, foreignKeyValue)

    if (error) {
        console.error(`Error fetching details from ${tableName}:`, error)
        throw error
    }
    return data
}

export const getVentas = (options) => fetchTableData('ventas', options)
export const getVentasDetalles = (id) => fetchDetails('ventas_detalles', 'venta_id', id)

export const getCompras = (options) => fetchTableData('compras', options)
export const getComprasDetalles = (id) => fetchDetails('compras_detalles', 'compra_id', id)

export const getReservas = (options) => fetchTableData('reservas', options)
export const getReservasAbiertas = (options) => fetchTableData('vista_reservas_abiertas', options)
export const getReservasDetalles = (id) => fetchDetails('reservas_detalles', 'reserva_id', id)

export const getProductos = (options) => fetchTableData('productos', options)

export const getReporteDiario = (options) => fetchTableData('vista_reporte_diario', options)
export const getReporteSemanal = (options) => fetchTableData('vista_reporte_semanal', options)
export const getReporteMensual = (options) => fetchTableData('vista_reporte_mensual', options)
