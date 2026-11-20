import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from '@vercel/analytics/react'
import { SWRConfig } from 'swr'
import { LazyMotion, MotionConfig, useReducedMotion } from 'framer-motion'
import Layout from './components/Layout'
import AuthGuard from './components/AuthGuard'
import { Loader2 } from 'lucide-react'
import {
  HomeView,
  VentasView,
  ComprasView,
  ReservasView,
  TriageProductosView,
  ProductosView,
  RentabilidadProductosView,
  ReportesView,
  ReporteProductosView,
  AnalisisHorariosView,
  HistorialView,
  SystemView,
  RetirosView,
  ProveedoresView,
  DuplicadosView,
  DescalcesView,
  CarteraView,
  ReporteSeccionesView,
  ComparadorVentasView,
  RadarPreciosMesView,
  FinanzasApp,
} from './routes/lazyViews'

const loadMotionFeatures = () => import('./lib/motionFeatures').then((m) => m.default)

const GLOBAL_SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 10000,
  keepPreviousData: true,
  errorRetryCount: 2,
  shouldRetryOnError: (err) => err?.status !== 404 && err?.code !== 'PGRST205',
}

const LoadingScreen = () => (
  <div className="flex-1 flex items-center justify-center p-20">
    <Loader2 className="animate-spin h-10 w-10 text-blue-500 opacity-20" />
  </div>
)

function App() {
  const shouldReduceMotion = useReducedMotion()
  return (
    <SWRConfig value={GLOBAL_SWR_CONFIG}>
      <LazyMotion features={loadMotionFeatures}>
        <MotionConfig reducedMotion="user" transition={shouldReduceMotion ? { duration: 0 } : undefined}>
          <AuthGuard>
            <Router>
              <Routes>
                <Route
                  path="/finanzas/*"
                  element={
                    <Suspense fallback={<LoadingScreen />}>
                      <FinanzasApp />
                    </Suspense>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <Layout>
                      <Suspense fallback={<LoadingScreen />}>
                        <Routes>
                          <Route path="/" element={<HomeView />} />
                          <Route path="/ventas" element={<VentasView />} />
                          <Route path="/compras" element={<ComprasView />} />
                          <Route path="/reservas" element={<ReservasView />} />
                          <Route path="/triage" element={<TriageProductosView />} />
                          <Route path="/productos" element={<ProductosView />} />
                          <Route path="/rentabilidad" element={<RentabilidadProductosView />} />
                          <Route path="/reportes" element={<ReportesView />} />
                          <Route path="/reporte-productos" element={<ReporteProductosView />} />
                          <Route path="/analisis-horarios" element={<AnalisisHorariosView />} />
                          <Route path="/historial" element={<HistorialView />} />
                          <Route path="/sistema" element={<SystemView />} />
                          <Route path="/retiros" element={<RetirosView />} />
                          <Route path="/proveedores" element={<ProveedoresView />} />
                          <Route path="/duplicados" element={<DuplicadosView />} />
                          <Route path="/descalces" element={<DescalcesView />} />
                          <Route path="/cartera" element={<CarteraView />} />
                          <Route path="/secciones" element={<ReporteSeccionesView />} />
                          <Route path="/comparador-ventas" element={<ComparadorVentasView />} />
                          <Route path="/radar-precios" element={<RadarPreciosMesView />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  }
                />
              </Routes>
              <SpeedInsights />
              <Analytics />
            </Router>
          </AuthGuard>
        </MotionConfig>
      </LazyMotion>
    </SWRConfig>
  )
}

export default App
