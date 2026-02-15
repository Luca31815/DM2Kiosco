import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import VentasView from './views/VentasView'
import ComprasView from './views/ComprasView'
import ReservasView from './views/ReservasView'
import ProductosView from './views/ProductosView'
import ReportesView from './views/ReportesView'
import HistorialView from './views/HistorialView'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<VentasView />} />
          <Route path="/compras" element={<ComprasView />} />
          <Route path="/reservas" element={<ReservasView />} />
          <Route path="/productos" element={<ProductosView />} />
          <Route path="/reportes" element={<ReportesView />} />
          <Route path="/historial" element={<HistorialView />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
