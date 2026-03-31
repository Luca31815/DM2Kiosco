CREATE OR REPLACE FUNCTION public.fn_cleanup_orphaned_products()
 RETURNS integer
 LANGUAGE plpgsql
 AS $function$
 DECLARE
     deleted_count INTEGER;
 BEGIN
     -- Limpieza de productos huérfanos con normalización
     DELETE FROM public.productos_base 
     WHERE nombre NOT IN (
         SELECT public.normalizar_texto(producto) FROM public.ventas_detalles WHERE producto IS NOT NULL
         UNION
         SELECT public.normalizar_texto(producto) FROM public.compras_detalles WHERE producto IS NOT NULL
         UNION
         SELECT public.normalizar_texto(producto) FROM public.reservas_detalles WHERE producto IS NOT NULL
     );
     GET DIAGNOSTICS deleted_count = ROW_COUNT;
     RETURN deleted_count;
 END;
 $function$;
