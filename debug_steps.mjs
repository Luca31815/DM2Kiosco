import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    console.log('Step 1: Get Item Info');
    const res1 = await client.query("SELECT producto, cantidad, precio_unitario FROM public.reservas_detalles WHERE id = 293");
    console.log('Result 1:', res1.rows[0]);

    console.log('Step 2: Update Item');
    await client.query("UPDATE public.reservas_detalles SET precio_unitario = 3000, subtotal = 3000 WHERE id = 293");
    console.log('Update 1 OK');

    console.log('Step 3: Update Stock Mov');
    // Esto podria fallar si referencia_id o producto no coinciden
    await client.query("UPDATE public.stock_movimientos SET cantidad = 1 WHERE UPPER(referencia_id) = 'RES_1771695969833' AND producto = 'BEBIDA JUGO AQUARIUS PERA 1.5L'");
    console.log('Update 2 OK');

    console.log('Step 4: Recalculate');
    await client.query("SELECT public.recalcular_reserva('RES_1771695969833')");
    console.log('Recalculate OK');

  } catch (e) {
    console.error('ERROR during steps:', e.message);
  } finally {
    await client.end();
  }
}
run();
