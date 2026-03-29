import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from "@vercel/speed-insights/react"
import Layout from './components/Layout'
import VentasView from './views/VentasView'
import ComprasView from './views/ComprasView'
import ReservasView from './views/ReservasView'
import ProductosView from './views/ProductosView'
import ReportesView from './views/ReportesView'
import ReporteProductosView from './views/ReporteProductosView'
import HistorialView from './views/HistorialView'
import HomeView from './views/HomeView'
import SystemView from './views/SystemView'
import RetirosView from './views/RetirosView'

import RentabilidadProductosView from './views/RentabilidadProductosView'
import AnalisisHorariosView from './views/AnalisisHorariosView'
import DuplicadosView from './views/DuplicadosView'

function App() {
  return (
    <Router>
      <Layout>
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
          <Route path="/duplicados" element={<DuplicadosView />} />
        </Routes>
      </Layout>
      <SpeedInsights />
    </Router>
  )
}

export default App