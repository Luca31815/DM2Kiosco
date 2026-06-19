/* global process */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
    try {
        console.log('Querying vista_reporte_diario...')
        const { data: diario, error: e1 } = await supabase.from('vista_reporte_diario').select('*').limit(3)
        if (e1) throw e1
        console.log('Diario sample:', JSON.stringify(diario, null, 2))

        console.log('\nQuerying vista_reporte_semanal...')
        const { data: semanal, error: e2 } = await supabase.from('vista_reporte_semanal').select('*').limit(3)
        if (e2) throw e2
        console.log('Semanal sample:', JSON.stringify(semanal, null, 2))

        console.log('\nQuerying vista_reporte_mensual...')
        const { data: mensual, error: e3 } = await supabase.from('vista_reporte_mensual').select('*').limit(3)
        if (e3) throw e3
        console.log('Mensual sample:', JSON.stringify(mensual, null, 2))

        console.log('\nQuerying vista_reporte_ventas_periodico...')
        const { data: periodico, error: e4 } = await supabase.from('vista_reporte_ventas_periodico').select('*').limit(3)
        if (e4) throw e4
        console.log('Periodico sample:', JSON.stringify(periodico, null, 2))

    } catch (err) {
        console.error('Error:', err)
    }
}

test()
