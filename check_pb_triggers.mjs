import pg from 'pg';
import fs from 'fs';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT pg_get_triggerdef(t.oid) as trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'productos_base'
  `;
  const res = await client.query(q);
  fs.writeFileSync('check_pb_triggers.txt', res.rows.map(r => r.trigger_def).join('\n'));
  await client.end();
}
run();
