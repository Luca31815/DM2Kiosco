import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function checkVentasSigns() {
  try {
    await client.connect();
    
    const productName = 'CIGARRILLOS LUCKY STRIKE ECONOMICO';
    console.log(`--- Ventas detalles for: ${productName} ---`);
    const res = await client.query('SELECT * FROM public.ventas_detalles WHERE producto = $1 LIMIT 5', [productName]);
    console.table(res.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkVentasSigns();
