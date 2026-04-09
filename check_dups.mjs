import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT public.normalizar_texto(nombre) as norm, string_agg(nombre, ' | ') as exact_names, count(*)
    FROM public.productos_base
    GROUP BY norm
    HAVING count(*) > 1;
  `;
  const res = await client.query(q);
  console.log('Productos con mismo nombre normalizado:', res.rows);

  await client.end();
}
run();
