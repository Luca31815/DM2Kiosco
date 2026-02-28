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
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name IN ('ventas', 'movimientos_dinero', 'historial_bot', 'logs_auditoria', 'reservas')
            ORDER BY table_name, ordinal_position;
        `);
        const grouped = res.rows.reduce((acc, row) => {
            acc[row.table_name] = acc[row.table_name] || [];
            acc[row.table_name].push(row.column_name);
            return acc;
        }, {});
        console.log('GROUPED_COLUMNS:', JSON.stringify(grouped, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

run();
