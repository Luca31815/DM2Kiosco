CREATE OR REPLACE FUNCTION public.fn_get_product_details(p_nombre text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $$
DECLARE
    v_res jsonb;
    v_nombre_norm text;
    v_sinonimos text[];
BEGIN
    v_nombre_norm := public.normalizar_texto(p_nombre);

    -- 1. Obtener sinónimos
    SELECT array_agg(s.alias) INTO v_sinonimos 
    FROM public.productos_sinonimos s
    WHERE s.nombre_oficial = v_nombre_norm;

    -- 2. Construir objeto final
    SELECT jsonb_build_object(
        'sinonimos', COALESCE(v_sinonimos, '{}'::text[]),
        'ventas', (
            SELECT COALESCE(jsonb_agg(j), '[]'::jsonb) 
            FROM (
                SELECT vd.venta_id as ref, v.fecha as fecha_registro, vd.precio_unitario 
                FROM public.ventas_detalles vd
                INNER JOIN public.ventas v ON vd.venta_id = v.venta_id
                WHERE public.normalizar_texto(vd.producto) = v_nombre_norm 
                ORDER BY v.fecha DESC LIMIT 20
            ) j
        ),
        'compras', (
            SELECT COALESCE(jsonb_agg(k), '[]'::jsonb) 
            FROM (
                SELECT cd.compra_id as ref, c."Fecha" as fecha_registro, cd.precio_unitario 
                FROM public.compras_detalles cd
                INNER JOIN public.compras c ON cd.compra_id = c.compra_id
                WHERE public.normalizar_texto(cd.producto) = v_nombre_norm 
                ORDER BY c."Fecha" DESC LIMIT 20
            ) k
        ),
        'reservas', (
            SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) 
            FROM (
                SELECT rd.id as item_ref, rs.fecha_creacion as fecha_registro, rd.precio_unitario 
                FROM public.reservas_detalles rd
                INNER JOIN public.reservas rs ON rd.reserva_id = rs.reserva_id
                WHERE public.normalizar_texto(rd.producto) = v_nombre_norm 
                ORDER BY rs.fecha_creacion DESC LIMIT 20
            ) r
        ),
        'ultima_actividad', (
            SELECT MAX(f) 
            FROM (
                SELECT v.fecha as f FROM public.ventas_detalles vd JOIN public.ventas v ON vd.venta_id = v.venta_id WHERE public.normalizar_texto(vd.producto) = v_nombre_norm
                UNION ALL
                SELECT c."Fecha" as f FROM public.compras_detalles cd JOIN public.compras c ON cd.compra_id = c.compra_id WHERE public.normalizar_texto(cd.producto) = v_nombre_norm
                UNION ALL
                SELECT rs.fecha_creacion as f FROM public.reservas_detalles rd JOIN public.reservas rs ON rd.reserva_id = rs.reserva_id WHERE public.normalizar_texto(rd.producto) = v_nombre_norm
            ) u
        )
    ) INTO v_res;

    RETURN v_res;
END;
$$;
