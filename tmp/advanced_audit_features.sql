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
-- Permite revertir-- 1. Función para deshacer un cambio (Rollback)
CREATE OR REPLACE FUNCTION public.fn_rollback_log(p_log_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_log RECORD;
    v_sql TEXT;
    v_key TEXT;
    v_val JSONB;
    v_updates TEXT := '';
BEGIN
    -- Obtener el log de auditoría
    SELECT * INTO v_log FROM public.logs_auditoria WHERE log_id = p_log_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Log no encontrado');
    END IF;

    IF v_log.accion = 'DELETE' THEN
        -- Para DELETE, el rollback es un INSERT del valor anterior
        -- (Implementación simplificada)
        RETURN jsonb_build_object('success', false, 'message', 'Rollback de DELETE no implementado automáticamente');
    ELSIF v_log.accion = 'INSERT' THEN
        -- Para INSERT, el rollback es un DELETE
        v_sql := format('DELETE FROM %I WHERE id = %L', v_log.nombre_tabla, (v_log.valor_nuevo->>'id')::uuid);
        EXECUTE v_sql;
        RETURN jsonb_build_object('success', true, 'message', 'Rollback exitoso: Registro eliminado');
    ELSIF v_log.accion = 'UPDATE' THEN
        -- Para UPDATE, volvemos a poner los valores de valor_anterior
        FOR v_key, v_val IN SELECT * FROM jsonb_each(v_log.valor_anterior)
        LOOP
            v_updates := v_updates || format('%I = %L, ', v_key, v_val#>>'{}');
        END LOOP;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
