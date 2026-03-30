import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM public.reservas_detalles LIMIT 3");
  console.log('Sample Details:', res.rows);
  const resInfo = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reservas_detalles'");
  console.log('Columns:', resInfo.rows);
  await client.end();
}
run();
