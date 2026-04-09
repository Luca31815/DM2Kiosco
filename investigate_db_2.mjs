import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const fs = await import('fs');
  let out = '';

  const tables = await client.query(`
    select c.table_name, c.column_name, c.data_type
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name in ('productos_base', 'productos_sinonimos', 'logs_auditoria', 'historial_bot')
    order by c.table_name, c.ordinal_position;
  `);
  out += '=== TABLES ===\n' + JSON.stringify(tables.rows, null, 2) + '\n\n';

  const funcs = await client.query(`
    SELECT p.proname AS nombre_funcion, pg_get_functiondef(p.oid) AS codigo_fuente
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND (p.proname ilike '%buscar%' or p.proname ilike '%corregir%' or p.proname ilike '%simil%' or p.proname ilike '%product%');
  `);
  out += '=== FUNCTIONS ===\n' + JSON.stringify(funcs.rows, null, 2) + '\n\n';

  fs.writeFileSync('db_investigation.json', out);
  console.log('Saved to db_investigation.json');
  await client.end();
}
run();
