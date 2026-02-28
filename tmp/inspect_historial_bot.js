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

        console.log('--- COLUMNS: historial_bot ---');
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'historial_bot'
            ORDER BY ordinal_position;
        `);
        console.table(cols.rows);

        console.log('\n--- SAMPLE DATA: historial_bot ---');
        const res = await client.query("SELECT * FROM public.historial_bot ORDER BY fecha DESC LIMIT 5;");
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

run();
