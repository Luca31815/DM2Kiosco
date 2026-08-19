// triageClassifier.js - Motor de clasificación heurístico/NLP y taxonomía oficial de 11 familias canónicas

export const FAMILIAS_CANONICAS = [
    {
        id: 'ALMACÉN Y COMESTIBLES',
        label: 'Almacén y Comestibles',
        subcategorias: [
            'COMESTIBLES GENERALES',
            'CAFÉ, TÉ Y YERBA',
            'ALIMENTO Y CUIDADO DE MASCOTAS',
            'CARBÓN Y LEÑA'
        ],
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        color: '#f59e0b',
        icon: 'ShoppingBag'
    },
    {
        id: 'BEBIDAS',
        label: 'Bebidas',
        subcategorias: [
            'GASEOSAS',
            'AGUAS Y SABORIZADAS',
            'JUGOS Y AGUAS SABORIZADAS',
            'CERVEZAS, VINOS Y APERITIVOS',
            'ENERGIZANTES E ISOTÓNICAS'
        ],
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        color: '#06b6d4',
        icon: 'CupSoda'
    },
    {
        id: 'CIGARRILLOS Y TABACO',
        label: 'Cigarrillos y Tabaco',
        subcategorias: [
            'CIGARRILLOS',
            'ACCESORIOS Y ENCENDEDORES',
            'TABACO PARA ARMAR Y SEDAS'
        ],
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        color: '#f43f5e',
        icon: 'Cigarette'
    },
    {
        id: 'COMIDAS Y ELABORADOS',
        label: 'Comidas y Elaborados',
        subcategorias: [
            'SÁNDWICHES, PANIFICADOS Y COMIDAS'
        ],
        badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        color: '#f97316',
        icon: 'Utensils'
    },
    {
        id: 'FARMACIA Y CUIDADO PERSONAL',
        label: 'Farmacia y Cuidado Personal',
        subcategorias: [
            'MEDICAMENTOS VENTA LIBRE',
            'HIGIENE Y CUIDADO PERSONAL'
        ],
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        color: '#10b981',
        icon: 'HeartPulse'
    },
    {
        id: 'GALLETITAS Y BIZCOCHOS',
        label: 'Galletitas y Bizcochos',
        subcategorias: [
            'GALLETITAS DULCES',
            'GALLETITAS SALADAS',
            'BIZCOCHOS Y TOSTADAS'
        ],
        badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        color: '#8b5cf6',
        icon: 'Cookie'
    },
    {
        id: 'GOLOSINAS Y CHOCOLATES',
        label: 'Golosinas y Chocolates',
        subcategorias: [
            'ALFAJORES',
            'CHOCOLATES Y BOMBONES',
            'CARAMELOS Y GOMITAS',
            'CHICLES',
            'CHUPETINES',
            'TURRONES, OBLEAS Y BARRITAS',
            'HELADOS'
        ],
        badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
        color: '#ec4899',
        icon: 'Candy'
    },
    {
        id: 'LÁCTEOS Y FRESCOS',
        label: 'Lácteos y Frescos',
        subcategorias: [
            'LÁCTEOS Y DERIVADOS'
        ],
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        color: '#0284c7',
        icon: 'Milk'
    },
    {
        id: 'LIMPIEZA DEL HOGAR',
        label: 'Limpieza del Hogar',
        subcategorias: [
            'LIMPIEZA DEL HOGAR'
        ],
        badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        color: '#14b8a6',
        icon: 'Sparkles'
    },
    {
        id: 'SNACKS SALADOS',
        label: 'Snacks Salados',
        subcategorias: [
            'PAPAS FRITAS Y SNACKS SALADOS'
        ],
        badgeColor: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
        color: '#84cc16',
        icon: 'Popcorn'
    },
    {
        id: 'VARIOS Y SERVICIOS',
        label: 'Varios y Servicios',
        subcategorias: [
            'BAZAR, ILUMINACIÓN Y LIBRERÍA'
        ],
        badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        color: '#64748b',
        icon: 'HelpCircle'
    }
]

export const CATEGORIAS_LIST = FAMILIAS_CANONICAS.map(f => f.id)

