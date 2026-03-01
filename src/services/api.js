import { supabase } from '../lib/supabase'

// Helper para detectar modo demo desde la cookie
const isDemo = () => {
    if (typeof document === 'undefined') return false;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; dashboard_mode=`);
    if (parts.length === 2) return parts.pop().split(';').shift() === 'demo';
    return false;
};

export const fetchTableData = async (tableName, options = {}) => {
    if (isDemo()) return { data: [], count: 0 }; // Failsafe

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
        // Asegurar que incluimos todo el día hasta el final
        const endValue = dateRange.end.length === 10 ? `${dateRange.end} 23:59:59` : dateRange.end
        query = query.lte(dateColumn, endValue)
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

const fetchDetails = async (tableName, shadowColumn, id) => {
    if (isDemo()) return []
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(shadowColumn, id)

    if (error) {
        console.error(`Error fetching details from ${tableName}:`, error)
        throw error
    }
    return data || []
}


export const rollbackLog = async (logId) => {
    if (isDemo()) throw new Error('Acción deshabilitada en el modo Demo');
    const { data, error } = await supabase.rpc('fn_rollback_log', { p_log_id: logId })
    if (error) {
        console.error('Error calling fn_rollback_log:', error)
        throw error
    }
    return data
}

export const getAISummaries = async ({ tipo = 'diario', pageSize = 12 } = {}) => {
    let query = supabase
        .from('resumenes_ia')
        .select('*')
        .eq('tipo', tipo)
        .order('fecha', { ascending: false })
        .limit(pageSize)

    const { data, error } = await query
    if (error) throw error
    return { data }
}

export const getSystemAlerts = async () => {
    const { data, error } = await supabase
        .from('alertas_log')
        .select('*, logs_auditoria(*)')
        .order('creado_el', { ascending: false })
        .limit(50)

    if (error) throw error
    return { data }
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
    if (isDemo()) throw new Error('Acción deshabilitada en el modo Demo');
    const { data: result, error } = await supabase.rpc('corregir_operacion_v16', { p_input: data })
    if (error) {
        console.error('Error calling corregir_operacion_v16:', error)
        throw error
    }
    return result
}

export const actualizarProducto = async (data) => {
    if (isDemo()) throw new Error('Acción deshabilitada en el modo Demo');
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

export const crearReserva = async (reserva, productos, pagos) => {
    if (isDemo()) throw new Error('Acción deshabilitada en el modo Demo');
    const { data: result, error } = await supabase.rpc('crear_o_modificar_reserva_v4', {
        p_reserva: reserva,
        p_productos: productos,
        p_pagos: pagos
    })
    if (error) {
        console.error('Error calling crear_o_modificar_reserva_v4:', error)
        throw error
    }
    return result
}

// --- MONITOREO Y SISTEMA ---
export const getAuditLogs = (options) => fetchTableData('logs_auditoria', { sortColumn: 'fecha', sortOrder: 'desc', ...options })
export const getN8nErrors = (options) => fetchTableData('logs_errores_n8n', { sortColumn: 'fecha', sortOrder: 'desc', ...options })
export const getPredictiveStock = (options) => fetchTableData('vista_prediccion_stock', options)
