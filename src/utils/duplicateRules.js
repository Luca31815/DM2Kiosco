/**
 * Lógica centralizada para la detección de duplicados y reglas de negocio
 * DM2Kiosco - Sistema de Validación de Catálogo
 */

// --- LISTAS DE REFERENCIA (DICCIONARIO DE NEGOCIO) ---

export const FLAVORS = [
    'FRAMBUESA', 'CHOCOLATE', 'FRUTILLA', 'MENTA', 'MIEL', 'MENTOLADO', 'CONVERTIBLE', 'FUSION', 'ON', 'ICE', 'ORIGINAL', 'COMUN', 'BOX', 'ZERO', 'LIGHT', 'PLACER', 'PERA', 'MANZANA', 'LIMA', 'COLA', 'BLANCO', 'LIMON', 'AZUL', 'ROJO', 'VERDE', 'PECESITOS', 'PECECITOS', 'OSITOS', 'MORITAS', 'ORIGEN', 'ECONOMICO', 'SELECT', 'UVA', 'ANANA', 'AGUA CREAM', 'NARANJA', 'POMELO', 'CAFE', 'OCEANO', 'COCO', 'VAINILLA', 'DURAZNO', 'DULCE DE LECHE', 'MARACUYA', 'MULTIFRUTAL', 'MARMOLADO', 'JAMON SERRANO', 'BLACK', 'MARINE', 'PALITOS', 'DISCOS', 'QUESO', 'ASADO', 'MIXTO'
];

export const BRANDS = [
    'JORGITO', 'JORGELIN', 'RASTA', 'GULA', 'GUAYMALLEN', 'TERRABUSI', 'MILKA', 'SUCHARD', 'HAVANNA', 'CACHAFAZ', 'VICENTIN', 'CAPITAN', 'BLOCK', 'SPEED', 'MONSTER', 'FLYING', 'RED BULL', 'SCHNEIDER', 'BRAHMA', 'KARITA', 'CALIPSO', 'DONCELLA', 'MASTER', 'MELBOURNE', 'AQUARIUS', 'LEVITE'
];

export const FORMATS = ['GRANDE', 'MEDIANA', 'CHICA', 'CHICO', 'MINI'];

// --- HELPERS DE NORMALIZACIÓN ---

export const normalizeName = (name) => {
    if (!name) return "";
    return name.toUpperCase()
        .replace(/\bNEGRO\b/g, 'CHOCOLATE')
        .replace(/\bNEGRA\b/g, 'CHOCOLATE')
        .replace(/\bROJA\b/g, 'ROJO')
        .replace(/\bBLANCA\b/g, 'BLANCO')
        .replace(/\bPEQUEÑO\b/g, 'CHICA')
        .replace(/\bPEQUEÑA\b/g, 'CHICA')
        .replace(/\bGRANDES\b/g, 'GRANDE')
        .replace(/\bCHICAS\b/g, 'CHICA')
        .replace(/\bCHICOS\b/g, 'CHICA')
        .replace(/\bCONVERTIBLE\b/g, 'MENTOLADO');
};

export const getQuantity = (words) => {
    const units = ['U', 'G', 'GR', 'GRS', 'KG', 'K', 'ML', 'L', 'CC', 'CM3'];
    for (const word of words) {
        const match = word.match(/^(\d+(?:\.\d+)?)([A-Z1-3]+)$/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];
            if (units.includes(unit)) return { value, unit };
        }
        const xMatch = word.match(/^X(\d+)$/);
        if (xMatch) return { value: parseInt(xMatch[1]), unit: 'X' };
    }
    return null;
};

const findAllAttrs = (nameNormalized, words, list) => list.filter(attr => {
    if (attr.includes(' ')) return nameNormalized.includes(attr);
    return words.includes(attr);
});

const getContradiction = (attrs1, attrs2) => {
    if (attrs1.length === 0 || attrs2.length === 0) return null;
    const onlyIn1 = attrs1.filter(a => !attrs2.includes(a));
    const onlyIn2 = attrs2.filter(a => !attrs1.includes(a));
    
    if (onlyIn1.length > 0 && onlyIn2.length > 0) {
        return `${onlyIn1.join('/')} vs ${onlyIn2.join('/')}`;
    }
    return null;
};

