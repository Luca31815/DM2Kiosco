import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'reservas_detalles'");
  console.log('Triggers on reservas_detalles:', res.rows);
  
  const res2 = await client.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'ventas_detalles'");
  console.log('Triggers on ventas_detalles:', res2.rows);
  
  await client.end();
}
run();
