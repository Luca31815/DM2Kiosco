import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT * FROM public.stock_movimientos LIMIT 3;
  `;
  const res = await client.query(q);
  console.log('Sample stock_movimientos:', res.rows);

  await client.end();
}
run();
