-- =========================================================
-- 1. Vista para búsqueda en Ventas
-- =========================================================
CREATE OR REPLACE VIEW public.vista_ventas_search AS
SELECT 
    v.venta_id,
    v.fecha,
    v.cliente,
    v.total_venta,
    v.notas,
    v.nro_diario,
    COALESCE((
        SELECT string_agg(vd.producto, ', ') 
        FROM public.ventas_detalles vd 
        WHERE vd.venta_id = v.venta_id
    ), '') as lista_productos
FROM public.ventas v;

-- =========================================================
-- 2. Vista para búsqueda en Compras
-- =========================================================
CREATE OR REPLACE VIEW public.vista_compras_search AS
SELECT 
    c.compra_id,
    c."Fecha" as fecha, -- Ajustado a "Fecha" según tu esquema
    c.proveedor,
    c.total_compra,
    c.notas,
    COALESCE((
        SELECT string_agg(cd.producto, ', ') 
        FROM public.compras_detalles cd 
        WHERE cd.compra_id = c.compra_id
    ), '') as lista_productos
FROM public.compras c;

-- =========================================================
-- 3. Vista para búsqueda en Reservas
-- =========================================================
CREATE OR REPLACE VIEW public.vista_reservas_search AS
SELECT 
    r.reserva_id,
    r.fecha_creacion as fecha,
    r."Cliente" as cliente, -- Ajustado a "Cliente" según tu esquema
    r.total_reserva,
    r.total_pagado,
    r.saldo_pendiente,
    r.estado_pago,
    r.estado_entrega,
    r.estado_reserva,
    r."Notas" as notas, -- Ajustado a "Notas" según tu esquema
    COALESCE((
        SELECT string_agg(rd.producto, ', ') 
        FROM public.reservas_detalles rd 
        WHERE rd.reserva_id = r.reserva_id
    ), '') as lista_productos
FROM public.reservas r;

-- =========================================================
-- 4. Vista para Clientes únicos (Autocompletado Pro)
-- =========================================================
CREATE OR REPLACE VIEW public.vista_clientes_unicos AS
SELECT DISTINCT nombre FROM (
    SELECT TRIM(UPPER(cliente)) as nombre FROM public.ventas WHERE cliente IS NOT NULL AND cliente != ''
    UNION
    SELECT TRIM(UPPER("Cliente")) as nombre FROM public.reservas WHERE "Cliente" IS NOT NULL AND "Cliente" != ''
) as combined_clients
WHERE nombre IS NOT NULL
ORDER BY nombre;

-- Permisos
GRANT SELECT ON public.vista_ventas_search TO anon, authenticated, service_role;
GRANT SELECT ON public.vista_compras_search TO anon, authenticated, service_role;
GRANT SELECT ON public.vista_reservas_search TO anon, authenticated, service_role;
GRANT SELECT ON public.vista_clientes_unicos TO anon, authenticated, service_role;