// --- FUNCIÓN PRINCIPAL DE VALIDACIÓN ---

/**
 * Valida si dos productos son probablemente duplicados basándose en reglas de negocio estrictas.
 * @returns {Object} { isDuplicate: boolean, reason: string | null }
 */
export const checkDuplicateStatus = (p1, p2, ignoredPairs = []) => {
    if (!p1 || !p2) return { isDuplicate: false, reason: "Datos incompletos" };

    // 1. Pares ignorados
    const pairKey = [String(p1.producto_id || p1.id), String(p2.producto_id || p2.id)].sort().join('|');
    if (ignoredPairs.includes(pairKey)) return { isDuplicate: false, reason: "Ignorado por el usuario" };

    // 2. Normalización
    const name1 = normalizeName(p1.nombre);
    const name2 = normalizeName(p2.nombre);
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);

    // 3. Sabores y Variedades
    const flavors1 = findAllAttrs(name1, words1, FLAVORS);
    const flavors2 = findAllAttrs(name2, words2, FLAVORS);
    const flavorConflict = getContradiction(flavors1, flavors2);
    if (flavorConflict) return { isDuplicate: false, reason: `Conflicto de sabor: ${flavorConflict}` };

    // 4. Marcas
    const brands1 = findAllAttrs(name1, words1, BRANDS);
    const brands2 = findAllAttrs(name2, words2, BRANDS);
    const brandConflict = getContradiction(brands1, brands2);
    if (brandConflict) return { isDuplicate: false, reason: `Diferente Marca: ${brandConflict}` };

    // 5. Estructura (Simple vs Triple)
    const hasSimple1 = words1.includes('SIMPLE');
    const hasTriple1 = words1.includes('TRIPLE');
    const hasSimple2 = words2.includes('SIMPLE');
    const hasTriple2 = words2.includes('TRIPLE');
    if ((hasSimple1 && hasTriple2) || (hasTriple1 && hasSimple2)) {
        return { isDuplicate: false, reason: "Estructura contradictoria (Simple vs Triple)" };
    }

    // 6. Formatos
    const formats1 = findAllAttrs(name1, words1, FORMATS);
    const formats2 = findAllAttrs(name2, words2, FORMATS);
    const formatConflict = getContradiction(formats1, formats2);
    if (formatConflict) return { isDuplicate: false, reason: `Diferente Formato: ${formatConflict}` };

    // 7. Cantidades (Regla de Oro)
    const q1 = getQuantity(words1);
    const q2 = getQuantity(words2);
    if (q1 && q2) {
        if (q1.value !== q2.value || q1.unit !== q2.unit) {
            // Excepción de cigarrillos (Comun + Box = 22)
            const isCigaretteException = (q1.unit === 'U' && q2.unit === 'U' && (q1.value + q2.value === 22) && Math.abs(q1.value - q2.value) === 2);
            if (!isCigaretteException) {
                return { isDuplicate: false, reason: `Medida diferente: ${q1.value}${q1.unit} vs ${q2.value}${q2.unit}` };
            }
        }
    }

    // 8. Precios/Costos
    const price1 = parseFloat(p1.ultimo_precio_venta || p1.precio_venta || 0);
    const price2 = parseFloat(p2.ultimo_precio_venta || p2.precio_venta || 0);
    const cost1 = parseFloat(p1.ultimo_costo_compra || 0);
    const cost2 = parseFloat(p2.ultimo_costo_compra || 0);

    const pricesMatch = (price1 > 0 && price2 > 0) ? (Math.abs(price1 - price2) / Math.max(price1, price2) < 0.35) : false;
    const costsMatch = (cost1 > 0 && cost2 > 0) ? (Math.abs(cost1 - cost2) / Math.max(cost1, cost2) < 0.05) : false;
    
    // Si no hay datos financieros, lo dejamos pasar como sospechoso basado solo en nombre
    if ((price1 === 0 || price2 === 0) && (cost1 === 0 || cost2 === 0)) return { isDuplicate: true, reason: null };
    
    if (pricesMatch || costsMatch) return { isDuplicate: true, reason: null };

    return { isDuplicate: false, reason: "Precios/Costos muy distantes para ser el mismo producto" };
};
