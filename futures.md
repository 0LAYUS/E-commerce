# Futures — Funcionalidades Pendientes

## User Registration & Profiles

### Campos de perfil de usuario

**Problema:** La tabla `profiles` actualmente solo tiene: `id`, `email`, `role`, `created_at`. No hay `full_name` ni otros datos del usuario.

**Pendiente:**
- Definir qué datos se piden al usuario al registrarse
- Agregar columnas necesarias a la tabla `profiles`
- Decidir si `full_name` es obligatorio u opcional
- Considerar: teléfono, dirección, avatar, etc.

**Cuando se implemente:**
1. Agregar columnas a `profiles` via migración
2. Actualizar `authActions.getAllUsers()` para buscar por `full_name` además de `email`
3. Actualizar formulario de registro si aplica

---

## Búsqueda en Gestión de Usuarios (parcialmente implementado)

**Estado actual:** La búsqueda es server-side por `email` (línea 61 de `authActions.ts` usa `.ilike()`).

**Pendiente completo:**
- [ ] Cuando `profiles` tenga `full_name`, actualizar búsqueda para incluir ambos campos
- [ ] Decidir lógica de OR vs AND para búsqueda
- [ ] Considerar búsqueda insensible a tildes
