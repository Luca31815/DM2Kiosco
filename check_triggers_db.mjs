import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_table IN ('productos_base', 'ventas_detalles', 'compras_detalles', 'reservas_detalles')
  `;
  const res = await client.query(q);
  console.log('Triggers:', res.rows);
  await client.end();
}
run();
