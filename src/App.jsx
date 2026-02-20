import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import VentasView from './views/VentasView'
import ComprasView from './views/ComprasView'
import ReservasView from './views/ReservasView'
import ProductosView from './views/ProductosView'
import ReportesView from './views/ReportesView'
import ReporteProductosView from './views/ReporteProductosView'
import HistorialView from './views/HistorialView'
import HomeView from './views/HomeView'

import RentabilidadProductosView from './views/RentabilidadProductosView'
import AnalisisHorariosView from './views/AnalisisHorariosView'

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
        </Routes>
      </Layout>
    </Router>
  )
}


export default App
