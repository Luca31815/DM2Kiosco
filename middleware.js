import { NextResponse } from 'next/server';

export function middleware(request) {
    const response = NextResponse.next();

    // 1. Obtener la IP del cliente (priorizando el header de Vercel)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // 2. Obtener lista de IPs permitidas de variables de entorno
    // Formato esperado: "1.2.3.4, 5.6.7.8"
    const allowedIps = (process.env.ALLOWED_IPS || '')
        .split(',')
        .map(i => i.trim());

    // 3. Determinar modo (localhost siempre es live)
    const isLocal = ip === '127.0.0.1' || ip === '::1';
    const isAllowed = allowedIps.includes(ip) || isLocal;

    const mode = isAllowed ? 'live' : 'demo';

    // 4. Setear cookie para el frontend (expira en 24h)
    response.cookies.set('dashboard_mode', mode, {
        path: '/',
        maxAge: 60 * 60 * 24,
        sameSite: 'lax',
    });

    console.log(`IP: ${ip} | Mode: ${mode}`);

    return response;
}

// Configurar para que corra en todas las rutas del dashboard
export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
