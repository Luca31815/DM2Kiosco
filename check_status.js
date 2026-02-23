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

async function checkStatus() {
    const { data, error } = await supabase.from('reservas').select('estado_reserva')
    if (error) {
        console.error('Error:', error.message)
    } else {
        const counts = {}
        data.forEach(r => {
            const status = r.estado_reserva
            counts[status] = (counts[status] || 0) + 1
        })
        console.log('Unique statuses in reservas table:')
        console.log(JSON.stringify(counts, null, 2))
    }
}

checkStatus()
