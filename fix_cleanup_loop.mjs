import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sqlFixCleanup = `
CREATE OR REPLACE FUNCTION public.fn_cleanup_orphaned_products()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Un producto es huérfano si NO aparece en ninguna operación (ventas, compras o reservas)
    -- Importante: Usamos public.normalizar_texto() para asegurar que coincidimos con los nombres en el catálogo
    -- de la misma forma que lo hace la función de auditoría.
    DELETE FROM public.productos_base 
    WHERE nombre NOT IN (
        SELECT public.normalizar_texto(producto) FROM public.ventas_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.compras_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.reservas_detalles WHERE producto IS NOT NULL
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sqlFixCleanup);
    console.log('Function fn_cleanup_orphaned_products updated successfully with normalization support.');
    await client.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
run();
