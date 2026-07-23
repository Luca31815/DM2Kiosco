// categoryCategorizer.js - Categorización por palabras clave y cálculo de métricas de sección

export const DEFAULT_SECTION_RULES = [
  {
    id: 'cigarrillos',
    name: 'Cigarrillos y Afines',
    keywords: ['CIGARRILLO', 'CIGARRILLOS', 'MARLBORO', 'CHESTERFIELD', 'PHILIP', 'LUCKY', 'CAMEL', 'ROTHMANS', 'RED POINT', 'MASTER', 'MELBOURNE', 'TABACO', 'ENCENDEDOR', 'TABACOS', 'LIGGETT', 'PARLIAMENT', 'VAPE', 'VAPER', 'FUEGO', 'PAPELILLO'],
    color: '#ef4444',
    iconName: 'Cigarette'
  },
  {
    id: 'cervezas',
    name: 'Cervezas y Alcohol',
    keywords: ['CERVEZA', 'CERVEZAS', 'FERNET', 'VINO', 'APERITIVO', 'SCHNEIDER', 'BRAHMA', 'QUILMES', 'HEINEKEN', 'CORONA', 'STELLA', 'ANDES', 'IMPERIAL', 'GIN', 'RON', 'VODKA', 'GANCIA', 'BRANCA', 'CAMPARI', 'CHAMPAGNE', 'BODEGA', 'ALCOHOLICA', 'ALCOHOL', 'PETACA', 'WHISKY', 'LICOR'],
    color: '#f59e0b',
    iconName: 'Beer'
  },
  {
    id: 'bebidas',
    name: 'Bebidas y Gaseosas',
    keywords: ['GASEOSA', 'GASEOSAS', 'COCA', 'FANTA', 'SPRITE', 'PEPSI', 'MANAO', 'AGUA', 'JUGO', 'JUGOS', 'SER', 'LEVIANTE', 'TERMA', 'POWERADE', 'GATORADE', 'AQUARIUS', 'PRAP', 'SIFÓN', 'SIFON', 'SODA', 'SPEED', 'MONSTER', 'RED BULL', 'BEBIDA', 'BEBIDAS'],
    color: '#06b6d4',
    iconName: 'CupSoda'
  },
  {
    id: 'galletitas',
    name: 'Galletitas y Bakery',
    keywords: ['GALLETITA', 'GALLETITAS', 'BIZCOCHO', 'BIZCOCHOS', 'DON SATUR', 'OREO', 'CHOCLINA', 'TRAVIATA', 'CREMONA', 'FACTURA', 'PAN', 'TOSTADA', 'TOSTADAS', 'PEPA', 'PEPAS', 'MAGDALENA', 'SONRISAS', 'OPERAS', 'RUMBA', 'CHOCOLINAS', 'CEREAL', 'BARRA', 'BUDIN', 'BUDINES'],
    color: '#8b5cf6',
    iconName: 'Cookie'
  },
  {
    id: 'alfajores',
    name: 'Alfajores y Chocolates',
    keywords: ['ALFAJOR', 'ALFAJORES', 'CHOCOLATE', 'CHOCOLATES', 'BOMBON', 'BOMBONES', 'GOMITA', 'GOMITAS', 'CHICLE', 'CARAMELO', 'CARAMELOS', 'TURRON', 'TURRONES', 'OBLITA', 'VILLARS', 'GUAYMALLEN', 'CAPITAN', 'JORGITO', 'SUCHARD', 'BLOCK', 'SHOT', 'COFLER', 'TITA', 'RHODESIA', 'FLYNN', 'HALLS', 'MENTHO', 'KINDER', 'FERRERO', 'NUTELLA'],
    color: '#ec4899',
    iconName: 'Candy'
  },
  {
    id: 'snacks',
    name: 'Snacks y Copetín',
    keywords: ['SNACK', 'SNACKS', 'PAPAS', 'PAPA', 'CHIZITO', 'CHIZITOS', 'MANI', 'KRACHITOS', 'LAYS', 'DORITOS', 'CHEETOS', 'PALITOS', 'CHICHARRON', 'SALADIX', 'ACEITUNAS', 'NACHOS', 'ALMENDRAS', 'NUECES'],
    color: '#10b981',
    iconName: 'Popcorn'
  },
  {
    id: 'lacteos',
    name: 'Lácteos y Fríos',
    keywords: ['LECHE', 'YOGUR', 'QUESO', 'FIAMBRE', 'JAMON', 'PALETA', 'SALAME', 'MANTECA', 'CREMA', 'SERENISIMA', 'ILOLAY', 'VERONICA', 'SANGUCHE', 'SANGUCHES', 'EMPANADA', 'TARTA'],
    color: '#3b82f6',
    iconName: 'Milk'
  },
  {
    id: 'almacen',
    name: 'Almacén e Higiene',
    keywords: ['ACEITE', 'HARINA', 'FIDEOS', 'ARROZ', 'AZUCAR', 'YERBA', 'SAL', 'SHAMPOO', 'JABON', 'AFEITADORA', 'GILLETTE', 'PAPEL', 'ROLLO', 'DESODORANTE', 'PRESERVATIVO', 'PRESERVATIVOS', 'TOALLITA', 'TOALLITAS', 'DESINFECTANTE', 'LAVANDINA'],
    color: '#64748b',
    iconName: 'ShoppingBag'
  }
]

