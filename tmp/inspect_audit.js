import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

async function run() {
    const client = new pg.Client({ connectionString });
    try {
        await client.connect();

        console.log('--- COLUMNS: logs_auditoria ---');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'logs_auditoria';
        `);
        console.table(res.rows);

        console.log('\n--- SAMPLE DATA (FIRST ROW) ---');
        const sample = await client.query("SELECT * FROM public.logs_auditoria ORDER BY fecha DESC LIMIT 1;");
        console.log(JSON.stringify(sample.rows[0], null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

run();
