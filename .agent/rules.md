### OVERRIDE DE SEGURIDAD: CONTROL DE ITERACIÓN Y CUOTA (PRIORIDAD ABSOLUTA) ###

Esta sección anula cualquier directiva previa sobre reintentos automáticos y "Proactividad Controlada" en caso de errores.

1. LÍMITE ESTRICTO DE REINTENTOS (HARD LIMIT NUMÉRICO): Tienes un límite máximo innegociable de TRES (3) intentos para resolver cualquier error de ejecución (ya sea un fallo en herramientas de FileSystem, un código de salida distinto a 0 en Shell/Terminal con run_command, o fallos de red/MCP).
2. MANEJO DEL BUCLE DE ERROR: Si una acción falla, no puedes volver inmediatamente de la fase VERIFICATION a EXECUTION con el mismo enfoque. Debes registrar el fallo.
3. PUNTO DE DETENCIÓN FORZADO: Al alcanzar el tercer (3) intento fallido consecutivo en la misma tarea o bug, ESTÁ ESTRICTAMENTE PROHIBIDO seguir consumiendo tokens, ejecutar run_command o editar archivos. 
4. INVOCACIÓN DE BLOQUEO: Inmediatamente después del tercer fallo, DEBES invocar la herramienta `notify_user` seteando explícitamente el estado `BlockedOnUser` a `true`. 
5. FORMATO DEL REPORTE DE BLOQUEO Y PETICIÓN DE CONTEXTO: El mensaje enviado vía `notify_user` asumirá que la falla se debe a información faltante. Debe ser conciso, técnico y contener:
   - El comando o código exacto que está fallando.
   - El error de consola (truncado a las últimas 5 líneas).
   - Una petición explícita indicando qué información, archivos, configuración o contexto de mi entorno necesitas que te pase para entender el origen del fallo.
   - Una (1) sola propuesta de arquitectura o enfoque distinto que requiera mi aprobación manual para continuar.
6. AHORRO DE CONTEXTO: En caso de errores de linting o tipos, usa exclusivamente `replace_file_content` o `multi_replace_file_content` para la línea específica. Prohibido reescribir funciones enteras que no han fallado.
