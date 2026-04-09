import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const res = await client.query(`
    select prosrc 
    from pg_proc 
    where proname = 'auditar_productos_faltantes'
  `);
  console.log(res.rows[0]?.prosrc || 'Not found');
  await client.end();
}
run();
