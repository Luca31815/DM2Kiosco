import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT pb.nombre 
    FROM public.productos_base pb
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ventas_detalles vd WHERE public.normalizar_texto(vd.producto) = public.normalizar_texto(pb.nombre)
        UNION
        SELECT 1 FROM public.compras_detalles cd WHERE public.normalizar_texto(cd.producto) = public.normalizar_texto(pb.nombre)
        UNION
        SELECT 1 FROM public.reservas_detalles rd WHERE public.normalizar_texto(rd.producto) = public.normalizar_texto(pb.nombre)
    )
  `;
  const res = await client.query(q);
  console.log('Productos sin ventas, compras, ni reservas (ambos normalizados):', res.rows.map(r => r.nombre));

  // Also check if any product has literally NO movements at all, even using ILIKE
  await client.end();
}
run();
