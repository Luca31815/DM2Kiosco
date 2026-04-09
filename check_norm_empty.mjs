import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const res = await client.query(`SELECT public.normalizar_texto('')`);
  console.log('empty:', res.rows[0]);
  const res2 = await client.query(`SELECT public.normalizar_texto('  ')`);
  console.log('spaces:', res2.rows[0]);
  await client.end();
}
run();
