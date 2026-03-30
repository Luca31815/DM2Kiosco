-- Mejorar la función de actualización global de productos
-- Esta versión asegura que:
-- 1. Se trabaje sobre productos_base directamente.
-- 2. El stock se ajuste mediante movimientos reales.
-- 3. Los cambios de nombre se propaguen a TODO el historial.
-- 4. Se soporte la normalización automática y se suspendan triggers conflictivos.

CREATE OR REPLACE FUNCTION public.actualizar_producto_global_v2(
    p_id bigint, 
    p_nuevo_nombre text, 
    p_nuevo_precio_venta numeric, 
    p_nuevo_costo_compra numeric, 
    p_nuevo_stock integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    v_nombre_viejo text;
    v_stock_actual_calculado integer;
    v_id_destino bigint;
    v_diferencia_stock integer;
    v_nombre_norm text;
BEGIN
    -- 1. Obtener datos actuales del producto desde la tabla base
    SELECT nombre INTO v_nombre_viejo 
    FROM public.productos_base 
    WHERE producto_id = p_id;

    IF v_nombre_viejo IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Producto no encontrado en productos_base');
    END IF;

    -- Normalizar nombre nuevo usando la función global
    v_nombre_norm := public.normalizar_texto(p_nuevo_nombre);

    -- ==============================================================================
    -- MODO SILENCIOSO: BYPASS DE TRIGGERS (Usando app.bypass_triggers variable)
    -- ==============================================================================
    -- 'replica' desactiva todos los triggers normales para la sesión actual.
    -- Esto requiere menos permisos que ALTER TABLE y es más seguro.
    PERFORM set_config('app.bypass_triggers', 'true', true);

    -- 2. Manejo de cambio de nombre (Renombrado o Fusión)
    IF v_nombre_viejo <> v_nombre_norm THEN
        -- ¿El nombre nuevo ya existe en otro producto?
        SELECT producto_id INTO v_id_destino 
        FROM public.productos_base 
        WHERE nombre = v_nombre_norm AND producto_id <> p_id;

        IF v_id_destino IS NOT NULL THEN
            -- CASO A: FUSIÓN (El destino ya existe)
            -- ACTUALIZAR HISTORIAL USANDO NORMALIZACIÓN (FIX: captura variantes de casing/espacios)
            UPDATE public.ventas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            UPDATE public.compras_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            UPDATE public.reservas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            
            -- Resolver conflictos de stock_movimientos antes de renombrar
            -- 1. Sumar cantidades donde ya exista el producto destino para esa misma referencia
            UPDATE public.stock_movimientos s
            SET cantidad = s.cantidad + a.cantidad
            FROM (
                SELECT referencia_tipo, referencia_id, cantidad 
                FROM public.stock_movimientos 
                WHERE public.normalizar_texto(producto) = v_nombre_viejo
            ) a
            WHERE s.referencia_tipo = a.referencia_tipo 
              AND s.referencia_id = a.referencia_id 
              AND s.producto = v_nombre_norm;

            -- 2. Eliminar el viejo en los casos donde hubo conflicto (porque ya sumamos la cantidad)
            DELETE FROM public.stock_movimientos s
            WHERE public.normalizar_texto(producto) = v_nombre_viejo 
              AND EXISTS (
                  SELECT 1 FROM public.stock_movimientos s2 
                  WHERE s2.referencia_tipo = s.referencia_tipo 
                    AND s2.referencia_id = s.referencia_id 
                    AND s2.producto = v_nombre_norm
              );

            -- 3. Renombrar los que no tuvieron conflicto
            UPDATE public.stock_movimientos SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            
            -- Eliminar el producto viejo (los movimientos ya pasaron al nuevo)
            DELETE FROM public.productos_base WHERE producto_id = p_id;

            -- APRENDIZAJE AUTOMÁTICO: guardar nombre viejo como sinónimo del nuevo
            INSERT INTO public.productos_sinonimos (alias, nombre_oficial)
            VALUES (v_nombre_viejo, v_nombre_norm)
            ON CONFLICT (alias) DO UPDATE SET nombre_oficial = EXCLUDED.nombre_oficial;
            
            -- REENCENDER TRIGGERS
            PERFORM set_config('app.bypass_triggers', 'false', true);

            -- Retornar indicando la fusión
            RETURN jsonb_build_object(
                'success', true, 
                'mensaje', 'Productos unificados con éxito. El historial se movió a ' || v_nombre_norm,
                'tipo_accion', 'MERGE',
                'id_eliminado', p_id,
                'id_destino', v_id_destino
            );
        END IF;
    END IF;

    -- CASO B: ACTUALIZACIÓN O RENOMBRADO SIMPLE
    -- Obtener stock actual real (suma de movimientos usando normalización para precisión)
    SELECT COALESCE(SUM(cantidad), 0)::integer INTO v_stock_actual_calculado 
    FROM public.stock_movimientos 
    WHERE public.normalizar_texto(producto) = v_nombre_viejo;

    -- Calcular diferencia de stock ANTES de renombrar en stock_movimientos
    v_diferencia_stock := p_nuevo_stock - v_stock_actual_calculado;

    -- Actualizar tabla maestra (base)
    UPDATE public.productos_base 
    SET nombre = v_nombre_norm,
        ultimo_precio_venta = p_nuevo_precio_venta,
        ultimo_costo_compra = p_nuevo_costo_compra,
        fecha_actualizacion = now()
    WHERE producto_id = p_id;

    -- Si hubo cambio de nombre, propagarlo al historial (usando normalización)
    IF v_nombre_viejo <> v_nombre_norm THEN
        UPDATE public.ventas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
        UPDATE public.compras_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
        UPDATE public.reservas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
        
        -- Misma logica de conflictos para renombramiento simple 
        UPDATE public.stock_movimientos s
        SET cantidad = s.cantidad + a.cantidad
        FROM (
            SELECT referencia_tipo, referencia_id, cantidad 
            FROM public.stock_movimientos 
            WHERE public.normalizar_texto(producto) = v_nombre_viejo
        ) a
        WHERE s.referencia_tipo = a.referencia_tipo 
          AND s.referencia_id = a.referencia_id 
          AND s.producto = v_nombre_norm;

        DELETE FROM public.stock_movimientos s
        WHERE public.normalizar_texto(producto) = v_nombre_viejo 
          AND EXISTS (
              SELECT 1 FROM public.stock_movimientos s2 
              WHERE s2.referencia_tipo = s.referencia_tipo 
                AND s2.referencia_id = s.referencia_id 
                AND s2.producto = v_nombre_norm
          );

        UPDATE public.stock_movimientos SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;

        -- Registrar sinónimo
        INSERT INTO public.productos_sinonimos (alias, nombre_oficial)
        VALUES (v_nombre_viejo, v_nombre_norm)
        ON CONFLICT (alias) DO UPDATE SET nombre_oficial = EXCLUDED.nombre_oficial;
    END IF;

    -- Ajuste de stock si es necesario (se hace sobre el nombre ya normalizado)
    IF v_diferencia_stock <> 0 THEN
        INSERT INTO public.stock_movimientos (
            movimiento_id, fecha, producto, cantidad, referencia_tipo, referencia_id, notas
        ) VALUES (
            'REC_' || p_id || '_' || extract(epoch from now())::bigint,
            now(),
            v_nombre_norm,
            v_diferencia_stock,
            'RECUENTO',
            'REC_' || p_id || '_' || floor(extract(epoch from now()) * 1000)::text,
            'Ajuste manual desde Dashboard'
        );
    END IF;

    -- REENCENDER TRIGGERS
    PERFORM set_config('app.bypass_triggers', 'false', true);

    RETURN jsonb_build_object(
        'success', true, 
        'mensaje', 'Producto actualizado correctamente.',
        'tipo_accion', 'UPDATE',
        'renombrado', (v_nombre_viejo <> v_nombre_norm),
        'ajuste_stock', v_diferencia_stock
    );

EXCEPTION WHEN OTHERS THEN
    -- ASEGURAR QUE LOS TRIGGERS SE REENCIENDAN EN CASO DE ERROR
    PERFORM set_config('app.bypass_triggers', 'false', true);
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
