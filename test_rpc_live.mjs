import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Testing update for ID 293 (RES_1771695969833)...');
  
  const payload = {
    id_final: 'RES_1771695969833',
    items: [{
      id: 293,
      producto: 'BEBIDA JUGO AQUARIUS PERA 1.5L',
      nuevo_precio: 3000
    }]
  };
  
  const res = await client.query("SELECT public.corregir_operacion_v18($1) as result", [JSON.stringify(payload)]);
  console.log('RPC Result:', res.rows[0].result);
  
  const resVerify = await client.query("SELECT precio_unitario, subtotal FROM public.reservas_detalles WHERE id = 293");
  console.log('Verification After:', resVerify.rows[0]);
  
  // Revert change
  await client.query("UPDATE public.reservas_detalles SET precio_unitario = 2800, subtotal = 2800 WHERE id = 293");
  console.log('Reverted test change.');
  
  await client.end();
}
run();
