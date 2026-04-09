import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT view_definition 
    FROM information_schema.views 
    WHERE table_name = 'productos';
  `;
  const res = await client.query(q);
  console.log('Definition of productos view:', res.rows[0]?.view_definition || 'Not found');
  await client.end();
}
run();
