/**
 * Lógica centralizada para la detección de duplicados y reglas de negocio
 * DM2Kiosco - Sistema de Validación de Catálogo v3
 */

// --- LISTAS DE REFERENCIA (DICCIONARIO DE NEGOCIO) ---

export const BRANDS = [
    // Alfajores y Galletitas
    'JORGITO', 'JORGELIN', 'RASTA', 'GULA', 'GUAYMALLEN', 'TERRABUSI', 'MILKA', 'SUCHARD', 'HAVANNA', 'CACHAFAZ', 
    'VICENTIN', 'CAPITAN', 'BLOCK', 'TOFI', 'BON O BON', 'FANTOCHE', 'OREO', 'CHOCOLINAS', 'DON SATUR', 'BAGLEY',
    'OPERA', 'RUMBA', 'TRAVIATA', 'CRIOLLITAS', 'LINCOLN', 'SONRISAS', 'MELLIZAS', 'TRIO', 'PEPITOS', 'MERCADER',
    // Bebidas
    'SPEED', 'MONSTER', 'FLYING', 'RED BULL', 'SCHNEIDER', 'BRAHMA', 'AQUARIUS', 'LEVITE', 'COCA COLA', 'PEPSI', 
    '7UP', 'SPRITE', 'FANTA', 'POWERADE', 'GATORADE', 'PASO DE LOS TOROS', 'VILLA DEL SUR', 'KIN', 'H2OH', 'CYNAR',
    // Snacks
    'LAY S', 'LAYS', 'CHEETOS', 'DORITOS', 'SALADIX', 'KRCHITOS', 'PEHUAMAR', 'PANCHITOS', 'CONO BIT',
    // Cigarrillos
    'MARLBORO', 'PHILIP MORRIS', 'CHESTERFIELD', 'LUCKY STRIKE', 'CAMEL', 'ROTHMANS', 'PARLIAMENT',
    // Otros
    'BELDENT', 'TOPLINE', 'MOGUL', 'FLYNN PAFF', 'SUGUS', 'MARROC', 'CABSHA', 'TITA', 'RHODESIA', 'VAUQUITA'
];

export const FLAVORS = [
    // Sabores Dulces
    'FRAMBUESA', 'CHOCOLATE', 'FRUTILLA', 'MENTA', 'MIEL', 'PERA', 'MANZANA', 'LIMA', 'COLA', 'BLANCO', 'LIMON', 
    'UVA', 'ANANA', 'NARANJA', 'POMELO', 'CAFE', 'COCO', 'VAINILLA', 'DURAZNO', 'DULCE DE LECHE', 'MARACUYA', 
    'MULTIFRUTAL', 'MARMOLADO', 'AGUA CREAM', 'BANANA', 'CEREZA', 'FRUTOS DEL BOSQUE',
    // Variedades Saladas / Snacks
    'JAMON SERRANO', 'JAMON', 'QUESO', 'ASADO', 'PIZZA', 'CEBOLLA', 'SALAME', 'SALADO', 'CON SAL', 'SIN SAL', 
    'TOSTADO', 'PANCETA', 'IBERICO', 'KETCHUP', 'CREMA Y CEBOLLA', 'CIBOULETTE', 'MIXTO',
    // Cigarrillos y Otros
    'MENTOLADO', 'CONVERTIBLE', 'FUSION', 'ON', 'ICE', 'ORIGINAL', 'COMUN', 'BOX', 'SOFT', 'BOUTIQUE', 'CLICK',
    'BLACK', 'MARINE', 'PALITOS', 'DISCOS', 'PLACER', 'ORIGEN', 'ECONOMICO', 'SELECT', 'SIMPLE', 'TRIPLE'
];

// Atributos que, si están en uno y NO en otro, definen productos TOTALMENTE distintos (No es solo un nombre corto)
export const STRICT_ATTRIBUTES = [
    'ZERO', 'LIGHT', 'SIN AZUCAR', 'SIN SAL', 'SIN TACC', 'MENTOLADO', 'CONVERTIBLE', 'AZUL', 'ROJO', 'VERDE', 
    'MARACUYA', 'UVA', 'ANANA', 'JAMON SERRANO', 'PIZZA', 'CEBOLLA', 'MARMOLADO', 'MIXTO', 'TRIPLE', 'SIMPLE',
    'EXTREME', 'INTENSO', 'SELECT', 'ECONOMICO', 'ORIGEN', 'BOX', 'COMUN'
];

