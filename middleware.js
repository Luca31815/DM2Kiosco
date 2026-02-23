// middleware.js - Versión ultra-compatible para Vercel Edge
export const config = {
    // Forzamos que corra en la raíz y rutas principales
    matcher: ['/', '/index.html', '/ventas', '/productos', '/reportes'],
};

export default function middleware(request) {
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    const allowedIps = (process.env.ALLOWED_IPS || '')
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i !== '');

    const normalizedIp = ip.toLowerCase();
    const isAllowed = allowedIps.includes(normalizedIp) || normalizedIp === '127.0.0.1' || normalizedIp === '::1';

    const mode = isAllowed ? 'live' : 'demo';

    // Log para ver en Vercel
    console.log(`[MIDDLEWARE] IP:${normalizedIp} | ALLOWED:${allowedIps.length} | MODE:${mode}`);

    // Retornamos respuesta con headers de debug obligatorios
    return new Response(null, {
        headers: {
            'x-middleware-next': '1',
            'x-debug-ip': normalizedIp,
            'x-debug-mode': mode,
            'Set-Cookie': `dashboard_mode=${mode}; Path=/; Max-Age=86400; SameSite=Lax`
        }
    });
}
