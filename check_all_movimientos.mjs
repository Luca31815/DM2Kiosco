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
        SELECT 1 FROM public.ventas_detalles vd WHERE public.normalizar_texto(vd.producto) = pb.nombre
        UNION
        SELECT 1 FROM public.compras_detalles cd WHERE public.normalizar_texto(cd.producto) = pb.nombre
        UNION
        SELECT 1 FROM public.reservas_detalles rd WHERE public.normalizar_texto(rd.producto) = pb.nombre
        UNION
        SELECT 1 FROM public.stock_movimientos sm WHERE public.normalizar_texto(sm.producto) = pb.nombre
    )
  `;
  const res = await client.query(q);
  console.log('Productos q NO tienen ningun movimiento en ningun lado (comparando normalizado con nombre exacto de pb):', res.rows);

  const q2 = `
    SELECT pb.producto_id, pb.nombre 
    FROM public.productos_base pb
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ventas_detalles vd WHERE public.normalizar_texto(vd.producto) = public.normalizar_texto(pb.nombre)
        UNION
        SELECT 1 FROM public.compras_detalles cd WHERE public.normalizar_texto(cd.producto) = public.normalizar_texto(pb.nombre)
        UNION
        SELECT 1 FROM public.reservas_detalles rd WHERE public.normalizar_texto(rd.producto) = public.normalizar_texto(pb.nombre)
        UNION
        SELECT 1 FROM public.stock_movimientos sm WHERE public.normalizar_texto(sm.producto) = public.normalizar_texto(pb.nombre)
    )
  `;
  const res2 = await client.query(q2);
  console.log('Productos q NO tienen ningun movimiento en ningun lado (ambos normalizados):', res2.rows);

  // Let's see some products with 0 stock to maybe guess which one it is
  const q3 = `
    SELECT nombre, ultimo_precio_venta FROM public.productos_base ORDER BY fecha_actualizacion DESC LIMIT 10;
  `;
  const res3 = await client.query(q3);
  console.log('Ultimos productos actualizados:', res3.rows.map(r => r.nombre));

  await client.end();
}
run();
