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

async function checkReportView() {
    console.log('--- VERIFICACIÓN DE VISTA REPORTE DIARIO ---')
    const { data, error } = await supabase.from('vista_reporte_diario').select('*').limit(1)

    if (error) {
        console.error('Error:', error.message)
    } else if (data && data.length > 0) {
        console.log('Columnas encontradas:', Object.keys(data[0]))
        console.log('Fila muestra:', data[0])

        // El frontend espera: cant_ventas, cant_compras, ingresos, egresos, balance
        const expected = ['cant_ventas', 'ingresos', 'egresos', 'balance']
        const missing = expected.filter(col => !Object.keys(data[0]).includes(col))

        if (missing.length > 0) {
            console.log('⚠️ FALTAN COLUMNAS CRÍTICAS:', missing)
            console.log('Esto confirma que el SQL en Supabase es ANTIGUO.')
        } else {
            console.log('✅ Las columnas coinciden con el esquema nuevo.')
        }
    } else {
        console.log('⚠️ La vista está vacía.')
    }
}

checkReportView()
