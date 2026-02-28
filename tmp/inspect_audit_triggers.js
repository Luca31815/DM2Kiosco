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

        console.log('--- FINDING TRIGGERS ---');
        const triggers = await client.query(`
            SELECT 
                event_object_table as table_name,
                trigger_name,
                action_statement
            FROM information_schema.triggers 
            WHERE trigger_name ILIKE '%audit%'
               OR action_statement ILIKE '%logs_auditoria%'
            ORDER BY table_name;
        `);
        console.table(triggers.rows);

        if (triggers.rows.length > 0) {
            const funcName = triggers.rows[0].action_statement.match(/(\w+)\(\)/)?.[1];
            if (funcName) {
                console.log(`\n--- INSPECTING FUNCTION: ${funcName} ---`);
                const funcDef = await client.query(`
                    SELECT routine_definition 
                    FROM information_schema.routines 
                    WHERE routine_name = $1;
                `, [funcName]);
                console.log(funcDef.rows[0]?.routine_definition);
            }
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

run();
