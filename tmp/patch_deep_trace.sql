-- Script para mejorar la trazabilidad SQL capturando el Call Stack completo
-- Esto permitirá ver TODAS las funciones que intervinieron en un cambio.

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_old jsonb := NULL;
    v_new jsonb := NULL;
    v_id text;
    v_stack text;
BEGIN
    -- Capturar el Call Stack de PL/pgSQL
    GET DIAGNOSTICS v_stack = PG_CONTEXT;

    IF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
    END IF;

    -- Intentar obtener un ID representativo
    v_id := COALESCE(
        v_new->>'id', v_old->>'id',
        v_new->>'venta_id', v_old->>'venta_id',
        v_new->>'producto_id', v_old->>'producto_id',
        v_new->>'movimiento_id', v_old->>'movimiento_id',
        v_new->>'reserva_id', v_old->>'reserva_id',
        'N/A'
    );

    INSERT INTO public.logs_auditoria (
        nombre_tabla, 
        registro_id, 
        accion, 
        valor_anterior, 
        valor_nuevo, 
        usuario,
        query_context
    )
    VALUES (
        TG_TABLE_NAME, 
        v_id, 
        TG_OP, 
        v_old, 
        v_new, 
        CURRENT_USER,
        -- Almacenar tanto el Stack como la consulta SQL externa
        'STACK:' || v_stack || ' | QUERY:' || current_query()
    );

    RETURN COALESCE(NEW, OLD);
END;
$function$;
