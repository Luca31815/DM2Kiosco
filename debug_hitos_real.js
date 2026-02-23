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

async function debugHitosReal() {
    const dates = ['2026-02-19', '2026-02-20']
    console.log('--- VERIFICACIÓN DE HITOS REALES (DATOS CRUDOS) ---')

    for (const d of dates) {
        const { data: sales } = await supabase.from('ventas')
            .select('fecha, total_venta')
            .ilike('fecha', `${d}%`)
            .order('fecha', { ascending: true })

        console.log(`\nFecha: ${d} | Ventas Totales: ${sales?.length || 0}`)

        if (sales && sales.length >= 10) {
            console.log(`Venta #10: ${sales[9].fecha}`)
        }
        if (sales && sales.length >= 20) {
            console.log(`Venta #20: ${sales[19].fecha}`)
        }
        if (sales && sales.length >= 30) {
            console.log(`Venta #30: ${sales[29].fecha}`)
        }

        const { data: hitos } = await supabase.from('vista_hitos_ventas').select('*').eq('dia', d)
        console.log(`Vista Hitos reporta:`, hitos.map(h => `${h.hito_logrado} @ ${h.hora_exacta}`))
    }
}

debugHitosReal()
