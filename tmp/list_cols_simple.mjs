import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'logs_auditoria' ORDER BY ordinal_position;");
        console.log('COLUMNS_START');
        res.rows.forEach(r => console.log(r.column_name));
        console.log('COLUMNS_END');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
