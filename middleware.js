export default function middleware(request) {
    // 1. Obtener la IP del cliente de la forma más robusta posible en Vercel Edge
    // Vercel Edge Runtime proporciona request.ip directamente
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // 2. Obtener lista de IPs permitidas (limpiando espacios y normalizando a minúsculas para IPv6)
    const allowedIps = (process.env.ALLOWED_IPS || '')
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i !== '');

    // 3. Normalizar IP actual para la comparación
    const normalizedIp = ip.toLowerCase();

    // 4. Determinar modo (localhost siempre es live)
    const isLocal = normalizedIp === '127.0.0.1' || normalizedIp === '::1';
    const isAllowed = allowedIps.includes(normalizedIp) || isLocal;

    const mode = isAllowed ? 'live' : 'demo';

    // LOG DE DEPURACIÓN (Se verá en el panel "Logs" de Vercel)
    console.log(`[AUTH] IP Detectada: ${normalizedIp} | Permitidas: ${allowedIps.join(', ')} | Modo: ${mode}`);

    // 5. Retornar respuesta con la cookie
    return new Response(null, {
        headers: {
            'x-middleware-next': '1',
            'Set-Cookie': `dashboard_mode=${mode}; Path=/; Max-Age=86400; SameSite=Lax`
        }
    });
}

export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
