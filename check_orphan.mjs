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
    WHERE pb.nombre NOT IN (
        SELECT public.normalizar_texto(producto) FROM public.ventas_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.compras_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.reservas_detalles WHERE producto IS NOT NULL
    )
  `;
  const res = await client.query(q);
  console.log('Productos huerfanos (segun el NOT IN de la funcion):', res.rows);

  const q2 = `
    SELECT count(*) FROM public.ventas_detalles WHERE public.normalizar_texto(producto) IS NULL;
  `;
  const res2 = await client.query(q2);
  console.log('Null normalizations en ventas:', res2.rows[0].count);
  
  const qc = `
    SELECT count(*) FROM public.compras_detalles WHERE public.normalizar_texto(producto) IS NULL;
  `;
  const resc = await client.query(qc);
  console.log('Null normalizations en compras:', resc.rows[0].count);
  
  const qr = `
    SELECT count(*) FROM public.reservas_detalles WHERE public.normalizar_texto(producto) IS NULL;
  `;
  const resr = await client.query(qr);
  console.log('Null normalizations en reservas:', resr.rows[0].count);

  await client.end();
}
run();
