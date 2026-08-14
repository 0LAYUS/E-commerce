# Guía de Despliegue en Cloudflare (Workers & Pages)

Este proyecto no se despliega en Vercel. Se despliega en la infraestructura de Cloudflare. Entender esto es **MANDATORIO** porque cambia cómo funciona Next.js bajo el capó.

## Requisitos Críticos de Infraestructura

1. **Versión de Next.js CONGELADA:**
   - La versión es **15.4.6**. NO la cambies. Cloudflare utiliza un runtime especial (Edge/Workers, no Node.js estándar). OpenNext (`@opennextjs/cloudflare`) depende de parches específicos de Next.js para funcionar. Si rompes la versión, rompes el build en producción.

2. **OpenNext Cloudflare:**
   - Usamos el adaptador `@opennextjs/cloudflare` para compatibilizar el App Router de Next.js 15 con Cloudflare Workers.
   - El comando de despliegue es: `npm run deploy` que internamente ejecuta `npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy`.

3. **Wrangler Configuration:**
   - La configuración de Cloudflare vive en `wrangler.jsonc`.
   - **DO (Durable Objects):** Utilizamos Durable Objects para la caché de Next.js (`NEXT_CACHE_DO_QUEUE`, `NEXT_TAG_CACHE_DO_SHARDED`, `NEXT_CACHE_DO_PURGE`).
   - El punto de entrada compilado es `.open-next/worker.js`.

4. **Entorno Node.js Compatibility:**
   - Usamos el flag `nodejs_compat` en `wrangler.jsonc`. Esto permite usar algunas APIs de Node.js, pero **NO TODAS**. No uses librerías que dependan de binarios de C++ nativos (ej. ciertas librerías de manipulación de imágenes como `sharp` nativo sin configuración WASM) porque van a fallar en el Edge.

## Proceso de Despliegue

1. **Local Dev con Wrangler:** Si necesitas probar el build de Cloudflare en local, usa `npm run cf-dev`. Esto levantará Wrangler y el worker local simulado.
2. **Producción:** El CI o el comando `npm run deploy` se encarga de subir el output de `.open-next/` directo a Cloudflare.