export const SUBCATEGORIAS_BY_CATEGORIA = FAMILIAS_CANONICAS.reduce((acc, f) => {
    acc[f.id] = f.subcategorias
    return acc
}, {})

/**
 * Normaliza un texto eliminando acentos y signos para comparación léxica
 */
export function normalizeText(text) {
    if (!text) return ''
    return String(text)
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
}

/**
 * Reglas heurísticas y de prefijos para clasificación automática de alta precisión
 */
const CLASSIFIER_RULES = [
    // 1. BEBIDAS
    {
        categoria: 'BEBIDAS',
        subcategoria: 'GASEOSAS',
        keywords: ['GASEOSA', 'COCA COLA', 'COCA-COLA', 'SPRITE', 'FANTA', 'PEPSI', 'MANAOS', 'SEVEN UP', '7UP', 'PASO DE LOS TOROS', 'SODA', 'POMELO SCHWEPPES', 'TONICA', 'CUNNINGTON'],
        prefixes: ['BEBIDA GASEOSA', 'GASEOSA']
    },
    {
        categoria: 'BEBIDAS',
        subcategoria: 'CERVEZAS, VINOS Y APERITIVOS',
        keywords: ['CERVEZA', 'QUILMES', 'BRAHMA', 'HEINEKEN', 'CORONA', 'STELLA', 'AMSTEL', 'FERNET', 'BRANCA', '1882', 'VINO', 'UVITA', 'TERMIDOR', 'GANCIA', 'CAMPARI', 'SMIRNOFF', 'VODKA', 'APEROL', 'FRIZZÉ', 'FRIZZE', 'SIDRA', 'CHAMPAGNE', 'ANDES ORIGEN'],
        prefixes: ['BEBIDA ALCOHOL', 'CERVEZA', 'VINO', 'ALCOHOL']
    },
    {
        categoria: 'BEBIDAS',
        subcategoria: 'ENERGIZANTES E ISOTÓNICAS',
        keywords: ['SPEED', 'MONSTER', 'RED BULL', 'GATORADE', 'POWERADE', 'ROCKSTAR', 'BLOCK ENERGIZANTE'],
        prefixes: ['BEBIDA ENERGIZANTE', 'ENERGIZANTE']
    },
    {
        categoria: 'BEBIDAS',
        subcategoria: 'JUGOS Y AGUAS SABORIZADAS',
        keywords: ['BAGGIO', 'AQUARIUS', 'LEVITE', 'CEPITA', 'CITRIC', 'CLIGHT', 'TANG', 'SER', 'VILLA DEL SUR LEVITE', 'WE JUGO', 'JUGO'],
        prefixes: ['BEBIDA JUGO', 'JUGO']
    },
    {
        categoria: 'BEBIDAS',
        subcategoria: 'AGUAS Y SABORIZADAS',
        keywords: ['AGUA MINERAL', 'CIMES', 'VILLAMANAOS', 'VILLAVICENCIO', 'ECO DE LOS ANDES', 'BONAQUA', 'GLACIAR', 'SIERRA DE LOS PADRES', 'BIDON AGUA', 'AGUA CON GAS', 'AGUA SIN GAS'],
        prefixes: ['BEBIDA AGUA', 'AGUA']
    },

    // 2. CIGARRILLOS Y TABACO
    {
        categoria: 'CIGARRILLOS Y TABACO',
        subcategoria: 'CIGARRILLOS',
        keywords: ['MARLBORO', 'PHILIP MORRIS', 'CHESTERFIELD', 'LUCKY STRIKE', 'ROTHMANS', 'CAMEL', 'RED POINT', 'MELBOURNE', 'MASTER', 'PARLIAMENT', 'BENSON', 'L&M', 'CIGARRILLO', '20U', '10U', 'BOX', 'KS'],
        prefixes: ['CIGARRILLOS', 'CIGARRILLO']
    },
    {
        categoria: 'CIGARRILLOS Y TABACO',
        subcategoria: 'ACCESORIOS Y ENCENDEDORES',
        keywords: ['ENCENDEDOR', 'BIC', 'TOKER', 'CANDELA', 'CLIPPER', 'FOSFORO', 'FOSFOROS', 'CENICERO', 'GAS BUTANO'],
        prefixes: ['ENCENDEDOR', 'ACCESORIOS FUMADOR']
    },
    {
        categoria: 'CIGARRILLOS Y TABACO',
        subcategoria: 'TABACO PARA ARMAR Y SEDAS',
        keywords: ['TABACO', 'OCB', 'SEDAS', 'PAPELILLO', 'FILTROS ARMAR', 'CERRITO', 'SAYRI', 'VAN KERSEN', 'LAS HOJITAS', 'ARMADOR'],
        prefixes: ['TABACO']
    },

    // 3. GOLOSINAS Y CHOCOLATES
    {
        categoria: 'GOLOSINAS Y CHOCOLATES',
        subcategoria: 'ALFAJORES',
        keywords: ['ALFAJOR', 'ALFAJORES', 'GUAYMALLEN', 'JORGITO', 'RASTA', 'CAPITAN DEL ESPACIO', 'HAVANNA', 'GULA KING', 'TERRABUSI ALFAJOR', 'AGUILA ALFAJOR', 'BLOCK ALFAJOR', 'BON O BON ALFAJOR', 'TOFI', 'TATIN', 'FULBITO', 'MARLEY'],
        prefixes: ['GOLOSINAS ALFAJOR', 'ALFAJOR']
    },
    {
        categoria: 'GOLOSINAS Y CHOCOLATES',
        subcategoria: 'CHOCOLATES Y BOMBONES',
        keywords: ['CHOCOLATE', 'COFLER', 'BLOCK', 'MILKA', 'BON O BON', 'KINDER', 'FERRERO', 'MARROC', 'CADBURY', 'AGUILA', 'BANANITA DOLCA', 'CABSHA', 'DOS CORAZONES', 'BOCADITO', 'OBLIBON', 'MEDALLON MENTA'],
        prefixes: ['GOLOSINAS CHOCOLATE', 'CHOCOLATE']
    },
    {
        categoria: 'GOLOSINAS Y CHOCOLATES',
        subcategoria: 'CARAMELOS Y GOMITAS',
        keywords: ['CARAMELO', 'CARAMELOS', 'SUGUS', 'FLYNN PAFF', 'MOGUL', 'GOMITAS', 'HALLS', 'MENTOPLUS', 'BUTTER TOFFEES', 'PALITOS DE LA SELVA', 'YUMMY', 'BILLIKEN'],
        prefixes: ['GOLOSINAS CARAMELOS', 'CARAMELOS', 'GOMITAS']
    },
    {
        categoria: 'GOLOSINAS Y CHOCOLATES',
        subcategoria: 'CHICLES',
        keywords: ['CHICLE', 'CHICLES', 'BELDENT', 'TOPLINE', 'BUBBALOO', 'BAZOOKA', 'GROSSO', 'CLORETS', 'PLOC'],
        prefixes: ['GOLOSINAS CHICLE', 'CHICLES']
    },
    {
        categoria: 'GOLOSINAS Y CHOCOLATES',
        subcategoria: 'CHUPETINES',
        keywords: ['CHUPETIN', 'CHUPETINES', 'PICO DULCE', 'BABY DOLL', 'PUSH POP', 'RING POP', 'POP\'S'],
        prefixes: ['GOLOSINAS CHUPETIN', 'CHUPETIN']
    },
    {
        categoria: 'GOLOSINAS Y CHOCOLATES',
        subcategoria: 'TURRONES, OBLEAS Y BARRITAS',
        keywords: ['TURRON', 'TURRONES', 'ARCOR TURRON', 'MISKY', 'MANI CON CHOCOLATE', 'GARRAPIÑADA', 'OBLEA', 'RHODESIA', 'TITA', 'OPERA', 'NUGATON', 'CEREAL MIX', 'BARRA CEREAL'],
        prefixes: ['GOLOSINAS TURRON', 'TURRON']
    },
    {
        categoria: 'GOLOSINAS Y CHOCOLATES',
        subcategoria: 'HELADOS',
        keywords: ['HELADO', 'HELADOS', 'TORPEDO', 'SIN PARAR', 'FRIGOR', 'NOEL', 'PALITO BOMBÓN', 'NARANJU', 'BALDE HELADO'],
        prefixes: ['HELADOS', 'HELADO']
    },

    // 4. GALLETITAS Y BIZCOCHOS
    {
        categoria: 'GALLETITAS Y BIZCOCHOS',
        subcategoria: 'BIZCOCHOS Y TOSTADAS',
        keywords: ['DON SATUR', 'BIZCOCHO', 'BIZCOCHOS', 'BISCOCHO', 'GRASA', 'AGRIDULCE', 'TOSTADAS', 'TALITAS', 'MARINERAS', 'CREMONA', 'PAN TOSTADO'],
        prefixes: ['GALLETITAS BIZCOCHOS', 'BIZCOCHOS']
    },
    {
        categoria: 'GALLETITAS Y BIZCOCHOS',
        subcategoria: 'GALLETITAS DULCES',
        keywords: ['OREO', 'CHOCOLINAS', 'CHOCLINA', 'RUMBA', 'SONRISAS', 'MELLIZAS', 'AMOR', 'MERENGADAS', 'MANA', 'PITUSAS', 'SURTIDO BAGLEY', 'SURTIDO DIVERSION', 'FACHITAS', 'PEPAS', 'MAGDALENA', 'BUDIN', 'VALENTE', 'POZO'],
        prefixes: ['GALLETITAS DULCES', 'GALLETITAS']
    },
    {
        categoria: 'GALLETITAS Y BIZCOCHOS',
        subcategoria: 'GALLETITAS SALADAS',
        keywords: ['TRAVIATA', 'CEREALITAS', 'CRIOLLITAS', 'EXPRESS', 'SALADIX', 'MEDIATARDE', 'HOGAREÑAS', 'CLUB SOCIAL', 'REX'],
        prefixes: ['GALLETITAS SALADAS']
    },

    // 5. SNACKS SALADOS
    {
        categoria: 'SNACKS SALADOS',
        subcategoria: 'PAPAS FRITAS Y SNACKS SALADOS',
        keywords: ['LAYS', 'PAPAS FRITAS', 'DORITOS', 'CHEETOS', 'CHIZITOS', 'KRACHITOS', 'MANI SALADO', 'MANI KING', 'PALITOS SALADOS', 'PIPAS', 'GIRASOL', 'NACHOS', 'TUTUCAS', 'CAPULLITOS', 'TWISTOS', '3 3D', 'SNACK'],
        prefixes: ['SNACKS', 'SNACK']
    },

    // 6. FARMACIA Y CUIDADO PERSONAL
    {
        categoria: 'FARMACIA Y CUIDADO PERSONAL',
        subcategoria: 'MEDICAMENTOS VENTA LIBRE',
        keywords: ['ACTRON', 'IBUPROFENO', 'IBU', 'PARACETAMOL', 'TAFIROL', 'CAFIASPIRINA', 'ASPIRINA', 'ALIKAL', 'BAYASPIRINA', 'KETEROLAC', 'KETOROLACO', 'BUSCAPINA', 'SERTAL', 'UVACOL', 'DORIXINA', 'REFRIANEX', 'NEXT', 'QURA PLUS', 'CURITAS', 'ALCOHOL EN GEL', 'ALCOHOL 70', 'ALCOHOL FINO'],
        prefixes: ['FARMACIA MEDICAMENTOS', 'FARMACIA']
    },
    {
        categoria: 'FARMACIA Y CUIDADO PERSONAL',
        subcategoria: 'HIGIENE Y CUIDADO PERSONAL',
        keywords: ['PRESERVATIVOS', 'PRIME', 'TULIPAN', 'TOALLITAS', 'ALWAYS', 'KOTEX', 'LADYSOFT', 'DESODORANTE', 'AXE', 'REXONA', 'DOVE', 'NIVEA', 'SHAMPOO', 'JABON', 'AFEITADORA', 'GILLETTE', 'PRESTOBARBA', 'ORAL B', 'COLGATE', 'CEPILLO DENTAL', 'PASTA DENTAL', 'PAPEL HIGIENICO', 'PAÑUELOS ELITE'],
        prefixes: ['FARMACIA HIGIENE']
    },

    // 7. ALMACÉN Y COMESTIBLES
    {
        categoria: 'ALMACÉN Y COMESTIBLES',
        subcategoria: 'CAFÉ, TÉ Y YERBA',
        keywords: ['YERBA', 'PLAYADITO', 'TARAGUI', 'AMANDA', 'ROSAMONTE', 'MAÑANITA', 'UNION', 'CRUZ DE MALTA', 'CAFE', 'NESCAFE', 'ARLISTAN', 'LA VIRGINIA', 'MORENITA', 'DOLCA CAFE', 'SAQUITOS', 'TE LA VIRGINIA', 'TE GREEN HILLS', 'MATE COCIDO'],
        prefixes: ['ALMACEN INFUSIONES', 'YERBA', 'CAFE']
    },
    {
        categoria: 'ALMACÉN Y COMESTIBLES',
        subcategoria: 'ALIMENTO Y CUIDADO DE MASCOTAS',
        keywords: ['COMIDA PARA PERRO', 'COMIDA PARA GATO', 'COMIDA DE GATO', 'WHISKAS', 'PEDIGREE', 'CAT CHOW', 'DOG CHOW', 'PIEDRITAS SANITARIAS', 'PIEDRITAS GATO'],
        prefixes: ['ALMACEN PETS', 'PETS', 'MASCOTAS']
    },
    {
        categoria: 'ALMACÉN Y COMESTIBLES',
        subcategoria: 'CARBÓN Y LEÑA',
        keywords: ['CARBON', 'LEÑA', 'LENA', 'BOLSA DE CARBON', 'AUTOENCENDIBLE'],
        prefixes: ['ALMACEN CARBON', 'CARBON']
    },
    {
        categoria: 'ALMACÉN Y COMESTIBLES',
        subcategoria: 'COMESTIBLES GENERALES',
        keywords: ['ACEITE', 'LEGITIMO', 'CAÑUELAS', 'COCINERO', 'NATURA', 'ARROZ', 'MONEDA', 'GALLO', 'FIDEOS', 'MATARAZZO', 'LUCCHETTI', 'AZUCAR', 'LEDESMA', 'DOMINO', 'EDULCORANTE', 'SAL', 'DOS ANCLAS', 'CELUSAL', 'HARINA', 'PUREZA', 'BLANCAFLOR', 'MAYONESA', 'KETCHUP', 'MOSTAZA', 'SALSAS', 'TOMATES TRITURADOS', 'LENTEJAS', 'ATUN', 'DULCE DE LECHE', 'MERMELADA'],
        prefixes: ['ALMACEN COMESTIBLES', 'ALMACEN']
    },

    // 8. COMIDAS Y ELABORADOS
    {
        categoria: 'COMIDAS Y ELABORADOS',
        subcategoria: 'SÁNDWICHES, PANIFICADOS Y COMIDAS',
        keywords: ['SANDWICH', 'SANGUCHE', 'PEBETE', 'EMPANADA', 'TARTA', 'PREPIZZA', 'PIZZA', 'PAN DE MIGA', 'PAN LACTAL', 'MEDIALUNA', 'FACTURAS', 'TORTA'],
        prefixes: ['COMIDAS', 'ROTISERIA']
    },

    // 9. LÁCTEOS Y FRESCOS
    {
        categoria: 'LÁCTEOS Y FRESCOS',
        subcategoria: 'LÁCTEOS Y DERIVADOS',
        keywords: ['LECHE', 'LA SERENISIMA', 'SANCOR', 'ILOLAY', 'YOGUR', 'YOGURISIMO', 'QUESO', 'MANTECA', 'CREMA DE LECHE', 'FIAMBRE', 'JAMON COCIDO', 'PALETA', 'SALAME', 'QUESO CREMA', 'DANONINO'],
        prefixes: ['LACTEOS', 'FRESCOS']
    },

    // 10. LIMPIEZA DEL HOGAR
    {
        categoria: 'LIMPIEZA DEL HOGAR',
        subcategoria: 'LIMPIEZA DEL HOGAR',
        keywords: ['DETERGENTE', 'MAGISTRAL', 'ALA', 'LAVANDINA', 'AYUDIN', 'DESINFECTANTE', 'LYSOFORM', 'POETT', 'CIF', 'ESPONJA', 'MORTIMER', 'ROLLO DE COCINA', 'SERVILLETAS', 'BOLSAS DE RESIDUOS', 'INSECTICIDA', 'RAID', 'FUYI', 'ESPIRALES'],
        prefixes: ['LIMPIEZA DEL HOGAR', 'LIMPIEZA']
    },

    // 11. VARIOS Y SERVICIOS
    {
        categoria: 'VARIOS Y SERVICIOS',
        subcategoria: 'BAZAR, ILUMINACIÓN Y LIBRERÍA',
        keywords: ['PILAS', 'DURACELL', 'ENERGIZER', 'LAMPARA', 'FOCO LED', 'PEGAMENTO', 'POXIPOL', 'LA GOTITA', 'CABLE CARGADOR', 'ALARGUES', 'VELAS', 'CHIP MOVISTAR', 'CHIP CLARO', 'CHIP PERSONAL', 'SUBE', 'FOTOCOPIAS', 'LIBRERIA', 'CUADERNO', 'BIROME', 'BIC CRISTAL'],
        prefixes: ['VARIOS', 'SERVICIOS', 'BAZAR']
    }
]

