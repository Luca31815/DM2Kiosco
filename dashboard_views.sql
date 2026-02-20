-- =========================================================
-- LIMPIEZA DE VISTAS EXISTENTES (Para evitar errores de cambio de esquema)
-- =========================================================
DROP VIEW IF EXISTS public.vista_reporte_diario CASCADE;
DROP VIEW IF EXISTS public.vista_reporte_semanal CASCADE;
DROP VIEW IF EXISTS public.vista_reporte_mensual CASCADE;
DROP VIEW IF EXISTS public.vista_reservas_abiertas CASCADE;
DROP VIEW IF EXISTS public.vista_rentabilidad_productos CASCADE;
DROP VIEW IF EXISTS public.vista_reporte_ventas_periodico CASCADE;
DROP VIEW IF EXISTS public.vista_analisis_horario_diario CASCADE;
DROP VIEW IF EXISTS public.vista_analisis_horario_semanal CASCADE;
DROP VIEW IF EXISTS public.vista_analisis_horario_mensual CASCADE;
DROP VIEW IF EXISTS public.vista_ventas_search CASCADE;
DROP VIEW IF EXISTS public.vista_compras_search CASCADE;
DROP VIEW IF EXISTS public.vista_reservas_search CASCADE;
DROP VIEW IF EXISTS public.vista_clientes_unicos CASCADE;

