export default function middleware(request) {
    // 1. Obtener IP
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'Desconocida';

    // 2. Obtener lista de IPs (Normalización agresiva)
    const allowedIpsRaw = process.env.ALLOWED_IPS || '';
    const allowedIps = allowedIpsRaw
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i !== '');

    const normalizedIp = ip.toLowerCase();
    const isAllowed = allowedIps.includes(normalizedIp) || normalizedIp === '127.0.0.1' || normalizedIp === '::1';

    const mode = isAllowed ? 'live' : 'demo';

    // LOGS DE EMERGENCIA
    console.log(`MIDDLEWARE_RUNNING: IP=${normalizedIp} | ALLOWED=${allowedIps.join('|')} | MODE=${mode}`);

    // 3. Respuesta con Headers de Debug (para que el usuario vea en F12 -> Network)
    return new Response(null, {
        headers: {
            'x-middleware-next': '1',
            'x-debug-mode': mode,
            'x-debug-ip': normalizedIp,
            'Set-Cookie': `dashboard_mode=${mode}; Path=/; Max-Age=86400; SameSite=Lax`
        }
    });
}

// QUITAMOS EL MATCHER PARA QUE CORRA EN TODO Y VER SI LOGUEA ALGO
// export const config = { ... }
