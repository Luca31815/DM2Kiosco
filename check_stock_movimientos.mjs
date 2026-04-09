import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT pb.producto_id, pb.nombre 
    FROM public.productos_base pb
    WHERE NOT EXISTS (
        SELECT 1 FROM public.stock_movimientos sm WHERE sm.producto = pb.nombre
    )
  `;
  const res = await client.query(q);
  console.log('Productos sin stock_movimientos (nombre exacto):', res.rows);

  const q2 = `
    SELECT pb.producto_id, pb.nombre 
    FROM public.productos_base pb
    WHERE NOT EXISTS (
        SELECT 1 FROM public.stock_movimientos sm WHERE public.normalizar_texto(sm.producto) = public.normalizar_texto(pb.nombre)
    )
  `;
  const res2 = await client.query(q2);
  console.log('Productos sin stock_movimientos (normalizado):', res2.rows);

  await client.end();
}
run();
