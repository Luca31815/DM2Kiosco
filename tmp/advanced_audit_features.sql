-- Parche para Fase 2: Resúmenes de IA Diarios y Rollback

-- 1. Tabla para almacenar los resúmenes generados por la IA (Diarios, Semanales, Mensuales)
CREATE TABLE IF NOT EXISTS public.resumenes_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE DEFAULT CURRENT_DATE,
    tipo TEXT NOT NULL DEFAULT 'diario', -- 'diario', 'semanal', 'mensual'
    contenido TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    creado_el TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fecha, tipo) -- Evita duplicados del mismo tipo para el mismo día
);

-- 2. Vista para que n8n obtenga los cambios significativos del día
-- Esta vista filtra el ruido temporal y agrupa por tabla y acción
CREATE OR REPLACE VIEW public.v_auditoria_diaria_ia AS
SELECT 
    nombre_tabla,
    accion,
    COUNT(*) as cantidad,
    jsonb_agg(jsonb_build_object(
        'id', registro_id,
        'anterior', valor_anterior,
        'nuevo', valor_nuevo,
        'contexto', query_context
    )) as detalles
FROM public.logs_auditoria
WHERE fecha >= CURRENT_DATE -- Solo hoy
  AND (
      -- Filtro de ruido: solo si hay cambios reales además de la fecha
      NOT (
          accion = 'UPDATE' AND 
          (valor_nuevo - 'actualizado_el' - 'fecha_modificacion') = (valor_anterior - 'actualizado_el' - 'fecha_modificacion')
      )
      OR accion IN ('INSERT', 'DELETE')
  )
GROUP BY nombre_tabla, accion;

-- 3. Función de Rollback (Fase 1)
-- Permite revertir un cambio específico usando su log_id
CREATE OR REPLACE FUNCTION public.fn_rollback_log(p_log_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log RECORD;
    v_sql TEXT;
    v_table TEXT;
    v_target_id TEXT;
    v_old_data JSONB;
    v_key TEXT;
    v_val JSONB;
    v_set_clause TEXT := '';
BEGIN
    -- Obtener el log
    SELECT * INTO v_log FROM public.logs_auditoria WHERE id = p_log_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Log no encontrado');
    END IF;

    v_table := quote_ident(v_log.nombre_tabla);
    v_target_id := v_log.registro_id;
    v_old_data := v_log.valor_anterior;

    -- Solo podemos revertir UPDATE y DELETE (en INSERT no hay valor anterior útil para restaurar el estado previo)
    IF v_log.accion = 'INSERT' THEN
        -- Para INSERT, el rollback sería borrarlo
        v_sql := format('DELETE FROM public.%I WHERE id::text = %L', v_log.nombre_tabla, v_target_id);
    ELSIF v_log.accion = 'UPDATE' THEN
        -- Construir clausula SET desde jsonb
        FOR v_key, v_val IN SELECT * FROM jsonb_each(v_old_data)
        LOOP
            v_set_clause := v_set_clause || format('%I = %L, ', v_key, v_val#>>'{}');
        END LOOP;
        v_set_clause := rtrim(v_set_clause, ', ');
        
        v_sql := format('UPDATE public.%I SET %s WHERE id::text = %L', v_log.nombre_tabla, v_set_clause, v_target_id);
    ELSIF v_log.accion = 'DELETE' THEN
        -- Para DELETE, el rollback es re-insertar
        -- (Esto es más complejo por los tipos de datos, pero se asume estructura estándar)
        RETURN jsonb_build_object('success', false, 'error', 'Rollback de DELETE no implementado en esta versión simple');
    END IF;

    EXECUTE v_sql;

    RETURN jsonb_build_object('success', true, 'mensaje', 'Reversión exitosa');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
