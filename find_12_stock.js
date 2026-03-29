import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function findProblematicProduct() {
  try {
    await client.connect();
    
    // Find products with stock = 12
    const res = await client.query('SELECT * FROM public.productos WHERE stock_actual = 12');
    console.log('--- Products with stock = 12 ---');
    console.table(res.rows);

    if (res.rows.length === 0) {
        console.log('No products found with stock = 12.');
        return;
    }

    for (const prod of res.rows) {
        console.log(`--- Movements for: ${prod.nombre} ---`);
        const resMovs = await client.query('SELECT * FROM public.stock_movimientos WHERE producto = $1', [prod.nombre]);
        console.table(resMovs.rows);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

findProblematicProduct();
