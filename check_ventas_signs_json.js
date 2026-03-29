import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function checkVentasSigns() {
  try {
    await client.connect();
    
    const productName = 'CIGARRILLOS LUCKY STRIKE ECONOMICO';
    const res = await client.query('SELECT * FROM public.ventas_detalles WHERE producto = $1', [productName]);
    
    fs.writeFileSync('ventas_lucky_details.json', JSON.stringify(res.rows, null, 2));
    console.log(`Guardados ${res.rows.length} detalles de ventas en ventas_lucky_details.json`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkVentasSigns();
