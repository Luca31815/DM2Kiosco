---
description: Cómo conectar e introspeccionar la base de datos Supabase
---

Para conectar a la base de datos y realizar consultas de introspección (listar funciones, tablas, vistas), sigue estos pasos:

### 1. Requisitos
- Archivo `.env.local` con `VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Método de Introspección (Recomendado)
Usa el punto de acceso OpenAPI para obtener la definición **viva** de todos los RPCs disponibles.

// turbo
```powershell
curl -s "https://yekovqaomhvdmiseghmf.supabase.co/rest/v1/?apikey=$env:SUPABASE_SERVICE_ROLE_KEY" | Out-File -FilePath openapi_spec.json
```

### 3. Script de Consulta Rápida (db_inspect.js)
Usa el script `db_inspect.js` para ejecutar introspección específica mediante RPCs existentes como `obtener_columnas_vistas_public`.

```javascript
// Ejemplo de uso
node db_inspect.js --functions
```

### 4. Protocolo "Live First"
Antes de cualquier modificación de esquema o función:
1. Ejecuta la introspección para verificar la versión más reciente (ej. `v16`).
2. Confirma que los nombres de tablas y columnas coinciden con el código local.
3. Si hay discrepancia, prioriza SIEMPRE la información de la DB en vivo.
