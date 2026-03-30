import pg from 'pg';
import fs from 'fs';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT prosrc FROM pg_proc WHERE proname = 'recalcular_reserva'");
  fs.writeFileSync('recalc_full.sql', res.rows[0]?.prosrc);
  console.log('Saved to recalc_full.sql');
  await client.end();
}
run();
