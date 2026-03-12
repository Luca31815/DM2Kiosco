// middleware.js - Versión ultra-compatible para Vercel Edge
export const config = {
    // Forzamos que corra en la raíz y rutas principales
    matcher: ['/', '/index.html', '/ventas', '/productos', '/reportes'],
};

export default function middleware(request) {
    const url = new URL(request.nextUrl || request.url);
    const adminKey = url.searchParams.get('admin');
    const isLogout = url.searchParams.get('logout') === 'true';
    const authSecret = process.env.AUTH_SECRET || 'admin-master';

    // Verificamos si ya tiene sesión autorizada mediante la cookie
    const hasAuthCookie = request.cookies?.get('auth_session')?.value === 'true' || 
                         request.headers.get('cookie')?.includes('auth_session=true');

    // Lógica de autorización: SOLO por cookie o por clave maestra
    // Se eliminó la whitelist de IPs por seguridad
    let isAllowed = hasAuthCookie;
    
    let setAuthCookie = false;
    let clearAuthCookie = false;

    // Si intenta entrar con la clave maestra
    if (adminKey && adminKey === authSecret) {
        isAllowed = true;
        setAuthCookie = true;
    }

    // Si solicita cerrar sesión
    if (isLogout) {
        isAllowed = false;
        clearAuthCookie = true;
    }

    const mode = isAllowed ? 'live' : 'demo';
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    console.log(`[MIDDLEWARE] IP:${ip} | ALLOWED:${isAllowed} | MODE:${mode} | ACTION:${setAuthCookie ? 'LOGIN' : (clearAuthCookie ? 'LOGOUT' : 'NONE')}`);

    const response = new Response(null, {
        headers: {
            'x-middleware-next': '1',
            'x-debug-ip': ip,
            'x-debug-mode': mode,
            'Set-Cookie': `dashboard_mode=${mode}; Path=/; Max-Age=86400; SameSite=Lax`
        }
    });

    // Si se usó la clave maestra, seteamos cookie de larga duración
    if (setAuthCookie) {
        response.headers.append('Set-Cookie', `auth_session=true; Path=/; Max-Age=31536000; SameSite=Lax`);
    }

    // Si se solicitó cerrar sesión, borramos la cookie
    if (clearAuthCookie) {
        response.headers.append('Set-Cookie', `auth_session=; Path=/; Max-Age=0; SameSite=Lax`);
    }

    return response;
}
