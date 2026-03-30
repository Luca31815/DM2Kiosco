import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT reserva_id FROM public.reservas LIMIT 5");
  console.log('Reservas IDs:', res.rows.map(r => r.reserva_id));
  const res2 = await client.query("SELECT reserva_id FROM public.reservas_detalles LIMIT 5");
  console.log('Details IDs:', res2.rows.map(r => r.reserva_id));
  await client.end();
}
run();
