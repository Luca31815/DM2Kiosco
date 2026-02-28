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

        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'logs_auditoria'
            ORDER BY ordinal_position;
        `);
        const cols = res.rows.map(r => r.column_name);
        console.log('EXACT_COLUMNS:', JSON.stringify(cols));

        const sample = await client.query("SELECT * FROM public.logs_auditoria ORDER BY fecha_actualizacion DESC LIMIT 1;");
        console.log('SAMPLE_DATA:', JSON.stringify(sample.rows[0], null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

run();
