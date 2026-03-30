import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sqlCleanup = `
CREATE OR REPLACE FUNCTION public.fn_cleanup_orphaned_products()
RETURNS integer AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.productos_base
    WHERE nombre NOT IN (SELECT DISTINCT CAST(producto AS text) FROM public.ventas_detalles WHERE producto IS NOT NULL)
      AND nombre NOT IN (SELECT DISTINCT CAST(producto AS text) FROM public.compras_detalles WHERE producto IS NOT NULL)
      AND nombre NOT IN (SELECT DISTINCT CAST(producto AS text) FROM public.reservas_detalles WHERE producto IS NOT NULL);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
`;

const sqlCorregir = `
CREATE OR REPLACE FUNCTION public.corregir_operacion_v18(p_input jsonb)
RETURNS jsonb AS $$
DECLARE
    v_input_norm jsonb;
    v_id_final text;
    v_id_upper text;
    v_tipo text;
    v_items_json jsonb;
    rec_item record;
    v_item_id bigint;
    v_old_n text; v_old_q numeric; v_old_p numeric;
    v_new_n text; v_new_q numeric; v_new_p numeric;
    v_reporte_detallado text := '';
    v_total_recal numeric := 0;
    v_cambios_realizados int := 0;
    v_salto text := chr(10);
BEGIN
    v_input_norm := CASE WHEN jsonb_typeof(p_input) = 'array' THEN p_input->0 ELSE p_input END;
    v_id_final := NULLIF(TRIM(v_input_norm->>'id_final'), '');
    IF v_id_final IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'ID no especificado.'); END IF;
    
    v_id_upper := UPPER(v_id_final);
    v_tipo := CASE 
        WHEN v_id_upper LIKE 'VE_%' THEN 'VENTA'
        WHEN v_id_upper LIKE 'CO_%' THEN 'COMPRA'
        WHEN v_id_upper LIKE 'RES_%' OR v_id_upper LIKE 'RE_%' THEN 'RESERVA'
        ELSE split_part(v_id_upper, '_', 1)
    END;

    v_reporte_detallado := '🛠️ *Corrección en ' || v_id_upper || '*' || v_salto;
    
    v_items_json := v_input_norm->'items';
    IF v_items_json IS NOT NULL AND jsonb_array_length(v_items_json) > 0 THEN
        FOR rec_item IN SELECT * FROM jsonb_array_elements(v_items_json) LOOP
            v_item_id := NULL;
            IF v_tipo = 'RESERVA' THEN
                SELECT id, producto, cantidad, precio_unitario INTO v_item_id, v_old_n, v_old_q, v_old_p
                FROM public.reservas_detalles WHERE UPPER(reserva_id) = v_id_upper 
                AND (producto = TRIM(rec_item.value->>'producto') OR public.normalizar_texto(producto) = public.normalizar_texto(rec_item.value->>'producto')) LIMIT 1;
            ELSIF v_tipo = 'COMPRA' THEN
                SELECT id, producto, cantidad, precio_unitario INTO v_item_id, v_old_n, v_old_q, v_old_p
                FROM public.compras_detalles WHERE UPPER(compra_id) = v_id_upper 
                AND (producto = TRIM(rec_item.value->>'producto') OR public.normalizar_texto(producto) = public.normalizar_texto(rec_item.value->>'producto')) LIMIT 1;
            ELSE 
                SELECT id, producto, cantidad::numeric, precio_unitario INTO v_item_id, v_old_n, v_old_q, v_old_p
                FROM public.ventas_detalles WHERE UPPER(venta_id) = v_id_upper 
                AND (producto = TRIM(rec_item.value->>'producto') OR public.normalizar_texto(producto) = public.normalizar_texto(rec_item.value->>'producto')) LIMIT 1;
            END IF;

            IF v_item_id IS NOT NULL THEN
                v_new_n := COALESCE(NULLIF(TRIM(rec_item.value->>'nuevo_nombre'), ''), v_old_n);
                v_new_q := COALESCE((rec_item.value->>'nueva_cantidad')::numeric, v_old_q);
                v_new_p := COALESCE((rec_item.value->>'nuevo_precio')::numeric, v_old_p);

                IF (v_new_n != v_old_n OR v_new_q != v_old_q OR v_new_p != v_old_p) THEN
                    IF v_tipo = 'RESERVA' THEN
                        UPDATE public.reservas_detalles SET producto = v_new_n, cantidad = v_new_q, precio_unitario = v_new_p, subtotal = (v_new_q * v_new_p) WHERE id = v_item_id;
                    ELSIF v_tipo = 'COMPRA' THEN
                        UPDATE public.compras_detalles SET producto = v_new_n, cantidad = v_new_q, precio_unitario = v_new_p, subtotal = (v_new_q * v_new_p) WHERE id = v_item_id;
                    ELSE
                        UPDATE public.ventas_detalles SET producto = v_new_n, cantidad = v_new_q::int, precio_unitario = v_new_p, subtotal = (v_new_q * v_new_p) WHERE id = v_item_id;
                    END IF;
                    UPDATE public.stock_movimientos SET producto = v_new_n, cantidad = v_new_q WHERE UPPER(referencia_id) = v_id_upper AND (producto = v_old_n OR public.normalizar_texto(producto) = public.normalizar_texto(v_old_n));
                    v_cambios_realizados := v_cambios_realizados + 1;
                END IF;
            END IF;
        END LOOP;
    END IF;

    IF v_tipo = 'RESERVA' THEN
        PERFORM public.recalcular_reserva(v_id_final);
        SELECT total_reserva INTO v_total_recal FROM public.reservas WHERE UPPER(reserva_id) = v_id_upper;
    ELSIF v_tipo = 'COMPRA' THEN
        SELECT COALESCE(SUM(subtotal), 0) INTO v_total_recal FROM public.compras_detalles WHERE UPPER(compra_id) = v_id_upper;
        UPDATE public.compras SET total_compra = v_total_recal WHERE UPPER(compra_id) = v_id_upper;
    ELSE
        SELECT COALESCE(SUM(subtotal), 0) INTO v_total_recal FROM public.ventas_detalles WHERE UPPER(venta_id) = v_id_upper;
        UPDATE public.ventas SET total_venta = v_total_recal WHERE UPPER(venta_id) = v_id_upper;
    END IF;

    RETURN jsonb_build_object('success', true, 'mensaje', v_reporte_detallado, 'count', v_cambios_realizados, 'id', v_id_upper);
END;
$$ LANGUAGE plpgsql;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sqlCleanup);
    console.log('Cleanup SQL Executed');
    await client.query(sqlCorregir);
    console.log('Correction SQL Executed');
    await client.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
run();
