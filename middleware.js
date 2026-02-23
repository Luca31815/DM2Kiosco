export default function middleware(request) {
    // 1. Obtener la IP del cliente
    // Vercel rellena x-forwarded-for con la IP del cliente
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // 2. Obtener lista de IPs permitidas de variables de entorno
    // Se lee de process.env en el Edge Runtime de Vercel
    const allowedIps = (process.env.ALLOWED_IPS || '')
        .split(',')
        .map(i => i.trim());

    // 3. Determinar modo (localhost siempre es live)
    const isLocal = ip === '127.0.0.1' || ip === '::1';
    const isAllowed = allowedIps.includes(ip) || isLocal;

    const mode = isAllowed ? 'live' : 'demo';

    // 4. Retornar una respuesta que "continúe" a la app pero setee la cookie
    // Usamos el header interno de Vercel 'x-middleware-next' para permitir el paso
    // en proyectos que NO son Next.js.
    return new Response(null, {
        headers: {
            'x-middleware-next': '1',
            'Set-Cookie': `dashboard_mode=${mode}; Path=/; Max-Age=86400; SameSite=Lax`
        }
    });
}

// Configuración opcional para filtrar rutas
export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
