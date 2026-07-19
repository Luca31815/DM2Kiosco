import { toast } from 'react-hot-toast'
import { FLAVORS, BRANDS, FORMATS } from '../../utils/duplicateRules'

export const performAiScan = async (allProducts, setAiDuplicates, setIsAiScanning) => {
    if (!allProducts || allProducts.length === 0) return toast.error('El catálogo aún no cargó');
    
    setIsAiScanning(true);
    const loadingToast = toast.loading('Analizando el catálogo completo con la Inteligencia Artificial (Groq Llama-3.3)...');
    
    try {
        const groups = {};
        allProducts.forEach(p => {
            const words = p.nombre?.trim().split(/\s+/) || [];
            const key = words.slice(0, 2).join(' ').toUpperCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        const suspiciousGroups = Object.entries(groups).reduce((acc, [name, list]) => {
            if (list.length > 1) {
                const itemsText = list.map(p => `  ID: ${p.producto_id || p.id} | ${p.nombre} (Venta: $${p.ultimo_precio_venta || p.precio_venta || 0} | Costo: $${p.ultimo_costo_compra || 0})`).join('\n');
                acc.push(`### GRUPO SOSPECHOSO: ${name}\n${itemsText}`);
            }
            return acc;
        }, []).join('\n\n');

        if (!suspiciousGroups) {
            toast.success('No se detectaron grupos sospechosos para auditar.', { id: loadingToast });
            setIsAiScanning(false);
            return;
        }

        const prompt = `Actúa como un Auditor de Inventario Senior para Kioscos Argentinos.
Analiza los siguientes GRUPOS SOSPECHOSOS de productos duplicados.

REGLAS DE NEGOCIO ESTRICTAS (DICCIONARIO):
- SABORES/VARIEDADES PERMITIDAS: ${FLAVORS.slice(0, 40).join(', ')}... y similares.
- MARCAS DE REFERENCIA: ${BRANDS.join(', ')}.
- FORMATOS: ${FORMATS.join(', ')}.

PROHIBICIONES ABSOLUTAS:
1. CONTRADICCIÓN DE CATEGORÍA: Si comparten un grupo (ej: Alfajor) pero difieren en un atributo específico del diccionario (ej: Blanco vs Negro, Rojo vs Azul), son PRODUCTOS DISTINTOS. No los marques como duplicados.
2. SINÓNIMOS ACEPTADOS: "NEGRO" = "CHOCOLATE", "MENTOLADO" = "CONVERTIBLE".
3. REGLA DE MAGNITUDES: Diferencias numéricas (12u vs 20u, 500ml vs 1L) definen productos distintos. Ignorar diferencias menores a 2 unidades solo en cigarrillos.
4. PRECIOS: Si el costo difiere por más del 10%, probablemente no sean el mismo producto aunque el nombre sea similar.

Tu misión es encontrar duplicados reales. 
FORMATO DE SALIDA (JSON ESTRICTO):
{
  "duplicates": [
    { 
      "idKeep": "ID_DEL_NOMBRE_MAS_COMPLETO", 
      "idDelete": "ID_DEL_DUPLICADO", 
      "reason": "Explicación breve",
      "validation": "Criterio de coincidencia"
    }
  ]
}

GRUPOS A AUDITAR:
${suspiciousGroups}`;

        const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
        
        if (!GROQ_KEY) {
            throw new Error("No se encontró la API Key de Groq (VITE_GROQ_API_KEY) en las variables de entorno.");
        }

        const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        const jsonResponse = await response.json();
        if (jsonResponse.error) throw new Error(jsonResponse.error.message);

        const textResult = jsonResponse.choices[0].message.content;
        let aiParsed = JSON.parse(textResult);

        if (aiParsed.duplicates) aiParsed = aiParsed.duplicates;
        if (!Array.isArray(aiParsed)) aiParsed = [];

        const mappedAiResults = aiParsed.flatMap(res => {
            const p1 = allProducts.find(p => (p.producto_id || p.id) == res.idKeep)
            const p2 = allProducts.find(p => (p.producto_id || p.id) == res.idDelete)
            if (!p1 || !p2) return [];
            return [{ p1, p2, reason: `[Auditoría IA] ${res.reason || 'Detección Semántica'}` }]
        });

        setAiDuplicates(mappedAiResults);
        
        if (mappedAiResults.length > 0) {
            toast.success(`La IA encontró ${mappedAiResults.length} duplicados ocultos usando contexto semántico.`, { id: loadingToast, duration: 6000 });
        } else {
            toast.success('La IA determinó que tu inventario está impecable. No hay más duplicados.', { id: loadingToast, duration: 5000 });
        }

    } catch (error) {
        console.error("Detalle completo del error IA:", error);
        toast.error(`Fallo IA: ${error.message}`, { id: loadingToast, duration: 8000 });
    } finally {
        setIsAiScanning(false);
    }
}
