import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT public.normalizar_texto('Coca Cola');
  `;
  const res = await client.query(q);
  console.log('Result of normalizar_texto:', res.rows);

  await client.end();
}
run();