/**
 * Normaliza una cadena para búsquedas (mayúsculas, remueve acentos)
 */
function normalizeText(text) {
  if (!text) return ''
  return String(text)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/**
 * Clasifica un producto según la lista de reglas de palabras clave o categoría de base de datos
 */
export function categorizeProduct(productInput, customRules = DEFAULT_SECTION_RULES) {
  let catStr = ''
  let productName = ''

  if (typeof productInput === 'object' && productInput !== null) {
    catStr = productInput.categoria || ''
    productName = productInput.nombre || productInput.producto || ''
  } else {
    productName = String(productInput || '')
  }

  // 1. Si el producto ya tiene categoría asignada en la DB, matchear directamente
  if (catStr && catStr !== 'SIN_CATEGORIA') {
    const normCat = normalizeText(catStr)
    const match = customRules.find(r => 
      normalizeText(r.id) === normCat || 
      normalizeText(r.name).includes(normCat) ||
      normCat.includes(normalizeText(r.id))
    )
    if (match) return match
  }

  // 2. Fallback a búsqueda de palabras clave en el nombre
  const normName = normalizeText(productName)
  for (const rule of customRules) {
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw)
      const regex = new RegExp(`(?:^|\\s|\\b)${normKw}(?:$|\\s|\\b)`, 'i')
      if (regex.test(normName)) {
        return rule
      }
    }
  }

  return {
    id: 'otros',
    name: 'Sin Categorizar / Otros',
    keywords: [],
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
    customRules = DEFAULT_SECTION_RULES,
    lotesMap = {}
  } = options

  const sectionMap = {}

  const rulesWithOtros = [
    ...customRules,
    {
      id: 'otros',
      name: 'Sin Categorizar / Otros',
      keywords: [],
      color: '#94a3b8',
      iconName: 'HelpCircle'
    }
  ]

  rulesWithOtros.forEach(rule => {
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

  products.forEach(p => {
    const rawNombre = p.producto || p.nombre || 'Producto sin nombre'
    const section = categorizeProduct(p, customRules)
    const secObj = sectionMap[section.id] || sectionMap['otros']

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

    // 3. Safety Stock (+1 lote) para productos de alta rotación (>= 3 compras en el mes)
    const isAltaRotacion = (p.compras_count || 0) >= 3
    if (isAltaRotacion && rawNeeded > 0 && loteHabitual > 1) {
      rawNeeded += loteHabitual
    }

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

      sec.productos.sort((a, b) => b.gananciaNeta - a.gananciaNeta)

      return {
        ...sec,
        margenPct: Number(margenPct)
      }
    })
    .sort((a, b) => b.gananciaNeta - a.gananciaNeta)

  return sectionsList
}
