import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvqpuldrukzhxnxfdabi.supabase.co';
const supabaseKey = process.argv[2];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('hello_world'); // Provoking an error to see if we can run custom query?
    // Actually we can't query pg_proc directly from anon key usually. 
    // Is there a way? Let's try with service role if I use DB_POSTGRESDB_PASSWORD
}
run();
