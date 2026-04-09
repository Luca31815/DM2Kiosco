import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  // 1. Get current products
  const r1 = await client.query('SELECT count(*) from productos_base');
  console.log('Products before:', r1.rows[0].count);
  
  // 2. See what auditar_productos_faltantes says
  const rsinc = await client.query('SELECT public.auditar_productos_faltantes()');
  console.log('Auditar result:', JSON.stringify(rsinc.rows[0].auditar_productos_faltantes, null, 2));

  // 3. What would cleanup delete?
  const q = `
    SELECT pb.nombre 
    FROM public.productos_base pb
    WHERE pb.nombre NOT IN (
        SELECT public.normalizar_texto(producto) FROM public.ventas_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.compras_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.reservas_detalles WHERE producto IS NOT NULL
    )
  `;
  const rdel = await client.query(q);
  console.log('Orphaned found by my NOT IN query:', rdel.rows);

  // 4. Actually call the fn_cleanup_orphaned_products
  const rclean = await client.query('SELECT public.fn_cleanup_orphaned_products()');
  console.log('Cleanup result (deleted count):', rclean.rows[0].fn_cleanup_orphaned_products);

  await client.end();
}
run();
