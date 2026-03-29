import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function checkTriggers() {
  try {
    await client.connect();
    
    // Check triggers on ventas_detalles
    const res = await client.query(`
        SELECT 
            tgname as trigger_name,
            pg_get_triggerdef(oid) as definition
        FROM pg_trigger 
        WHERE tgrelid = 'public.ventas_detalles'::regclass
    `);
    console.log('Triggers on ventas_detalles:');
    console.table(res.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkTriggers();
