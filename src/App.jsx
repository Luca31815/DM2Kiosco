import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { MotionConfig, useReducedMotion } from 'framer-motion'
import Layout from './components/Layout'
import { Loader2 } from 'lucide-react'

// Lazy load views for better performance
const HomeView = lazy(() => import('./views/HomeView'))
const VentasView = lazy(() => import('./views/VentasView'))
const ComprasView = lazy(() => import('./views/ComprasView'))
const ReservasView = lazy(() => import('./views/ReservasView'))
const ProductosView = lazy(() => import('./views/ProductosView'))
const ReportesView = lazy(() => import('./views/ReportesView'))
const ReporteProductosView = lazy(() => import('./views/ReporteProductosView'))
const HistorialView = lazy(() => import('./views/HistorialView'))
const SystemView = lazy(() => import('./views/SystemView'))
const RetirosView = lazy(() => import('./views/RetirosView'))
const ProveedoresView = lazy(() => import('./views/ProveedoresView'))
const RentabilidadProductosView = lazy(() => import('./views/RentabilidadProductosView'))
const AnalisisHorariosView = lazy(() => import('./views/AnalisisHorariosView'))
const DuplicadosView = lazy(() => import('./views/DuplicadosView'))
const DescalcesView = lazy(() => import('./views/DescalcesView'))
const CarteraView = lazy(() => import('./views/CarteraView'))

const LoadingScreen = () => (
  <div className="flex-1 flex items-center justify-center p-20">
    <Loader2 className="animate-spin h-10 w-10 text-blue-500 opacity-20" />
  </div>
)

function App() {
  const shouldReduceMotion = useReducedMotion()
  return (
    <MotionConfig transition={shouldReduceMotion ? { duration: 0 } : undefined}>
    <Router>
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/ventas" element={<VentasView />} />
            <Route path="/compras" element={<ComprasView />} />
            <Route path="/reservas" element={<ReservasView />} />
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
          </Routes>
        </Suspense>
      </Layout>
      <SpeedInsights />
    </Router>
    </MotionConfig>
  )
}

export default App