import { lazy } from 'react'

export const ROUTE_LOADERS = {
    '/': () => import('../views/HomeView'),
    '/ventas': () => import('../views/VentasView'),
    '/compras': () => import('../views/ComprasView'),
    '/reservas': () => import('../views/ReservasView'),
    '/triage': () => import('../views/TriageProductosView'),
    '/productos': () => import('../views/ProductosView'),
    '/rentabilidad': () => import('../views/RentabilidadProductosView'),
    '/reportes': () => import('../views/ReportesView'),
    '/reporte-productos': () => import('../views/ReporteProductosView'),
    '/analisis-horarios': () => import('../views/AnalisisHorariosView'),
    '/historial': () => import('../views/HistorialView'),
    '/sistema': () => import('../views/SystemView'),
    '/retiros': () => import('../views/RetirosView'),
    '/proveedores': () => import('../views/ProveedoresView'),
    '/duplicados': () => import('../views/DuplicadosView'),
    '/descalces': () => import('../views/DescalcesView'),
    '/cartera': () => import('../views/CarteraView'),
    '/secciones': () => import('../views/ReporteSeccionesView'),
    '/comparador-ventas': () => import('../views/ComparadorVentasView'),
    '/radar-precios': () => import('../views/RadarPreciosMesView'),
    '/finanzas': () => import('../finanzas/FinanzasApp'),
}

const prefetchedRoutes = new Set()

export function prefetchRoute(pathname) {
    if (!pathname) return
    const normalizedPath = pathname.startsWith('/finanzas') ? '/finanzas' : pathname
    if (prefetchedRoutes.has(normalizedPath)) return

    const loader = ROUTE_LOADERS[normalizedPath]
    if (!loader) return

    prefetchedRoutes.add(normalizedPath)
    loader().catch(() => {
        prefetchedRoutes.delete(normalizedPath)
    })
}

export const HomeView = lazy(ROUTE_LOADERS['/'])
export const VentasView = lazy(ROUTE_LOADERS['/ventas'])
export const ComprasView = lazy(ROUTE_LOADERS['/compras'])
export const ReservasView = lazy(ROUTE_LOADERS['/reservas'])
export const TriageProductosView = lazy(ROUTE_LOADERS['/triage'])
export const ProductosView = lazy(ROUTE_LOADERS['/productos'])
export const RentabilidadProductosView = lazy(ROUTE_LOADERS['/rentabilidad'])
export const ReportesView = lazy(ROUTE_LOADERS['/reportes'])
export const ReporteProductosView = lazy(ROUTE_LOADERS['/reporte-productos'])
export const AnalisisHorariosView = lazy(ROUTE_LOADERS['/analisis-horarios'])
export const HistorialView = lazy(ROUTE_LOADERS['/historial'])
export const SystemView = lazy(ROUTE_LOADERS['/sistema'])
export const RetirosView = lazy(ROUTE_LOADERS['/retiros'])
export const ProveedoresView = lazy(ROUTE_LOADERS['/proveedores'])
export const DuplicadosView = lazy(ROUTE_LOADERS['/duplicados'])
export const DescalcesView = lazy(ROUTE_LOADERS['/descalces'])
export const CarteraView = lazy(ROUTE_LOADERS['/cartera'])
export const ReporteSeccionesView = lazy(ROUTE_LOADERS['/secciones'])
export const ComparadorVentasView = lazy(ROUTE_LOADERS['/comparador-ventas'])
export const RadarPreciosMesView = lazy(ROUTE_LOADERS['/radar-precios'])
export const FinanzasApp = lazy(ROUTE_LOADERS['/finanzas'])
