# Guía de Personalización Multi-Marca

Este documento explica cómo adaptar el e-commerce para una nueva marca (cliente). Toda la configuración principal de la marca está centralizada en `lib/constants/branding-store.ts`.

## 1. Configuración de Marca (Cliente)

El archivo `lib/constants/branding-store.ts` controla cómo se ve y qué información muestra la tienda al usuario final.

Para implementar una nueva marca, modifica las siguientes propiedades en ese archivo:

### Identidad Básica
- `name`: Nombre de la tienda.
- `description`: Descripción (SEO y redes sociales).
- `url`: URL principal de la tienda.

### Tema (Modo Claro / Oscuro)
Puedes forzar el tema por defecto que usará la tienda modificando la propiedad `theme.defaultTheme`.
- Valores permitidos: `"dark"`, `"light"` o `"system"`.
- *Nota: El usuario siempre puede cambiar su preferencia individual usando el botón (Theme Toggle) ubicado en el Footer.*

### Contacto y Redes
Actualiza el objeto `contact`, la propiedad `whatsapp` y el objeto `social` con los datos de contacto y enlaces a redes sociales del cliente.

### Recursos (Imágenes y Logos)
Reemplaza las imágenes en la carpeta `public/images/brandClient/` y actualiza las rutas en el objeto `assets` si cambian los nombres de archivo.

#### Imágenes de la página "Nosotros"
La página "Nosotros" (`/about`) lee dinámicamente las imágenes de `assets`:
- `aboutHero`: Imagen de cabecera principal.
- `aboutTeam`: Imagen para la sección "Nuestro Equipo".
- `aboutWarehouse`: Imagen para la sección de infraestructura / instalaciones.

### Configuración de Módulos (Feature Flags)
El objeto `features` permite encender o apagar módulos enteros de la tienda cambiando su valor a `true` o `false`.

- `features.workOrders`: Habilita o deshabilita el módulo de Reparaciones.
- `features.payments.wompi`: Oculta o muestra la opción de pago en línea (Wompi) en el Checkout. Ideal para cuando Wompi está en mantenimiento. (Nota: Las órdenes pasadas pagadas con Wompi seguirán mostrándose correctamente en el admin).
- `features.payments.manual`: Oculta o muestra la opción de Pago Contra Entrega en el Checkout. Ideal para clientes que solo quieren pagos electrónicos.

## 2. Configuración de Prigma (Plataforma)

El archivo `lib/constants/branding-prigma.ts` controla la marca de la plataforma (Prigma) que se muestra en áreas de administración o licenciamiento (donde el cliente sabe que la plataforma fue hecha por Prigma).
Modifica este archivo únicamente si cambian los datos de contacto corporativos de Prigma.

## 3. Despliegue

Al hacer cambios en estos archivos, recuerda:
1. Reemplazar todos los recursos gráficos (logos, favicons) en `public/images/brandClient/`.
2. Validar localmente corriendo `npm run dev`.
3. Hacer deploy a producción (Next.js se encargará de actualizar los metadatos y el layout estáticamente basado en la configuración).
