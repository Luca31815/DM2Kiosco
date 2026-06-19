import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
    try {
        console.log('Querying a sample from movimientos_dinero...')
        const { data: movs, error: e1 } = await supabase.from('movimientos_dinero').select('*').limit(5)
        if (e1) throw e1
        console.log('movimientos_dinero sample:', JSON.stringify(movs, null, 2))

        console.log('Querying distinct payment methods (metodo) from movimientos_dinero...')
        const { data: methods, error: e2 } = await supabase.from('movimientos_dinero').select('metodo')
        if (e2) throw e2
        const uniqueMethods = [...new Set(methods.map(m => m.metodo))]
        console.log('Unique methods:', uniqueMethods)

    } catch (err) {
        console.error('Error:', err)
    }
}

test()
