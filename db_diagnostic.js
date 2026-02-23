import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Helper para cargar .env.local
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

async function diagnostic() {
    console.log('--- DIAGNÓSTICO DE BASE DE DATOS ---')

    const checks = [
        { name: 'Ventas Search (Tipos)', table: 'vista_ventas_search', select: '*' },
        { name: 'Reservas Search (Columnas)', table: 'vista_reservas_search', select: '*' },
        { name: 'Reporte Diario (Columnas)', table: 'vista_reporte_diario', select: '*' },
        { name: 'Análisis Horario (Columnas)', table: 'vista_analisis_horario_diario', select: '*' }
    ]

    for (const check of checks) {
        const { data, error } = await supabase.from(check.table).select(check.select).limit(1)
        if (error) {
            console.error(`❌ ${check.name}: ERROR ->`, error.message)
        } else {
            console.log(`✅ ${check.name}: OK`)
            if (data && data.length > 0) {
                console.log('   Muestra de columnas:', Object.keys(data[0]))
                console.log('   Valores:', data[0])
            } else {
                console.log('   ⚠️ La vista no devuelve datos (Vacía)')
            }
        }
    }

    console.log('\n--- VERIFICACIÓN DE CAPITALIZACIÓN EN TABLAS BASE ---')
    const { data: schema, error: schemaError } = await supabase.rpc('get_table_info', { t_name: 'compras' })
    // Nota: Es posible que get_table_info no exista, intentamos una query directa al esquema si falla.

    console.log('--- FIN DEL DIAGNÓSTICO ---')
}

diagnostic()