-- =========================================================
-- 1. Vista de Reporte Diario (Basado en Caja/Movimientos)
-- =========================================================
CREATE OR REPLACE VIEW public.vista_reporte_diario AS
SELECT 
    date_trunc('day', fecha)::date as fecha,
    COUNT(CASE WHEN UPPER(referencia_tipo) = 'VENTA' AND UPPER(tipo) = 'ENTRADA' THEN 1 END) as cant_ventas,
    COUNT(CASE WHEN UPPER(referencia_tipo) = 'COMPRA' AND UPPER(tipo) = 'SALIDA' THEN 1 END) as cant_compras,
    SUM(CASE WHEN UPPER(tipo) = 'ENTRADA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) ELSE 0 END) as ingresos,
    SUM(CASE WHEN UPPER(tipo) = 'SALIDA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) ELSE 0 END) as egresos,
    SUM(CASE WHEN UPPER(tipo) = 'ENTRADA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) 
             WHEN UPPER(tipo) = 'SALIDA' THEN -COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0)
             ELSE 0 END) as balance,
    SUM(CASE WHEN UPPER(referencia_tipo) = 'VENTA' AND UPPER(tipo) = 'ENTRADA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) ELSE 0 END) as total_ventas -- Compatibilidad con Dashboard
FROM public.movimientos_dinero
GROUP BY 1
ORDER BY 1 DESC;

-- =========================================================
-- 2. Vista de Reporte Semanal
-- =========================================================
CREATE OR REPLACE VIEW public.vista_reporte_semanal AS
SELECT 
    date_trunc('week', fecha)::date as semana_del,
    COUNT(CASE WHEN UPPER(referencia_tipo) = 'VENTA' AND UPPER(tipo) = 'ENTRADA' THEN 1 END) as cant_ventas,
    COUNT(CASE WHEN UPPER(referencia_tipo) = 'COMPRA' AND UPPER(tipo) = 'SALIDA' THEN 1 END) as cant_compras,
    SUM(CASE WHEN UPPER(tipo) = 'ENTRADA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) ELSE 0 END) as ingresos,
    SUM(CASE WHEN UPPER(tipo) = 'SALIDA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) ELSE 0 END) as egresos,
    SUM(CASE WHEN UPPER(tipo) = 'ENTRADA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) 
             WHEN UPPER(tipo) = 'SALIDA' THEN -COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0)
             ELSE 0 END) as balance
FROM public.movimientos_dinero
GROUP BY 1
ORDER BY 1 DESC;

-- =========================================================
-- 3. Vista de Reporte Mensual
-- =========================================================
CREATE OR REPLACE VIEW public.vista_reporte_mensual AS
SELECT 
    extract(year from fecha)::int as anio,
    extract(month from fecha)::int as mes,
    COUNT(CASE WHEN UPPER(referencia_tipo) = 'VENTA' AND UPPER(tipo) = 'ENTRADA' THEN 1 END) as cant_ventas,
    COUNT(CASE WHEN UPPER(referencia_tipo) = 'COMPRA' AND UPPER(tipo) = 'SALIDA' THEN 1 END) as cant_compras,
    SUM(CASE WHEN UPPER(tipo) = 'ENTRADA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) ELSE 0 END) as ingresos,
    SUM(CASE WHEN UPPER(tipo) = 'SALIDA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) ELSE 0 END) as egresos,
    SUM(CASE WHEN UPPER(tipo) = 'ENTRADA' THEN COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0) 
             WHEN UPPER(tipo) = 'SALIDA' THEN -COALESCE(NULLIF(regexp_replace(monto, '[^0-9.]', '', 'g'), '')::numeric, 0)
             ELSE 0 END) as balance
FROM public.movimientos_dinero
GROUP BY 1, 2
ORDER BY 1 DESC, 2 DESC;

-- =========================================================
-- 4. Vista de Reservas Abiertas
-- =========================================================
CREATE OR REPLACE VIEW public.vista_reservas_abiertas AS
SELECT 
    r.reserva_id,
    r.fecha_creacion,
    r."Cliente" as cliente,
    COALESCE(NULLIF(regexp_replace(r.total_reserva, '[^0-9.]', '', 'g'), '')::numeric, 0) as total_reserva,
    COALESCE(NULLIF(regexp_replace(r.total_pagado, '[^0-9.]', '', 'g'), '')::numeric, 0) as total_pagado,
    COALESCE(NULLIF(regexp_replace(r.saldo_pendiente, '[^0-9.]', '', 'g'), '')::numeric, 0) as saldo_pendiente,
    r.estado_pago,
    r.estado_entrega,
    r.estado_reserva,
    r."Notas" as notas,
    (SELECT string_agg(producto, ', ') FROM public.reservas_detalles rd WHERE rd.reserva_id = r.reserva_id) as lista_productos
FROM public.reservas r
WHERE r.estado_reserva NOT IN ('cerrada', 'cancelada', 'anulada')
ORDER BY r.fecha_creacion DESC;

-- =========================================================
-- 5. Vista de Rentabilidad por Producto
-- =========================================================
CREATE OR REPLACE VIEW public.vista_rentabilidad_productos AS
WITH ventas_prod AS (
    SELECT 
        producto,
        SUM(cantidad) as unidades_vendidas,
        SUM(subtotal) as ingresos_totales
    FROM public.ventas_detalles
    GROUP BY producto
),
compras_prod AS (
    SELECT 
        producto,
        SUM(cantidad) as unidades_compradas,
        SUM(subtotal::numeric) as costo_total_compras
    FROM public.compras_detalles
    GROUP BY producto
)
SELECT 
    p.nombre as producto,
    p.producto_id,
    COALESCE(v.unidades_vendidas, 0) as unidades_vendidas,
    COALESCE(v.ingresos_totales, 0) as ingresos_totales,
    COALESCE(c.unidades_compradas, 0) as unidades_compradas,
    COALESCE(c.costo_total_compras, 0) as costo_total_compras,
    CASE 
        WHEN COALESCE(c.unidades_compradas, 0) > 0 
        THEN ROUND(COALESCE(c.costo_total_compras, 0) / COALESCE(c.unidades_compradas, 1), 2)
        ELSE p.ultimo_costo_compra 
    END as ppp_costo_unitario,
    (COALESCE(v.unidades_vendidas, 0) * 
        CASE 
            WHEN COALESCE(c.unidades_compradas, 0) > 0 
            THEN (COALESCE(c.costo_total_compras, 0) / COALESCE(c.unidades_compradas, 1))
            ELSE p.ultimo_costo_compra 
        END
    ) as costo_mercaderia_vendida,
    (COALESCE(v.ingresos_totales, 0) - (COALESCE(v.unidades_vendidas, 0) * 
        CASE 
            WHEN COALESCE(c.unidades_compradas, 0) > 0 
            THEN (COALESCE(c.costo_total_compras, 0) / COALESCE(c.unidades_compradas, 1))
            ELSE p.ultimo_costo_compra 
        END
    )) as ganancia_neta,
    CASE 
        WHEN p.ultimo_costo_compra = 0 AND COALESCE(c.unidades_compradas, 0) = 0 THEN 'FALTA COSTO'
        WHEN (COALESCE(v.ingresos_totales, 0) - (COALESCE(v.unidades_vendidas, 0) * p.ultimo_costo_compra)) < 0 THEN 'PÉRDIDA'
        ELSE 'OK'
    END as estado_del_dato
FROM public.productos p
LEFT JOIN ventas_prod v ON p.nombre = v.producto
LEFT JOIN compras_prod c ON p.nombre = c.producto;

-- =========================================================
-- 6. Vista de Ventas por Producto Periódico (Pivot)
-- =========================================================
CREATE OR REPLACE VIEW public.vista_reporte_ventas_periodico AS
SELECT 
    vd.producto,
    SUM(vd.cantidad) as cantidad_total,
    SUM(vd.subtotal) as recaudacion_total,
    date_trunc('day', v.fecha)::date as periodo_inicio,
    'DIARIO' as tipo_periodo
FROM public.ventas_detalles vd
JOIN public.ventas v ON vd.venta_id = v.venta_id
GROUP BY 1, 4
UNION ALL
SELECT 
    vd.producto,
    SUM(vd.cantidad) as cantidad_total,
    SUM(vd.subtotal) as recaudacion_total,
    date_trunc('week', v.fecha)::date as periodo_inicio,
    'SEMANAL' as tipo_periodo
FROM public.ventas_detalles vd
JOIN public.ventas v ON vd.venta_id = v.venta_id
GROUP BY 1, 4
UNION ALL
SELECT 
    vd.producto,
    SUM(vd.cantidad) as cantidad_total,
    SUM(vd.subtotal) as recaudacion_total,
    date_trunc('month', v.fecha)::date as periodo_inicio,
    'MENSUAL' as tipo_periodo
FROM public.ventas_detalles vd
JOIN public.ventas v ON vd.venta_id = v.venta_id
GROUP BY 1, 4;

-- =========================================================
-- 7. Vistas de Análisis Horario (para AnalisisHorariosView)
-- =========================================================
CREATE OR REPLACE VIEW public.vista_analisis_horario_diario AS
SELECT 
    date_trunc('day', fecha)::date as fecha,
    count(CASE WHEN extract(hour from fecha) BETWEEN 0 AND 5 THEN 1 END) as ventas_madrugada,
    count(CASE WHEN extract(hour from fecha) BETWEEN 6 AND 12 THEN 1 END) as ventas_manana,
    count(CASE WHEN extract(hour from fecha) BETWEEN 13 AND 18 THEN 1 END) as ventas_tarde,
    count(CASE WHEN extract(hour from fecha) BETWEEN 19 AND 23 THEN 1 END) as ventas_noche
FROM public.ventas
GROUP BY 1;

CREATE OR REPLACE VIEW public.vista_analisis_horario_semanal AS
SELECT 
    date_trunc('week', fecha)::date as semana_del,
    count(CASE WHEN extract(hour from fecha) BETWEEN 0 AND 5 THEN 1 END) as ventas_madrugada,
    count(CASE WHEN extract(hour from fecha) BETWEEN 6 AND 12 THEN 1 END) as ventas_manana,
    count(CASE WHEN extract(hour from fecha) BETWEEN 13 AND 18 THEN 1 END) as ventas_tarde,
    count(CASE WHEN extract(hour from fecha) BETWEEN 19 AND 23 THEN 1 END) as ventas_noche
FROM public.ventas
GROUP BY 1;

CREATE OR REPLACE VIEW public.vista_analisis_horario_mensual AS
SELECT 
    extract(year from fecha)::int as anio,
    extract(month from fecha)::int as mes,
    count(CASE WHEN extract(hour from fecha) BETWEEN 0 AND 5 THEN 1 END) as ventas_madrugada,
    count(CASE WHEN extract(hour from fecha) BETWEEN 6 AND 12 THEN 1 END) as ventas_manana,
    count(CASE WHEN extract(hour from fecha) BETWEEN 13 AND 18 THEN 1 END) as ventas_tarde,
    count(CASE WHEN extract(hour from fecha) BETWEEN 19 AND 23 THEN 1 END) as ventas_noche
FROM public.ventas
GROUP BY 1, 2;

-- =========================================================
-- 8. Vistas de Búsqueda (Search) para Tablas Principales
-- =========================================================
CREATE OR REPLACE VIEW public.vista_ventas_search AS
SELECT v.venta_id,
       v.fecha,
       v.cliente,
       COALESCE(NULLIF(regexp_replace(v.total_venta, '[^0-9.]', '', 'g'), '')::numeric, 0) as total_venta,
       v.notas,
       (SELECT string_agg(producto, ', ') FROM public.ventas_detalles vd WHERE vd.venta_id = v.venta_id) as lista_productos
FROM public.ventas v;

CREATE OR REPLACE VIEW public.vista_compras_search AS
SELECT 
    c.compra_id,
    c."Fecha" as fecha,
    c.proveedor,
    COALESCE(NULLIF(regexp_replace(c.total_compra, '[^0-9.]', '', 'g'), '')::numeric, 0) as total_compra,
    c.notas,
    (SELECT string_agg(producto, ', ') FROM public.compras_detalles cd WHERE cd.compra_id = c.compra_id) as lista_productos
FROM public.compras c;

CREATE OR REPLACE VIEW public.vista_reservas_search AS
SELECT 
    r.reserva_id,
    r.fecha_creacion,
    r."Cliente" as cliente,
    COALESCE(NULLIF(regexp_replace(r.total_reserva, '[^0-9.]', '', 'g'), '')::numeric, 0) as total_reserva,
    COALESCE(NULLIF(regexp_replace(r.total_pagado, '[^0-9.]', '', 'g'), '')::numeric, 0) as total_pagado,
    COALESCE(NULLIF(regexp_replace(r.saldo_pendiente, '[^0-9.]', '', 'g'), '')::numeric, 0) as saldo_pendiente,
    r.estado_pago,
    r.estado_entrega,
    r.estado_reserva,
    r."Notas" as notas,
    (SELECT string_agg(producto, ', ') FROM public.reservas_detalles rd WHERE rd.reserva_id = r.reserva_id) as lista_productos
FROM public.reservas r;

-- =========================================================
-- 9. Clientes Únicos
-- =========================================================
CREATE OR REPLACE VIEW public.vista_clientes_unicos AS
SELECT DISTINCT cliente as nombre FROM public.ventas WHERE cliente IS NOT NULL
UNION
SELECT DISTINCT "Cliente" as nombre FROM public.reservas WHERE "Cliente" IS NOT NULL;

-- Permisos
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
