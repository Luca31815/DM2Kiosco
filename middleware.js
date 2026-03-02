// middleware.js - Versión ultra-compatible para Vercel Edge
export const config = {
    // Forzamos que corra en la raíz y rutas principales
    matcher: ['/', '/index.html', '/ventas', '/productos', '/reportes'],
};

export default function middleware(request) {
    const url = new URL(request.nextUrl || request.url);
    const adminKey = url.searchParams.get('admin');
    const authSecret = process.env.AUTH_SECRET || 'admin-master';

    // Capturamos IP
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const normalizedIp = ip.toLowerCase();

    // Whitelist de IPs
    const allowedIps = (process.env.ALLOWED_IPS || '')
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i !== '');

    // Verificamos si ya tiene sesión autorizada
    const hasAuthCookie = request.cookies?.get('auth_session')?.value === 'true' || 
                         request.headers.get('cookie')?.includes('auth_session=true');

    // Lógica de autorización
    let isAllowed = allowedIps.includes(normalizedIp) || 
                    normalizedIp === '127.0.0.1' || 
                    normalizedIp === '::1' || 
                    hasAuthCookie;

    // Si intenta entrar con la clave maestra
    let setAuthCookie = false;
    if (adminKey && adminKey === authSecret) {
        isAllowed = true;
        setAuthCookie = true;
    }

    const mode = isAllowed ? 'live' : 'demo';

    // Log para ver en Vercel
    console.log(`[MIDDLEWARE] IP:${normalizedIp} | ALLOWED:${isAllowed} | MODE:${mode} | BYPASS:${setAuthCookie}`);

    const response = new Response(null, {
        headers: {
            'x-middleware-next': '1',
            'x-debug-ip': normalizedIp,
            'x-debug-mode': mode,
            'Set-Cookie': `dashboard_mode=${mode}; Path=/; Max-Age=86400; SameSite=Lax`
        }
    });

    // Si se usó la clave maestra, seteamos cookie de larga duración (1 año)
    if (setAuthCookie) {
        response.headers.append('Set-Cookie', `auth_session=true; Path=/; Max-Age=31536000; SameSite=Lax`);
    }

    return response;
}
