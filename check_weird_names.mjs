import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT sm.producto
    FROM public.stock_movimientos sm
    WHERE public.normalizar_texto(sm.producto) = 'BANDEJA DE TRIPLE DE MIGA'
  `;
  const res = await client.query(q);
  console.log('BANDEJA:', res.rows);

  const q2 = `
    SELECT sm.producto
    FROM public.stock_movimientos sm
    WHERE public.normalizar_texto(sm.producto) = 'CHICLE BOBALOO'
  `;
  const res2 = await client.query(q2);
  console.log('CHICLE:', res2.rows);

  await client.end();
}
run();
