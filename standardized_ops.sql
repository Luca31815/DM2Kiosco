-- ==========================================
-- 1. ESTANDARIZACIÓN DE cancelar_operacion
-- ==========================================
CREATE OR REPLACE FUNCTION public.cancelar_operacion(p_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_tipo text;
BEGIN
    v_tipo := split_part(p_id, '_', 1);

    DELETE FROM public.movimientos_dinero WHERE referencia_id = p_id;
    DELETE FROM public.stock_movimientos WHERE referencia_id = p_id;

    IF v_tipo = 'VENTA' THEN
        DELETE FROM public.ventas_detalles WHERE venta_id = p_id;
        DELETE FROM public.ventas WHERE venta_id = p_id;
    ELSIF v_tipo = 'COMPRA' THEN
        DELETE FROM public.compras_detalles WHERE compra_id = p_id;
        DELETE FROM public.compras WHERE compra_id = p_id;
    ELSIF v_tipo = 'RESERVA' OR v_tipo = 'RES' THEN
        DELETE FROM public.reservas_detalles WHERE reserva_id = p_id;
        DELETE FROM public.reservas WHERE reserva_id = p_id;
    ELSIF v_tipo = 'RETIRO' THEN
        DELETE FROM public.retiros WHERE retiro_id = p_id;
    END IF;

    UPDATE public.historial_bot SET estado = 'CANCELADO' WHERE operacion_id = p_id;

    RETURN jsonb_build_object(
        'success', true,
        'mensaje', 'Operación ' || p_id || ' eliminada.',
        'data', jsonb_build_array(jsonb_build_object('id_operacion', p_id, 'tipo_op', v_tipo, 'accion', 'CANCELACION'))
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- ==========================================
-- 2. crear_operacion (ALINEADA CON PARSER IA)
-- ==========================================
CREATE OR REPLACE FUNCTION public.crear_operacion(p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_tipo text;
    v_id text;
    v_total_calculado numeric := 0;
BEGIN
    -- 1. IDENTIFICACIÓN
    -- Soporta tanto el formato directo como el anidado en 'operacion'
    v_tipo := upper(COALESCE(p_data->'operacion'->>'tipo', p_data->>'tipo'));
    v_id := COALESCE(p_data->'operacion'->>'id', p_data->>'id_final', p_data->>'id');

    IF v_tipo NOT IN ('VENTA', 'COMPRA') THEN RAISE EXCEPTION 'Tipo de operación inválido: %', v_tipo; END IF;
    IF v_id IS NULL THEN RAISE EXCEPTION 'ID de operación obligatorio'; END IF;

    -- 2. CALCULO DEL TOTAL (Suma de items para asegurar integridad)
    SELECT COALESCE(SUM((item->>'subtotal')::numeric),0)
    INTO v_total_calculado
    FROM jsonb_array_elements(p_data->'items') AS item;

    -- 3. INSERTAR CABECERA Y DETALLES
    IF v_tipo = 'VENTA' THEN
        -- Validar duplicados
        IF EXISTS (SELECT 1 FROM public.ventas WHERE venta_id = v_id) THEN 
            RAISE EXCEPTION 'Venta duplicada: %', v_id; 
        END IF;

        INSERT INTO public.ventas (venta_id, fecha, cliente, total_venta, notas)
        VALUES (
            v_id, 
            COALESCE((p_data->'operacion'->>'fecha')::timestamp, (p_data->>'fecha')::timestamp, now()), 
            COALESCE(p_data->'operacion'->>'cliente', p_data->>'cliente'), 
            v_total_calculado::text, 
            COALESCE(p_data->'operacion'->>'notas', p_data->>'notas')
        );

        INSERT INTO public.ventas_detalles (venta_id, producto, cantidad, precio_unitario, subtotal)
        SELECT 
            v_id, 
            item->>'producto', 
            (item->>'cantidad')::integer, 
            (item->>'precio_unitario')::numeric, 
            (item->>'subtotal')::numeric
        FROM jsonb_array_elements(p_data->'items') AS item;

    ELSIF v_tipo = 'COMPRA' THEN
        -- Validar duplicados
        IF EXISTS (SELECT 1 FROM public.compras WHERE compra_id = v_id) THEN 
            RAISE EXCEPTION 'Compra duplicada: %', v_id; 
        END IF;

        INSERT INTO public.compras (compra_id, "Fecha", proveedor, total_compra, notas)
        VALUES (
            v_id, 
            COALESCE((p_data->'operacion'->>'fecha')::timestamp, (p_data->>'fecha')::timestamp, now()), 
            COALESCE(p_data->'operacion'->>'proveedor', p_data->>'proveedor'), 
            v_total_calculado::text, 
            COALESCE(p_data->'operacion'->>'notas', p_data->>'notas')
        );

        INSERT INTO public.compras_detalles (compra_id, producto, cantidad, precio_unitario, subtotal)
        SELECT 
            v_id, 
            item->>'producto', 
            (item->>'cantidad')::numeric, 
            item->>'precio_unitario', 
            item->>'subtotal'
        FROM jsonb_array_elements(p_data->'items') AS item;
    END IF;

    -- 4. MOVIMIENTOS DINERO
    -- Soporta tanto el array 'movimientos_dinero' (nuevo) como 'pagos' (legacy)
    IF p_data ? 'movimientos_dinero' AND jsonb_array_length(p_data->'movimientos_dinero') > 0 THEN
        INSERT INTO public.movimientos_dinero (
            movimiento_id, fecha, tipo, referencia_tipo, referencia_id, metodo, monto, cliente, proveedor, notas
        ) SELECT 
            item->>'movimiento_id', 
            COALESCE((item->>'fecha')::timestamp, now()), 
            item->>'tipo', 
            v_tipo, 
            v_id, 
            item->>'metodo', 
            item->>'monto', 
            item->>'cliente', 
            item->>'proveedor', 
            item->>'notas'
        FROM jsonb_array_elements(p_data->'movimientos_dinero') AS item;
    ELSIF p_data ? 'pagos' AND jsonb_array_length(p_data->'pagos') > 0 THEN
        INSERT INTO public.movimientos_dinero (
            movimiento_id, fecha, tipo, referencia_tipo, referencia_id, metodo, monto, cliente, proveedor, notas
        ) SELECT 
            'MD_' || floor(extract(epoch from now()) * 1000) || '_' || (random()*100)::int,
            COALESCE((p_data->>'fecha')::timestamp, now()),
            CASE WHEN v_tipo = 'VENTA' THEN 'ENTRADA' ELSE 'SALIDA' END,
            v_tipo, v_id, p->>'metodo', p->>'monto', p_data->>'cliente', p_data->>'proveedor', 'Registro Bot'
        FROM jsonb_array_elements(p_data->'pagos') AS p;
    END IF;

    -- 5. MOVIMIENTOS STOCK
    -- Procesa el array 'movimientos_stock' enviado por n8n
    IF p_data ? 'movimientos_stock' AND jsonb_array_length(p_data->'movimientos_stock') > 0 THEN
        INSERT INTO public.stock_movimientos (
            movimiento_id, fecha, producto, cantidad, referencia_tipo, referencia_id, notas
        ) SELECT 
            item->>'movimiento_id', 
            COALESCE((item->>'fecha')::timestamp, now()), 
            item->>'producto', 
            (item->>'cantidad')::numeric, 
            v_tipo, 
            v_id, 
            item->>'notas'
        FROM jsonb_array_elements(p_data->'movimientos_stock') AS item;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'operacion_id', v_id, 
        'tipo', v_tipo, 
        'total', v_total_calculado
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
