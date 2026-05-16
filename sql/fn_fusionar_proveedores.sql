-- ========================================================
-- FUNCION: fn_fusionar_proveedores
-- OBJETIVO: Unificar dos proveedores en uno solo, actualizando
--          todo el historial de compras, retiros y finanzas.
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_fusionar_proveedores(
    p_nombre_origen TEXT,
    p_nombre_destino TEXT
)
RETURNS JSON AS $$
DECLARE
    v_rows_compras INTEGER := 0;
    v_rows_retiros INTEGER := 0;
    v_rows_movimientos INTEGER := 0;
    v_rows_detalles INTEGER := 0;
BEGIN
    -- 1. Actualizar tabla de COMPRAS
    -- Nota: Usamos TRIM y UPPER para asegurar que capturamos todas las variantes
    UPDATE public.compras
    SET proveedor = p_nombre_destino
    WHERE TRIM(UPPER(proveedor)) = TRIM(UPPER(p_nombre_origen));
    GET DIAGNOSTICS v_rows_compras = ROW_COUNT;

    -- 2. Actualizar tabla de COMPRAS_DETALLES (si tiene la columna proveedor por redundancia)
    -- En este esquema, los detalles suelen estar vinculados por compra_id, 
    -- pero algunas vistas consolidadas podrían usar el nombre. 
    -- Actualizamos por si acaso existe la columna.
    BEGIN
        EXECUTE 'UPDATE public.compras_detalles SET proveedor = $1 WHERE TRIM(UPPER(proveedor)) = TRIM(UPPER($2))'
        USING p_nombre_destino, p_nombre_origen;
        GET DIAGNOSTICS v_rows_detalles = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        v_rows_detalles := 0;
    END;

    -- 3. Actualizar tabla de MOVIMIENTOS_DINERO
    -- Esta es crítica para que los reportes de caja y deudas coincidan.
    UPDATE public.movimientos_dinero
    SET proveedor = p_nombre_destino
    WHERE TRIM(UPPER(proveedor)) = TRIM(UPPER(p_nombre_origen));
    GET DIAGNOSTICS v_rows_movimientos = ROW_COUNT;

    -- 4. Actualizar tabla de RETIROS (si existe)
    BEGIN
        UPDATE public.retiros
        SET proveedor = p_nombre_destino
        WHERE TRIM(UPPER(proveedor)) = TRIM(UPPER(p_nombre_origen));
        GET DIAGNOSTICS v_rows_retiros = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        v_rows_retiros := 0;
    END;

    -- Retornar resumen de la operación
    RETURN json_build_object(
        'success', true,
        'mensaje', 'Fusión de "' || p_nombre_origen || '" hacia "' || p_nombre_destino || '" completada.',
        'estadisticas', json_build_object(
            'compras', v_rows_compras,
            'movimientos_dinero', v_rows_movimientos,
            'retiros', v_rows_retiros,
            'detalles_adicionales', v_rows_detalles
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
