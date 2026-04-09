import pg from 'pg';
import fs from 'fs';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf',
  password: 'Elmegatrol_123',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT proname, pg_get_functiondef(oid) as def FROM pg_proc WHERE proname LIKE 'corregir_operacion%' OR proname = 'fn_buscar_productos_similares'`);
  fs.writeFileSync('db_backup_functions.json', JSON.stringify(res.rows, null, 2));
  console.log('Saved to db_backup_functions.json:', res.rows.map(r => r.proname));
  await client.end();
}
run().catch(console.error);
