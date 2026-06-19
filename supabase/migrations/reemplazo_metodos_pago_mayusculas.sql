-- 1. Crear tabla de reemplazos de métodos de pago
CREATE TABLE IF NOT EXISTS public.reemplazos_metodos_pago (
    metodo_origen TEXT PRIMARY KEY,
    metodo_destino TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deshabilitar RLS para facilitar acceso desde REST/RPC
ALTER TABLE public.reemplazos_metodos_pago DISABLE ROW LEVEL SECURITY;

-- 2. Crear vista de cartera actual (saldos agrupados y netos)
CREATE OR REPLACE VIEW public.v_cartera_actual AS
SELECT 
    metodo,
    SUM(CASE WHEN tipo = 'ENTRADA' THEN monto ELSE 0 END) as entradas,
    SUM(CASE WHEN tipo = 'SALIDA' THEN -monto ELSE 0 END) as salidas,
    SUM(CASE WHEN tipo = 'ENTRADA' THEN monto ELSE -monto END) as balance_neto,
    COUNT(*) as cantidad_movimientos
FROM public.movimientos_dinero
GROUP BY metodo;

-- 3. Crear función de reemplazo masivo y regla permanente
CREATE OR REPLACE FUNCTION public.fn_crear_reemplazo_y_actualizar_movimientos(p_origen text, p_destino text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update rule, storing destination in UPPERCASE
    INSERT INTO public.reemplazos_metodos_pago (metodo_origen, metodo_destino)
    VALUES (p_origen, UPPER(p_destino))
    ON CONFLICT (metodo_origen)
    DO UPDATE SET metodo_destino = UPPER(EXCLUDED.metodo_destino);
    
    -- Massive update of existing records to UPPERCASE destination
    UPDATE public.movimientos_dinero
    SET metodo = UPPER(p_destino),
        notas = COALESCE(notas, '') || ' [AUTO_CURADO: Reemplazado método de pago masivamente]'
    WHERE LOWER(metodo) = LOWER(p_origen) AND metodo != UPPER(p_destino);
END;
$$;

-- 4. Crear o reemplazar la función de trigger para normalizar e integrar
CREATE OR REPLACE FUNCTION public.fn_aplicar_reemplazo_metodo_pago()
RETURNS TRIGGER AS $$
DECLARE
    v_destino TEXT;
BEGIN
    SELECT metodo_destino INTO v_destino
    FROM public.reemplazos_metodos_pago
    WHERE LOWER(metodo_origen) = LOWER(NEW.metodo);
    
    IF v_destino IS NOT NULL THEN
        NEW.metodo := UPPER(v_destino);
    ELSE
        NEW.metodo := UPPER(NEW.metodo);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear el trigger BEFORE INSERT OR UPDATE en movimientos_dinero
DROP TRIGGER IF EXISTS tg_aplicar_reemplazo_metodo_pago ON public.movimientos_dinero;
CREATE TRIGGER tg_aplicar_reemplazo_metodo_pago
BEFORE INSERT OR UPDATE ON public.movimientos_dinero
FOR EACH ROW
EXECUTE FUNCTION public.fn_aplicar_reemplazo_metodo_pago();

-- 6. Crear función del cron de auditoría y normalización
CREATE OR REPLACE FUNCTION public.fn_cron_revisar_reemplazos_metodo_pago()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rec RECORD;
    v_updated_count INTEGER := 0;
    v_detalles JSONB := '[]'::jsonb;
    v_titulo TEXT;
    v_mensaje TEXT;
BEGIN
    -- A. Corregir movimientos obsoletos con reemplazos activos (y pasarlos a MAYÚSCULAS)
    FOR v_rec IN 
        SELECT md.movimiento_id, md.metodo, md.referencia_id, md.referencia_tipo, r.metodo_destino
        FROM public.movimientos_dinero md
        JOIN public.reemplazos_metodos_pago r ON LOWER(md.metodo) = LOWER(r.metodo_origen)
        WHERE md.metodo != UPPER(r.metodo_destino)
    LOOP
        UPDATE public.movimientos_dinero
        SET metodo = UPPER(v_rec.metodo_destino),
            notas = COALESCE(notas, '') || ' [AUTO_CURADO: Reemplazado método de pago por Cron]'
        WHERE movimiento_id = v_rec.movimiento_id;
        
        v_updated_count := v_updated_count + 1;
        
        v_detalles := v_detalles || jsonb_build_object(
            'movimiento_id', v_rec.movimiento_id,
            'metodo_anterior', v_rec.metodo,
            'metodo_nuevo', UPPER(v_rec.metodo_destino),
            'referencia_id', v_rec.referencia_id,
            'referencia_tipo', v_rec.referencia_tipo
        );
    END LOOP;

    -- B. Normalizar TODOS los otros registros a MAYÚSCULAS para evitar duplicados por casing (Efectivo vs EFECTIVO)
    FOR v_rec IN
        SELECT movimiento_id, metodo, referencia_id, referencia_tipo
        FROM public.movimientos_dinero
        WHERE metodo != UPPER(metodo)
    LOOP
        UPDATE public.movimientos_dinero
        SET metodo = UPPER(metodo)
        WHERE movimiento_id = v_rec.movimiento_id;

        v_updated_count := v_updated_count + 1;

        v_detalles := v_detalles || jsonb_build_object(
            'movimiento_id', v_rec.movimiento_id,
            'metodo_anterior', v_rec.metodo,
            'metodo_nuevo', UPPER(v_rec.metodo),
            'referencia_id', v_rec.referencia_id,
            'referencia_tipo', v_rec.referencia_tipo
        );
    END LOOP;
    
    IF v_updated_count > 0 THEN
        v_titulo := 'Corrección y Normalización de Métodos de Pago';
        v_mensaje := format(
            'El cron de auditoría corrigió y normalizó a mayúsculas %s movimientos de dinero.',
            v_updated_count
        );
        
        INSERT INTO public.alertas_log (tipo, titulo, mensaje, log_auditoria_id)
        VALUES ('info', v_titulo, v_mensaje, NULL);
    END IF;
    
    RETURN jsonb_build_object(
        'ejecutado_en', NOW(),
        'movimientos_actualizados', v_updated_count,
        'detalles', v_detalles
    );
END;
$$;

-- 7. Registrar cron en pg_cron si no existe
SELECT cron.unschedule('auditoria_reemplazos_metodos_pago_diaria') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auditoria_reemplazos_metodos_pago_diaria');

SELECT cron.schedule(
    'auditoria_reemplazos_metodos_pago_diaria',
    '15 3 * * *',
    'SELECT public.fn_cron_revisar_reemplazos_metodo_pago()'
);
