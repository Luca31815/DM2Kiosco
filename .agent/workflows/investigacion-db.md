---
description: Procedimiento mandatorio para investigar el esquema de la base de datos (tablas, vistas y funciones)
---

Este workflow contiene las consultas SQL que **DEBEN** ser consultadas o ejecutadas antes de realizar cualquier cambio que involucre la base de datos, para asegurar que se cuenta con el esquema más actualizado.

### 1. Inspección de Vistas
Esta consulta permite ver todas las vistas definidas en el esquema público y sus columnas.
```sql
SELECT 
    table_name AS vista_nombre,
    column_name AS columna_nombre,
    data_type AS tipo_dato,
    is_nullable AS es_nulo,
    ordinal_position AS posicion
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public')
ORDER BY 
    table_name, 
    ordinal_position;
```

### 2. Inspección de Tablas Base
Esta consulta recupera la estructura completa de todas las tablas (no vistas) en el esquema público.
```sql
select
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
join information_schema.tables t
  on c.table_name = t.table_name
  and c.table_schema = t.table_schema
where c.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
order by c.table_name, c.ordinal_position;
```

### 3. Inspección de Funciones (RPC)
Esta consulta muestra todas las funciones, sus argumentos y el código fuente completo.
```sql
SELECT 
    p.proname AS nombre_funcion,
    pg_get_function_arguments(p.oid) AS argumentos,
    pg_get_functiondef(p.oid) AS codigo_fuente
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
ORDER BY 
    nombre_funcion;
```

> [!IMPORTANT]
> Antes de cada tarea de desarrollo, el asistente debe revisar los últimos resultados de estas consultas (o solicitarlos al usuario si no hay snippets recientes) para evitar errores por esquemas desactualizados.