export const FORMATS = ['GRANDE', 'MEDIANA', 'CHICA', 'CHICO', 'MINI', 'PACK', 'X1', 'X2', 'X3', 'X6', 'X12'];

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
        .replace(/\bCONVERTIBLE\b/g, 'MENTOLADO')
        .replace(/\bSIN T.A.C.C\b/g, 'SIN TACC');
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
    // A. Contradicción Cruzada (Ambos tienen algo distinto)
    if (attrs1.length > 0 && attrs2.length > 0) {
        const onlyIn1 = attrs1.filter(a => !attrs2.includes(a));
        const onlyIn2 = attrs2.filter(a => !attrs1.includes(a));
        if (onlyIn1.length > 0 && onlyIn2.length > 0) {
            return `${onlyIn1.join('/')} vs ${onlyIn2.join('/')}`;
        }
    }

    // B. Contradicción Unilateral de "Atributos Estrictos"
    // Si uno especifica un atributo 'estricto' (ej Zero) y el otro no dice NADA, son distintos.
    const strict1 = attrs1.filter(a => STRICT_ATTRIBUTES.includes(a));
    const strict2 = attrs2.filter(a => STRICT_ATTRIBUTES.includes(a));
    
    const onlyStrictIn1 = strict1.filter(a => !strict2.includes(a));
    const onlyStrictIn2 = strict2.filter(a => !strict1.includes(a));

    if (onlyStrictIn1.length > 0 && strict2.length === 0) {
        // P1 tiene algo estricto que P2 ignora totalmente
        return `Diferencia de variedad (${onlyStrictIn1.join('/')})`;
    }
    if (onlyStrictIn2.length > 0 && strict1.length === 0) {
        // P2 tiene algo estricto que P1 ignora totalmente
        return `Diferencia de variedad (${onlyStrictIn2.join('/')})`;
    }

    return null;
};

// --- FUNCIÓN PRINCIPAL DE VALIDACIÓN ---

/**
 * Valida si dos productos son probablemente duplicados basándose en reglas de negocio v3.
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

    // 3. Sabores y Variedades (Contradicción y Unilateralidad Estricta)
    const flavors1 = findAllAttrs(name1, words1, FLAVORS);
    const flavors2 = findAllAttrs(name2, words2, FLAVORS);
    const flavorConflict = getContradiction(flavors1, flavors2);
    if (flavorConflict) return { isDuplicate: false, reason: `Variedad distinta: ${flavorConflict}` };

    // 4. Marcas
    const brands1 = findAllAttrs(name1, words1, BRANDS);
    const brands2 = findAllAttrs(name2, words2, BRANDS);
    const brandConflict = getContradiction(brands1, brands2);
    if (brandConflict) return { isDuplicate: false, reason: `Diferente Marca: ${brandConflict}` };

    // 5. Formatos
    const formats1 = findAllAttrs(name1, words1, FORMATS);
    const formats2 = findAllAttrs(name2, words2, FORMATS);
    const formatConflict = getContradiction(formats1, formats2);
    if (formatConflict) return { isDuplicate: false, reason: `Diferente Formato: ${formatConflict}` };

    // 6. Cantidades (Regla de Oro)
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

    // 7. Precios/Costos
    const price1 = parseFloat(p1.ultimo_precio_venta || p1.precio_venta || 0);
    const price2 = parseFloat(p2.ultimo_precio_venta || p2.precio_venta || 0);
    const cost1 = parseFloat(p1.ultimo_costo_compra || 0);
    const cost2 = parseFloat(p2.ultimo_costo_compra || 0);

    const pricesMatch = (price1 > 0 && price2 > 0) ? (Math.abs(price1 - price2) / Math.max(price1, price2) < 0.35) : false;
    const costsMatch = (cost1 > 0 && cost2 > 0) ? (Math.abs(cost1 - cost2) / Math.max(cost1, cost2) < 0.05) : false;
    
    // Si no hay datos financieros, lo dejamos pasar como sospechoso basado solo en nombre (si no hay contradicciones)
    if ((price1 === 0 || price2 === 0) && (cost1 === 0 || cost2 === 0)) return { isDuplicate: true, reason: null };
    
    if (pricesMatch || costsMatch) return { isDuplicate: true, reason: null };

    return { isDuplicate: false, reason: "Precios/Costos muy distantes para ser el mismo producto" };
};
