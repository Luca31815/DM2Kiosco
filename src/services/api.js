import { supabase } from '../lib/supabase'

export const fetchTableData = async (tableName, options = {}) => {
    const { sortColumn, sortOrder, filterColumn, filterValue, page, pageSize, dateRange, dateColumn, select = '*' } = options

    let query = supabase.from(tableName).select(select, { count: 'exact' })

    if (filterColumn && filterValue) {
        // If searching a numeric column with ilike (like IDs), cast to text
        if (filterColumn.endsWith('_id') || filterColumn === 'id') {
            query = query.ilike(`${filterColumn}::text`, `%${filterValue}%`)
        } else {
            query = query.ilike(filterColumn, `%${filterValue}%`)
        }
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

export const getVentas = (options) => fetchTableData('vista_ventas_search', { sortColumn: 'fecha', sortOrder: 'desc', ...options })
export const getVentasDetalles = (id) => fetchDetails('ventas_detalles', 'venta_id', id)

export const getCompras = (options) => fetchTableData('vista_compras_search', options)
export const getComprasDetalles = (id) => fetchDetails('compras_detalles', 'compra_id', id)

export const getReservas = (options) => fetchTableData('vista_reservas_search', options)
export const getReservasAbiertas = (options) => fetchTableData('vista_reservas_abiertas', options)
export const getReservasDetalles = (id) => fetchDetails('reservas_detalles', 'reserva_id', id)

export const getProductos = (options) => fetchTableData('productos', options)

export const getClientes = (options) => fetchTableData('vista_clientes_unicos', options)

export const getReporteDiario = (options) => fetchTableData('vista_reporte_diario', options)
export const getReporteSemanal = (options) => fetchTableData('vista_reporte_semanal', options)
export const getReporteMensual = (options) => fetchTableData('vista_reporte_mensual', options)

export const getHistorialBot = (options) => fetchTableData('historial_bot', { ...options, sortColumn: 'fecha', sortOrder: 'desc' })

export const getRentabilidadProductos = (options) => fetchTableData('vista_rentabilidad_productos', options)

export const getAnalisisHorarioDiario = (options) => fetchTableData('vista_analisis_horario_diario', options)
export const getAnalisisHorarioSemanal = (options) => fetchTableData('vista_analisis_horario_semanal', options)
export const getAnalisisHorarioMensual = (options) => fetchTableData('vista_analisis_horario_mensual', options)

export const getHitosVentas = (options) => fetchTableData('vista_hitos_ventas', { sortColumn: 'dia', sortOrder: 'desc', ...options })

export const getReporteVentasPeriodico = (options) => fetchTableData('vista_reporte_ventas_periodico', options)

export const getMovimientosDinero = (id) => fetchDetails('movimientos_dinero', 'referencia_id', id)
export const getMovimientosStock = (id) => fetchDetails('stock_movimientos', 'referencia_id', id)

export const corregirOperacion = async (data) => {
    const { data: result, error } = await supabase.rpc('corregir_operacion_v16', { p_input: data })
    if (error) {
        console.error('Error calling corregir_operacion_v16:', error)
        throw error
    }
    return result
}

export const actualizarProducto = async (data) => {
    const { data: result, error } = await supabase.rpc('actualizar_producto_global', {
        p_id: data.producto_id,
        p_nuevo_nombre: data.nombre,
        p_nuevo_precio_venta: data.ultimo_precio_venta,
        p_nuevo_costo_compra: data.ultimo_costo_compra,
        p_nuevo_stock: data.stock_actual
    })
    if (error) {
        console.error('Error calling actualizar_producto_global:', error)
        throw error
    }
    return result
}
