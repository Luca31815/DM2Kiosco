import pg from 'pg';
import fs from 'fs';
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
    where proname = 'fn_cleanup_orphaned_products'
  `);
  fs.writeFileSync('check_cleanup.txt', res.rows[0]?.prosrc || 'Not found');
  await client.end();
}
run();
