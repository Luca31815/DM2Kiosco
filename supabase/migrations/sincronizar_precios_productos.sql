CREATE OR REPLACE FUNCTION public.sincronizar_precios_productos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- 1. Actualizar precios usando una lógica masiva (mucho más rápido que un loop)
    -- FIX: Usamos public.normalizar_texto() para agrupar y unir correctamente
    WITH ultimas_ventas AS (
        -- Buscamos el precio de la VENTA más reciente para cada producto (normalizado)
        SELECT DISTINCT ON (public.normalizar_texto(vd.producto)) 
            public.normalizar_texto(vd.producto) as nombre_norm, 
            vd.precio_unitario
        FROM public.ventas_detalles vd
        JOIN public.ventas v ON vd.venta_id = v.venta_id
        WHERE vd.producto IS NOT NULL
        ORDER BY public.normalizar_texto(vd.producto), v.fecha DESC
    ),
    ultimas_compras AS (
        -- Buscamos el costo de la COMPRA más reciente para cada producto (normalizado)
        SELECT DISTINCT ON (public.normalizar_texto(cd.producto)) 
            public.normalizar_texto(cd.producto) as nombre_norm, 
            cd.precio_unitario
        FROM public.compras_detalles cd
        JOIN public.compras c ON cd.compra_id = c.compra_id
        WHERE cd.producto IS NOT NULL
        ORDER BY public.normalizar_texto(cd.producto), c."Fecha" DESC
    )
    UPDATE public.productos_base p
    SET 
        -- Si hay venta nueva, actualizamos. Si no, dejamos el que estaba.
        -- FIX: Accedemos a través del alias 'sub' de la subquerie de abajo
        ultimo_precio_venta = COALESCE(sub.precio_venta, p.ultimo_precio_venta),
        
        -- Si hay compra nueva, actualizamos (casteando a numeric por si acaso)
        ultimo_costo_compra = COALESCE(sub.precio_compra::numeric, p.ultimo_costo_compra),
        
        fecha_actualizacion = NOW()
    FROM (
        SELECT 
            COALESCE(uv.nombre_norm, uc.nombre_norm) as nombre_norm,
            uv.precio_unitario as precio_venta,
            uc.precio_unitario as precio_compra
        FROM ultimas_ventas uv
        FULL JOIN ultimas_compras uc ON uv.nombre_norm = uc.nombre_norm
    ) sub
    WHERE p.nombre = sub.nombre_norm;

END;
$function$;
