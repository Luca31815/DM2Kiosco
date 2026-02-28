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

        console.log('--- SAMPLED LOGS ---');
        const res = await client.query("SELECT * FROM public.logs_auditoria ORDER BY fecha DESC LIMIT 5;");
        res.rows.forEach((row, i) => {
            console.log(`LOG ${i + 1}: Action=${row.accion} Table=${row.tabla_nombre} User=${row.usuario}`);
            console.log(`NEW DATA KEYS: ${Object.keys(row.valor_nuevo || {}).join(', ')}`);
            if (row.valor_nuevo && row.valor_nuevo.contexto) {
                console.log(`CONTEXT: ${JSON.stringify(row.valor_nuevo.contexto)}`);
            }
        });

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

run();
