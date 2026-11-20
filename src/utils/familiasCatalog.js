// familiasCatalog.js - Taxonomía oficial de 11 familias canónicas y metadatos visuales

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
