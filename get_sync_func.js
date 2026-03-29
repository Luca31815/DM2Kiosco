import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function getFuncDef() {
  try {
    await client.connect();
    const res = await client.query("SELECT pg_get_functiondef(p.oid) as def FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'sincronizar_movimientos_stock'");
    console.log('Function Definition:');
    console.log(res.rows[0].def);
  } catch (err) {
    console.error('Error fetching function def:', err);
  } finally {
    await client.end();
  }
}

getFuncDef();
