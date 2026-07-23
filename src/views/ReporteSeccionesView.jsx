import React, { useState, useMemo } from 'react'
import { useReporteSecciones } from '../hooks/useData'
import { DEFAULT_SECTION_RULES } from '../utils/categoryCategorizer'
import { 
  BarChart3, 
  ShoppingBag, 
  Cigarette, 
  CupSoda, 
  Beer, 
  Candy, 
  Cookie, 
  Popcorn, 
  Milk, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  SlidersHorizontal,
  Plus,
  Layers,
  Sparkles,
  PackageCheck
} from 'lucide-react'

// Mapa de íconos por nombre
const ICON_MAP = {
  Cigarette: Cigarette,
  CupSoda: CupSoda,
  Beer: Beer,
  Candy: Candy,
  Cookie: Cookie,
  Popcorn: Popcorn,
  Milk: Milk,
  ShoppingBag: ShoppingBag,
  HelpCircle: HelpCircle
}

export default function ReporteSeccionesView() {
  const [periodDays, setPeriodDays] = useState(30)
  const [targetCoverageDays, setTargetCoverageDays] = useState(7)
  const [minComprasMes, setMinComprasMes] = useState(3)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSection, setExpandedSection] = useState(null)
  const [customRules, setCustomRules] = useState(DEFAULT_SECTION_RULES)
  
  // Modal para agregar categoría personalizada
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatKeywords, setNewCatKeywords] = useState('')

  const { sections, totals, loading } = useReporteSecciones({
    periodDays,
    targetCoverageDays,
    minComprasMes,
    customRules
  })

  // Filtrar secciones por búsqueda
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections

    const term = searchTerm.toLowerCase()
    return sections.filter(sec => 
      sec.name.toLowerCase().includes(term) ||
      sec.productos.some(p => p.nombre.toLowerCase().includes(term))
    )
  }, [sections, searchTerm])

  const toggleSection = (id) => {
    setExpandedSection(prev => prev === id ? null : id)
  }

  const handleAddCustomCategory = (e) => {
    e.preventDefault()
    if (!newCatName.trim() || !newCatKeywords.trim()) return

    const kws = newCatKeywords.split(',').map(k => k.trim().toUpperCase()).filter(Boolean)
    const newRule = {
      id: `custom_${Date.now()}`,
      name: newCatName.trim(),
      keywords: kws,
      color: '#a855f7',
      iconName: 'ShoppingBag'
    }

    setCustomRules(prev => [newRule, ...prev])
    setNewCatName('')
    setNewCatKeywords('')
    setShowAddModal(false)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Análisis y Reposición por Secciones
            </h1>
          </div>
          <p className="text-slate-400 text-sm pl-12">
            Visualizá las ganancias acumuladas por rubro y calculá el presupuesto exacto para ir a reponer stock.
          </p>
        </div>

        {/* Selector de Controles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por compras en los últimos 30 días */}
          <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 pl-2 font-medium">Filtrar compras:</span>
            {[
              { label: '> 3 Compras (30 días)', min: 3 },
              { label: '> 1 Compra', min: 1 },
              { label: 'Todos', min: 0 }
            ].map(item => (
              <button
                key={item.min}
                onClick={() => setMinComprasMes(item.min)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  minComprasMes === item.min
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 pl-2 font-medium">Período:</span>
            {[
              { label: '7 Días', days: 7 },
              { label: '30 Días', days: 30 },
              { label: '90 Días', days: 90 }
            ].map(item => (
              <button
                key={item.days}
                onClick={() => setPeriodDays(item.days)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  periodDays === item.days
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 pl-2 font-medium">Cobertura deseada:</span>
            {[
              { label: '7 días stock', days: 7 },
              { label: '14 días stock', days: 14 },
              { label: '30 días stock', days: 30 }
            ].map(item => (
              <button
                key={item.days}
                onClick={() => setTargetCoverageDays(item.days)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  targetCoverageDays === item.days
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Resumen Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ganancia */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="absolute right-3 top-3 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Ganancia Neta Global
          </p>
          <h3 className="text-2xl font-bold text-emerald-400">
            ${totals.totalGanancia.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span>Facturación:</span>
            <span className="font-semibold text-slate-200">${totals.totalIngresos.toLocaleString('es-AR')}</span>
          </p>
        </div>

        {/* Presupuesto Reposición */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-indigo-500/40 transition-all shadow-lg">
          <div className="absolute right-3 top-3 p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Ir a Comprar (Presupuesto Est.)
          </p>
          <h3 className="text-2xl font-bold text-indigo-400">
            ${totals.totalPresupuestoReposicion.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span>Para asegurar:</span>
            <span className="font-semibold text-indigo-300">{targetCoverageDays} días de ventas</span>
          </p>
        </div>

        {/* Unidades a Reponer */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg">
          <div className="absolute right-3 top-3 p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <PackageCheck className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Unidades a Reponer
          </p>
          <h3 className="text-2xl font-bold text-amber-400">
            {totals.totalUnidadesAReponer.toLocaleString('es-AR')} u.
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Distribuidas en <span className="font-semibold text-slate-200">{sections.length} secciones</span>
          </p>
        </div>

        {/* Productos en Alerta Crítica */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-rose-500/40 transition-all shadow-lg">
          <div className="absolute right-3 top-3 p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Stock Crítico / Agotado
          </p>
          <h3 className="text-2xl font-bold text-rose-400">
            {totals.totalProductosCriticos} items
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Requieren atención inmediata de compra
          </p>
        </div>
      </div>

      {/* Barra de Filtro de Búsqueda y Botón Nueva Categoría */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar sección o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-sm rounded-xl border border-slate-700 hover:border-indigo-500/50 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Regla / Categoría</span>
        </button>
      </div>

      {/* Cargando State */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
          <p className="text-slate-400 text-sm">Calculando rentabilidad y sugerencias por sección...</p>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No se encontraron secciones para los filtros aplicados</p>
        </div>
      ) : (
        /* Lista de Secciones */
        <div className="space-y-4">
          {filteredSections.map(sec => {
            const IconComponent = ICON_MAP[sec.iconName] || ShoppingBag
            const isExpanded = expandedSection === sec.id

            return (
              <div 
                key={sec.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all overflow-hidden shadow-lg"
              >
                {/* Encabezado de la Tarjeta de Sección */}
                <div 
                  onClick={() => toggleSection(sec.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3.5 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: `${sec.color}20`, color: sec.color, border: `1px solid ${sec.color}40` }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{sec.name}</h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                          {sec.productos.length} productos
                        </span>
                        {sec.productosCriticosCount > 0 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {sec.productosCriticosCount} faltantes
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Stock total: <span className="font-semibold text-slate-200">{sec.stockActualTotal} u.</span> | Vendidas: <span className="font-semibold text-slate-200">{sec.unidadesVendidas} u.</span>
                      </p>
                    </div>
                  </div>

                  {/* Resumen Financiero y Botón Reposición */}
                  <div className="flex flex-wrap items-center gap-6 md:gap-8 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    {/* Ganancia Neta */}
                    <div className="text-left md:text-right">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Ganancia Neta</span>
                      <span className="text-lg font-bold text-emerald-400">
                        ${sec.gananciaNeta.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs text-slate-400 block font-medium">
                        Margen: <span className="text-emerald-300 font-bold">{sec.margenPct}%</span>
                      </span>
                    </div>

                    {/* Sugerencia de Compra */}
                    <div className="text-left md:text-right bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/30">
                      <span className="text-xs text-indigo-300 uppercase tracking-wider block font-medium flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                        Ir a Comprar
                      </span>
                      <span className="text-base font-bold text-indigo-300">
                        ${sec.presupuestoReposicion.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs text-indigo-400 block font-semibold">
                        ({sec.unidadesAReponer} u. sugeridas)
                      </span>
                    </div>

                    <div className="text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Acordeón de Productos Internos */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Productos de la sección ({sec.productos.length})
                      </h4>
                      <span className="text-xs text-slate-400">
                        Sugerencia para asegurar {targetCoverageDays} días de ventas
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-medium">
                            <th className="pb-3 pr-4">Producto</th>
                            <th className="pb-3 px-3 text-right">Stock Actual</th>
                            <th className="pb-3 px-3 text-right">Vendidas ({periodDays}d)</th>
                            <th className="pb-3 px-3 text-right">Ganancia Neta</th>
                            <th className="pb-3 px-3 text-right">Comprar Sugerido</th>
                            <th className="pb-3 pl-3 text-right">Presupuesto Est.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {sec.productos.map(p => (
                            <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2.5 pr-4 font-semibold text-slate-200">
                                <div className="flex items-center gap-2">
                                  {p.esCritico && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" title="Stock en nivel crítico" />
                                  )}
                                  <span>{p.nombre}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium">
                                <span className={`px-2 py-0.5 rounded-md font-bold ${
                                  p.stockActual <= 0 ? 'bg-rose-500/20 text-rose-400' :
                                  p.esCritico ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {p.stockActual} u.
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                                {p.unidadesVendidas} u.
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                                ${p.gananciaNeta.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold">
                                {p.unidadesAComprar > 0 ? (
                                  <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                    + {p.unidadesAComprar} u.
                                  </span>
                                ) : (
                                  <span className="text-slate-500">Suficiente</span>
                                )}
                              </td>
                              <td className="py-2.5 pl-3 text-right font-bold text-indigo-300">
                                {p.unidadesAComprar > 0 
                                  ? `$${p.presupuestoItem.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` 
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para Agregar Nueva Regla/Categoría */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Agregar Regla de Categoría
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Nombre de la Sección
                </label>
                <input
                  type="text"
                  placeholder="ej. Vaper / Cigarrillos Electrónicos"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Palabras Clave (separadas por coma)
                </label>
                <textarea
                  placeholder="ej. VAPER, VAPE, POD, JUICE, ESENCIA"
                  value={newCatKeywords}
                  onChange={(e) => setNewCatKeywords(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Los productos que contengan cualquiera de estas palabras en su nombre se agruparán bajo esta sección.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Crear Sección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
