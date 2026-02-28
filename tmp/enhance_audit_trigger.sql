-- Script para mejorar la auditoría capturando el contexto de la consulta SQL
-- y agregando el campo necesario en logs_auditoria

ALTER TABLE public.logs_auditoria ADD COLUMN IF NOT EXISTS query_context TEXT;

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_old jsonb := NULL;
    v_new jsonb := NULL;
    v_id text;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
    END IF;

    -- Intentar obtener un ID representativo para el log
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
        current_query() -- Captura la consulta SQL que disparó el trigger
    );

    RETURN COALESCE(NEW, OLD);
END;
$function$;
