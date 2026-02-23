import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnv() {
    const envPath = path.resolve('.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const env = {}
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=')
        if (key && value) env[key.trim()] = value.join('=').trim()
    })
    return env
}

const env = loadEnv()
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function getViewDefinition() {
    console.log('--- BUSCANDO DEFINICIÓN DE VISTA HITOS ---')
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: "SELECT view_definition FROM information_schema.views WHERE table_name = 'vista_hitos_ventas' AND table_schema = 'public'"
    })

    // Si no tenemos rpc('execute_sql'), probamos con una consulta directa si service_role lo permite
    // Pero usualmente execute_sql es una función personalizada.
    // Probemos con query directo si podemos via pg_get_viewdef
    const { data: data2, error: error2 } = await supabase.from('pg_views').select('definition').eq('viewname', 'vista_hitos_ventas').single();

    if (error2) {
        console.log('Error 2:', error2.message);
        // Intentemos listar las columnas y ver si podemos deducir
    } else {
        console.log('Definición:\n', data2.definition);
    }
}

getViewDefinition()
