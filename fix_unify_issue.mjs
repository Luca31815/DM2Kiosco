import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sqlFix = `
CREATE OR REPLACE FUNCTION public.actualizar_producto_global_v2(
    p_id bigint, 
    p_nuevo_nombre text, 
    p_nuevo_precio_venta numeric, 
    p_nuevo_costo_compra numeric, 
    p_nuevo_stock integer
)
RETURNS jsonb AS $$
DECLARE
    v_nombre_viejo text;
    v_stock_actual_calculado integer;
    v_id_destino bigint;
    v_diferencia_stock integer;
    v_nombre_norm text;
BEGIN
    -- 1. Obtener el nombre actual del producto antes del cambio
    SELECT nombre INTO v_nombre_viejo 
    FROM public.productos_base 
    WHERE producto_id = p_id;

    IF v_nombre_viejo IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Producto no encontrado en productos_base');
    END IF;

    v_nombre_norm := public.normalizar_texto(p_nuevo_nombre);

    -- Desactivar triggers para evitar recursividad o efectos secundarios no deseados durante la unificación
    PERFORM set_config('app.bypass_triggers', 'true', true);

    -- 2. Verificar si es una unificación (si el nuevo nombre ya existe en otro ID)
    IF v_nombre_viejo <> v_nombre_norm THEN
        SELECT producto_id INTO v_id_destino 
        FROM public.productos_base 
        WHERE nombre = v_nombre_norm AND producto_id <> p_id;

        IF v_id_destino IS NOT NULL THEN
            -- CASO A: FUSIÓN DE PRODUCTOS
            
            -- ACTUALIZAR HISTORIAL USANDO NORMALIZACIÓN (FIX: captura variantes de casing/espacios)
            UPDATE public.ventas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            UPDATE public.compras_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            UPDATE public.reservas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            
            -- Actualizar movimientos de stock: sumar si ya existe el destino en la misma operación
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

            -- Eliminar los movimientos que acabamos de sumar para evitar duplicidad
            DELETE FROM public.stock_movimientos s
            WHERE public.normalizar_texto(producto) = v_nombre_viejo 
              AND EXISTS (
                  SELECT 1 FROM public.stock_movimientos s2 
                  WHERE s2.referencia_tipo = s.referencia_tipo 
                    AND s2.referencia_id = s.referencia_id 
                    AND s2.producto = v_nombre_norm
              );

            -- Renombrar los movimientos que no tenían contraparte
            UPDATE public.stock_movimientos SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
            
            -- Eliminar el producto viejo del catálogo principal
            DELETE FROM public.productos_base WHERE producto_id = p_id;

            -- APRENDIZAJE AUTOMÁTICO: guardar nombre viejo como sinónimo del nuevo para futuras operaciones
            INSERT INTO public.productos_sinonimos (alias, nombre_oficial)
            VALUES (v_nombre_viejo, v_nombre_norm)
            ON CONFLICT (alias) DO UPDATE SET nombre_oficial = EXCLUDED.nombre_oficial;

            PERFORM set_config('app.bypass_triggers', 'false', true);

            RETURN jsonb_build_object(
                'success', true, 
                'mensaje', 'Productos unificados con éxito. El historial se movió a ' || v_nombre_norm,
                'tipo_accion', 'MERGE',
                'id_eliminado', p_id,
                'id_destino', v_id_destino
            );
        END IF;
    END IF;

    -- CASO B: ACTUALIZACIÓN SIMPLE O RENOMBRADO SIN CONFLICTO
    
    -- Calcular stock actual basado en movimientos (usando normalización para ser precisos)
    SELECT COALESCE(SUM(cantidad), 0)::integer INTO v_stock_actual_calculado 
    FROM public.stock_movimientos 
    WHERE public.normalizar_texto(producto) = v_nombre_viejo;

    v_diferencia_stock := p_nuevo_stock - v_stock_actual_calculado;

    -- Actualizar el producto en el catálogo
    UPDATE public.productos_base 
    SET nombre = v_nombre_norm,
        ultimo_precio_venta = p_nuevo_precio_venta,
        ultimo_costo_compra = p_nuevo_costo_compra,
        fecha_actualizacion = now()
    WHERE producto_id = p_id;

    -- Si cambió el nombre, actualizar el historial también
    IF v_nombre_viejo <> v_nombre_norm THEN
        UPDATE public.ventas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
        UPDATE public.compras_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
        UPDATE public.reservas_detalles SET producto = v_nombre_norm WHERE public.normalizar_texto(producto) = v_nombre_viejo;
        
        -- Mismo proceso de ajuste para movimientos de stock
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

    -- Si hubo ajuste de stock manual, registrar un movimiento de RECUENTO
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

    PERFORM set_config('app.bypass_triggers', 'false', true);

    RETURN jsonb_build_object(
        'success', true, 
        'mensaje', 'Producto actualizado correctamente.',
        'tipo_accion', 'UPDATE',
        'renombrado', (v_nombre_viejo <> v_nombre_norm),
        'ajuste_stock', v_diferencia_stock
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('app.bypass_triggers', 'false', true);
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sqlFix);
    console.log('Function actualizar_producto_global_v2 updated successfully with normalization support.');
    await client.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
run();
