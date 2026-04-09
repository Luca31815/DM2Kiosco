import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'productos_base' AND table_schema = 'public';
  `;
  const res = await client.query(q);
  console.log('Columns in productos_base:', res.rows.map(r => r.column_name));

  await client.end();
}
run();
