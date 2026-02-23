🏪 DM2Kiosco (KioscoBot) - Sistema de Gestión Automatizada por WhatsApp

📌 Descripción del Proyecto

DM2Kiosco es una solución de automatización diseñada para resolver problemas operativos reales en un negocio minorista (kiosco). El sistema permite gestionar ventas, controlar el inventario y registrar reservas íntegramente a través de una interfaz conversacional en WhatsApp, eliminando la necesidad de hardware de punto de venta (POS) tradicional.

El proyecto nació ante la necesidad de persistir datos y automatizar la logística del negocio, escalando desde un almacenamiento efímero hasta una arquitectura basada en bases de datos relacionales en la nube.

🚀 Tecnologías Utilizadas

Orquestación & Lógica: n8n (flujos de trabajo automatizados).

Base de Datos & Backend: Supabase (PostgreSQL), incluyendo desarrollo de vistas SQL para análisis de stock.

Integración de Mensajería: APIs de WhatsApp (Meta / WAHA) gestionadas mediante Webhooks.

⚙️ Arquitectura del Sistema

El flujo de información opera bajo el siguiente pipeline:

Ingreso de Datos: El usuario envía un comando estructurado vía WhatsApp (ej. registrar venta, consultar stock).

Recepción (Webhook): WAHA/Meta API captura el mensaje y lanza un Webhook hacia la instancia de n8n.

Procesamiento Lógico (n8n): * Parseo del payload JSON.

Validación de comandos y extracción de variables (producto, cantidad, precio).

Persistencia (Supabase): n8n ejecuta consultas REST/SQL hacia Supabase para actualizar las tablas de inventario o registrar transacciones.

Respuesta: Se genera una confirmación que retorna al usuario por WhatsApp cerrando el ciclo.

📋 Características Principales

Registro de Ventas en Tiempo Real: Interacción directa por chat para asentar transacciones.

Gestión de Stock: Actualización automática de inventario tras cada venta.

Vistas SQL Analíticas: Consultas predefinidas en la base de datos para evaluar márgenes comerciales y estructura de costos.

Persistencia Segura: Migración completada a Supabase para evitar pérdidas de datos en entornos de hosting volátiles.

🛠️ Configuración y Despliegue

El sistema está diseñado para ejecutarse en cualquier instancia de n8n (Cloud, Desktop o Self-hosted) conectada a un proyecto de Supabase.

Configuración de Base de Datos (Supabase):

Crear un nuevo proyecto en Supabase.

Ejecutar las consultas SQL necesarias para generar las tablas y vistas de inventario.

Obtener la SUPABASE_URL y la SUPABASE_KEY (Service Role) desde la configuración del proyecto.

Importar Flujos Lógicos:

Acceder a la interfaz de tu instancia de n8n.

Seleccionar "Import from File" y cargar los archivos .json ubicados en el directorio /workflows del repositorio.

Configurar Credenciales en n8n:

Dentro de n8n, configurar los nodos correspondientes ingresando las credenciales de Supabase obtenidas en el paso 1.

Configurar las credenciales y Webhooks para la conexión con la API de WhatsApp (WAHA / Meta API).

📈 Próximos Pasos / Roadmap

$$$$

 Integración de IA para reconocimiento de intenciones en mensajes de texto libre.

$$$$

 Alertas automáticas de bajo stock mediante trabajos programados (Cron).

$$$$

 Dashboard analítico conectando Supabase con herramientas de visualización.

Proyecto desarrollado y mantenido por Luca Quercia.