// Paleta armónica de colores e íconos sugeridos para categorías dinámicas
const COLOR_PALETTE = [
  { color: '#ec4899', iconName: 'Candy' },
  { color: '#06b6d4', iconName: 'CupSoda' },
  { color: '#f43f5e', iconName: 'Cigarette' },
  { color: '#10b981', iconName: 'HeartPulse' },
  { color: '#8b5cf6', iconName: 'Cookie' },
  { color: '#84cc16', iconName: 'Popcorn' },
  { color: '#0284c7', iconName: 'Milk' },
  { color: '#f59e0b', iconName: 'ShoppingBag' },
  { color: '#14b8a6', iconName: 'Sparkles' },
  { color: '#f97316', iconName: 'Utensils' },
  { color: '#6366f1', iconName: 'Layers' },
  { color: '#a855f7', iconName: 'ShoppingBag' }
]

function getVisualsForCategory(catName) {
  const norm = normalizeText(catName)
  if (norm.includes('BEBIDA')) return { color: '#06b6d4', iconName: 'CupSoda' }
  if (norm.includes('CIGARRILLO') || norm.includes('TABACO')) return { color: '#f43f5e', iconName: 'Cigarette' }
  if (norm.includes('GOLOSINA') || norm.includes('CHOCOLATE')) return { color: '#ec4899', iconName: 'Candy' }
  if (norm.includes('GALLETITA') || norm.includes('BIZCOCHO')) return { color: '#8b5cf6', iconName: 'Cookie' }
  if (norm.includes('SNACK')) return { color: '#84cc16', iconName: 'Popcorn' }
  if (norm.includes('FARMACIA') || norm.includes('CUIDADO')) return { color: '#10b981', iconName: 'HeartPulse' }
  if (norm.includes('LACTEO') || norm.includes('FRESCO')) return { color: '#0284c7', iconName: 'Milk' }
  if (norm.includes('COMIDA') || norm.includes('ELABORADO')) return { color: '#f97316', iconName: 'Utensils' }
  if (norm.includes('LIMPIEZA')) return { color: '#14b8a6', iconName: 'Sparkles' }
  if (norm.includes('ALMACEN') || norm.includes('COMESTIBLE')) return { color: '#f59e0b', iconName: 'ShoppingBag' }
  if (norm.includes('VARIOS') || norm.includes('SERVICIO') || norm.includes('BAZAR')) return { color: '#64748b', iconName: 'Layers' }

  // Hash determinista para cualquier categoría nueva o personalizada
  let hash = 0
  for (let i = 0; i < catName.length; i++) {
    hash = catName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[idx]
}

/**
 * Convierte un nombre en formato "TITULO O TODO MAYUSCULA" a Title Case legible
 */
function toDisplayTitle(str) {
  if (!str) return 'Sin Categorizar'
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (['y', 'e', 'o', 'u', 'de', 'del', 'la', 'las', 'el', 'los'].includes(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Normaliza una cadena para búsquedas (mayúsculas, remueve acentos)
 */
export function normalizeText(text) {
  if (!text) return ''
  return String(text)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/**
 * Clasifica un producto dinámicamente según la categoría real que viene de la base de datos
 */
export function categorizeProduct(productInput, customRules = []) {
  let catStr = ''
  let productName = ''

  if (typeof productInput === 'object' && productInput !== null) {
    catStr = productInput.categoria || ''
    productName = productInput.nombre || productInput.producto || ''
  } else {
    productName = String(productInput || '')
  }

  const normCat = normalizeText(catStr).trim()

  // 1. Reglas personalizadas creadas en pantalla por el usuario (si existieran)
  if (Array.isArray(customRules)) {
    const userRules = customRules.filter(r => String(r.id).startsWith('custom_'))
    const normName = normalizeText(productName)
    for (const rule of userRules) {
      for (const kw of (rule.keywords || [])) {
        const normKw = normalizeText(kw)
        if (!normKw) continue
        const regex = new RegExp(`(?:^|\\s|\\b)${normKw}(?:$|\\s|\\b)`, 'i')
        if (regex.test(normName)) {
          return rule
        }
      }
    }
  }

  // 2. Si tiene categoría en la base de datos, la usa directamente
  if (normCat && normCat !== 'SIN_CATEGORIA') {
    const visuals = getVisualsForCategory(catStr)
    return {
      id: normCat,
      name: toDisplayTitle(catStr),
      rawCategory: catStr,
      color: visuals.color,
      iconName: visuals.iconName
    }
  }

  // 3. Sin categoría / Pendiente
  return {
    id: 'otros',
    name: 'Sin Categorizar / Otros',
    color: '#94a3b8',
    iconName: 'HelpCircle'
  }
}


/**
 * Agrupa productos por sección y calcula las métricas financieras y de reabastecimiento
 */
export function aggregateBySections(products = [], options = {}) {
  const {
    periodDays = 30,
    targetCoverageDays = 7,
    customRules = [],
    lotesMap = {}
  } = options

  const sectionMap = {}

  // Inicializar sección por defecto para productos sin categoría
  sectionMap['otros'] = {
    id: 'otros',
    name: 'Sin Categorizar / Otros',
    color: '#94a3b8',
    iconName: 'HelpCircle',
    ingresosTotales: 0,
    costoMercaderiaVendida: 0,
    gananciaNeta: 0,
    unidadesVendidas: 0,
    stockActualTotal: 0,
    valorStockCosto: 0,
    unidadesAReponer: 0,
    presupuestoReposicion: 0,
    productosCriticosCount: 0,
    subcategoriasMap: {},
    productos: []
  }

  // Si hay reglas manuales creadas en pantalla, agregarlas
  if (Array.isArray(customRules)) {
    customRules.filter(r => String(r.id).startsWith('custom_')).forEach(rule => {
      sectionMap[rule.id] = {
        ...rule,
        ingresosTotales: 0,
        costoMercaderiaVendida: 0,
        gananciaNeta: 0,
        unidadesVendidas: 0,
        stockActualTotal: 0,
        valorStockCosto: 0,
        unidadesAReponer: 0,
        presupuestoReposicion: 0,
        productosCriticosCount: 0,
        subcategoriasMap: {},
        productos: []
      }
    })
  }

  products.forEach(p => {
    const rawNombre = p.producto || p.nombre || 'Producto sin nombre'
    const section = categorizeProduct(p, customRules)

    // Si la sección no existe en el mapa (nueva categoría descubierta en la DB), inicializarla dinámicamente
    if (!sectionMap[section.id]) {
      sectionMap[section.id] = {
        ...section,
        ingresosTotales: 0,
        costoMercaderiaVendida: 0,
        gananciaNeta: 0,
        unidadesVendidas: 0,
        stockActualTotal: 0,
        valorStockCosto: 0,
        unidadesAReponer: 0,
        presupuestoReposicion: 0,
        productosCriticosCount: 0,
        subcategoriasMap: {},
        productos: []
      }
    }
    const secObj = sectionMap[section.id]


    const subcatKey = (p.subcategoria && p.subcategoria !== 'GENERAL') ? p.subcategoria : 'General'
    if (!secObj.subcategoriasMap[subcatKey]) {
      secObj.subcategoriasMap[subcatKey] = {
        name: subcatKey,
        unidadesVendidas: 0,
        ingresosTotales: 0,
        stockActualTotal: 0,
        productosCount: 0
      }
    }
    const subObj = secObj.subcategoriasMap[subcatKey]

    const normNombre = rawNombre.toLowerCase().trim()
    const isCigarrillo = section.id === 'cigarrillos' || normNombre.includes('cigarrillo')
    const loteHabitual = lotesMap[normNombre] || (isCigarrillo ? 5 : 1)

    const unidadesVendidas = Number(p.unidades_vendidas || p.unidadesVendidas || 0)
    const ventasCount = Number(p.ventas_count || p.ventasCount || 0)
    const unidadesPorVenta = ventasCount > 0 ? (unidadesVendidas / ventasCount) : 0
    const esVentaAislada = ventasCount === 1 && unidadesVendidas >= 3
    const unidadesVendidas30d = Number(p.unidades_vendidas_30d || unidadesVendidas)
    const ingresosTotales = Number(p.ingresos_totales || p.ingreso_total || p.recaudacion_total || (unidadesVendidas * (p.ultimo_precio_venta || p.precio_venta || 0)) || 0)
    const costoMercaderiaVendida = Number(p.costo_mercaderia_vendida || p.costo_total || 0)
    const gananciaNeta = Number(p.ganancia_neta || p.ganancia || (ingresosTotales - costoMercaderiaVendida))

    const stockActual = Number(p.stock_actual !== undefined ? p.stock_actual : (p.stock !== undefined ? p.stock : 0))
    const costoUnitario = Number(p.ultimo_costo_compra || p.costo_actual || p.ppp_costo_unitario || 0)
    const precioVentaUnitario = Number(p.ultimo_precio_venta || p.precio_venta || 0)

    // 1. Suavizado Exponencial (60% 7d, 40% 30d)
    const v7d = (periodDays === 7 ? unidadesVendidas : (p.unidades_vendidas_7d || 0)) / 7
    const v30d = unidadesVendidas30d / 30
    let ventasDiarias = (v7d > 0 && v30d > 0) ? (0.6 * v7d + 0.4 * v30d) : (periodDays > 0 ? (unidadesVendidas / periodDays) : 0)

    // 2. Factor Fin de Semana (+20%) para rubros de alta rotación fin de semana
    const isWeekendCategory = ['cervezas', 'bebidas', 'cigarrillos', 'snacks', 'alfajores'].includes(section.id)
    if (isWeekendCategory && ventasDiarias > 0) {
      ventasDiarias *= 1.20
    }

    const stockDeseado = Math.ceil(ventasDiarias * targetCoverageDays)
    
    let rawNeeded = 0
    if (stockActual < stockDeseado) {
      rawNeeded = stockDeseado - Math.max(0, stockActual)
    } else if (stockActual <= 0 && unidadesVendidas > 0) {
      rawNeeded = Math.max(5, Math.ceil(ventasDiarias * targetCoverageDays))
    }

    // 3. (Sin safety stock extra: la cobertura elegida ya define el stock deseado y el
    //    redondeo al lote habitual aporta el margen de compra)

    // 4. Redondeo a Lote Habitual de Compra
    let unidadesAComprar = rawNeeded
    if (rawNeeded > 0) {
      if (isCigarrillo) {
        const step = loteHabitual >= 10 ? 10 : 5
        unidadesAComprar = Math.ceil(rawNeeded / step) * step
      } else if (loteHabitual > 1) {
        unidadesAComprar = Math.ceil(rawNeeded / loteHabitual) * loteHabitual
      } else {
        unidadesAComprar = Math.ceil(rawNeeded)
      }
    }

    const presupuestoItem = unidadesAComprar * (costoUnitario || (precioVentaUnitario * 0.7))
    const esCritico = stockActual <= 0 || (ventasDiarias > 0 && stockActual < (ventasDiarias * 2))

    secObj.ingresosTotales += ingresosTotales
    secObj.costoMercaderiaVendida += costoMercaderiaVendida
    secObj.gananciaNeta += gananciaNeta
    secObj.unidadesVendidas += unidadesVendidas
    secObj.stockActualTotal += Math.max(0, stockActual)
    secObj.valorStockCosto += Math.max(0, stockActual) * costoUnitario
    secObj.unidadesAReponer += unidadesAComprar
    secObj.presupuestoReposicion += presupuestoItem
    if (esCritico) secObj.productosCriticosCount += 1

    subObj.unidadesVendidas += unidadesVendidas
    subObj.ingresosTotales += ingresosTotales
    subObj.stockActualTotal += Math.max(0, stockActual)
    subObj.productosCount += 1

    secObj.productos.push({
      id: p.producto_id || p.id,
      nombre: rawNombre,
      categoria: p.categoria || 'SIN_CATEGORIA',
      subcategoria: p.subcategoria || 'GENERAL',
      unidadesVendidas,
      ventasCount,
      unidadesPorVenta: Number(unidadesPorVenta.toFixed(1)),
      esVentaAislada,
      ingresosTotales,
      costoMercaderiaVendida,
      gananciaNeta,
      stockActual,
      costoUnitario,
      precioVentaUnitario,
      ventasDiarias,
      stockDeseado,
      unidadesAComprar,
      loteHabitual,
      presupuestoItem,
      esCritico
    })
  })

  // Convertir subcategoriasMap a array en cada sección
  Object.values(sectionMap).forEach(sec => {
    sec.subcategorias = Object.values(sec.subcategoriasMap || {}).sort((a, b) => b.ingresosTotales - a.ingresosTotales)
  })

  const sectionsList = Object.values(sectionMap)
    .filter(sec => sec.productos.length > 0 || sec.id !== 'otros')
    .map(sec => {
      const margenPct = sec.ingresosTotales > 0 
        ? ((sec.gananciaNeta / sec.ingresosTotales) * 100).toFixed(1)
        : '0.0'

      sec.productos.sort((a, b) => {
        if (b.unidadesAComprar !== a.unidadesAComprar) {
          return b.unidadesAComprar - a.unidadesAComprar
        }
        return b.gananciaNeta - a.gananciaNeta
      })

      return {
        ...sec,
        margenPct: Number(margenPct)
      }
    })
    .sort((a, b) => b.gananciaNeta - a.gananciaNeta)

  return sectionsList
}