/**
 * Analiza un producto y devuelve la categoría y subcategoría más probable con score de confianza
 * @param {string|object} productInput - Nombre del producto o el objeto producto completo
 * @returns {{ categoria: string, subcategoria: string, confianza: 'alta' | 'media' | 'baja', regla: string }}
 */
export function inferCategoryAndSubcategory(productInput) {
    const rawName = typeof productInput === 'object' && productInput !== null
        ? (productInput.nombre || productInput.producto || '')
        : String(productInput || '')

    const norm = normalizeText(rawName)
    if (!norm) {
        return {
            categoria: 'VARIOS Y SERVICIOS',
            subcategoria: 'BAZAR, ILUMINACIÓN Y LIBRERÍA',
            confianza: 'baja',
            regla: 'Texto vacío'
        }
    }

    // 1. Verificación por PREFIJOS exactos al inicio
    for (const rule of CLASSIFIER_RULES) {
        for (const prefix of rule.prefixes) {
            const normPref = normalizeText(prefix)
            if (norm.startsWith(normPref + ' ') || norm === normPref) {
                return {
                    categoria: rule.categoria,
                    subcategoria: rule.subcategoria,
                    confianza: 'alta',
                    regla: `Prefijo "${prefix}"`
                }
            }
        }
    }

    // 2. Verificación por PALABRAS CLAVE con límites de palabra (regex)
    for (const rule of CLASSIFIER_RULES) {
        for (const kw of rule.keywords) {
            const normKw = normalizeText(kw)
            const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(`(?:^|\\s|\\b)${escaped}(?:$|\\s|\\b)`, 'i')
            if (regex.test(norm)) {
                return {
                    categoria: rule.categoria,
                    subcategoria: rule.subcategoria,
                    confianza: 'alta',
                    regla: `Palabra clave "${kw}"`
                }
            }
        }
    }

    // 3. Verificación de inclusión substring
    for (const rule of CLASSIFIER_RULES) {
        for (const kw of rule.keywords) {
            const normKw = normalizeText(kw)
            if (normKw.length >= 4 && norm.includes(normKw)) {
                return {
                    categoria: rule.categoria,
                    subcategoria: rule.subcategoria,
                    confianza: 'media',
                    regla: `Contiene "${kw}"`
                }
            }
        }
    }

    // 4. Fallback a VARIOS Y SERVICIOS
    return {
        categoria: 'VARIOS Y SERVICIOS',
        subcategoria: 'BAZAR, ILUMINACIÓN Y LIBRERÍA',
        confianza: 'baja',
        regla: 'Sin coincidencia (predeterminado)'
    }
}
