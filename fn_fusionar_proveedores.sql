-- ==========================================
-- FUNCIÓN PARA FUSIONAR PROVEEDORES
-- ==========================================

CREATE OR REPLACE FUNCTION public.fn_fusionar_proveedores(
    p_nombre_origen TEXT,
    p_nombre_destino TEXT
)
RETURNS JSON AS $$
DECLARE
    v_rows_compras INTEGER;
    v_rows_retiros INTEGER;
    v_rows_movimientos INTEGER;
BEGIN
    -- 1. Actualizar tabla de compras
    UPDATE public.compras
    SET proveedor = p_nombre_destino
    WHERE TRIM(UPPER(proveedor)) = TRIM(UPPER(p_nombre_origen));
    GET DIAGNOSTICS v_rows_compras = ROW_COUNT;

    -- 2. Intentar actualizar retiros (usamos bloque dinámico por si la columna no existe)
    BEGIN
        EXECUTE 'UPDATE public.retiros SET proveedor = $1 WHERE TRIM(UPPER(proveedor)) = TRIM(UPPER($2))'
        USING p_nombre_destino, p_nombre_origen;
        GET DIAGNOSTICS v_rows_retiros = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        v_rows_retiros := 0;
    END;

    -- 3. Actualizar descripciones en movimientos_dinero
    UPDATE public.movimientos_dinero
    SET motivo = REPLACE(motivo, p_nombre_origen, p_nombre_destino)
    WHERE motivo ILIKE '%' || p_nombre_origen || '%';
    GET DIAGNOSTICS v_rows_movimientos = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'compras_actualizadas', v_rows_compras,
        'retiros_actualizados', v_rows_retiros,
        'movimientos_actualizados', v_rows_movimientos,
        'mensaje', 'Fusión completada con éxito. Se movieron registros de ' || p_nombre_origen || ' a ' || p_nombre_destino
    );
END;
$$ LANGUAGE plpgsql;
