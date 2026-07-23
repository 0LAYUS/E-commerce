# Arquitectura del Endpoint Maestro (Cron)

El endpoint unificado `/api/cron/maintenance` centraliza todas las tareas de mantenimiento de la plataforma. Está diseñado para ser ejecutado periódicamente (ej: cada 15-30 minutos) usando un servicio de cron externo o Workers.

## Tareas Ejecutadas

### 1. Limpieza de Carritos y Órdenes Wompi (15-30 min)
Libera las reservas de stock (`stock_reservations`) de los carritos que superaron los 15 minutos sin ser confirmados. Adicionalmente, detecta órdenes `PENDING` (flujo Wompi normal) con más de 30 minutos sin respuesta, las pasa a `ERROR` y restaura el stock a los productos correspondientes. Se apoya en el servicio `cleanupService.ts`.

### 2. Limpieza de Órdenes Manuales (> 72 horas)
Busca órdenes en estado `PENDING_MANUAL` (pagos a coordinar) que lleven más de 72 horas desde su creación. Estas órdenes no tienen webhook automático de cancelación, por lo que el cron las pasa al estado `DECLINED` y ejecuta la restitución del stock, liberando los inventarios para la venta general.

### 3. Validación de Licencia PRIGMA
Verifica de manera asíncrona y periódica la vigencia y estado de la licencia de la plataforma conectándose al servidor de licencias PRIGMA. Esto asegura que la caché de la validación se mantenga actualizada y bloquee la app si es necesario, sin afectar la latencia del usuario final.

## Invocación
- Método: `POST`
- Ruta: `/api/cron/maintenance`
- Respuesta: Retorna un desglose del número de reservas limpiadas y órdenes procesadas, junto al estado del chequeo de licencia.
