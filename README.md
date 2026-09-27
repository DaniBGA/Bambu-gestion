# Bambu Gestión

Plataforma web para gestión de inventario, ventas y clientes. React (Vite) + Tailwind CSS + Supabase, pensada para desplegarse en Netlify.

## 1. Configurar Supabase

**Proyecto nuevo (nunca corriste el schema antes):**
1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Andá a **SQL Editor** y ejecutá el contenido de `supabase/schema.sql`. Esto crea las tablas `marcas`, `inventario`, `clientes` y `ventas`, sus relaciones y las políticas de Row Level Security.

**Proyecto existente (ya tenías la versión anterior sin marcas):**
1. Andá a **SQL Editor** y ejecutá `supabase/migration_marcas.sql`. Este script agrega la tabla `marcas`, crea automáticamente una marca por cada valor de texto que ya tenías cargado en `inventario.marca`, enlaza los productos existentes con `marca_id`, y habilita el borrado de productos. No borra ningún dato.

En ambos casos, después:
3. Andá a **Authentication → Users → Add user** y creá los usuarios del equipo (email + contraseña). No hay registro público: los usuarios se crean manualmente desde el panel.
4. Andá a **Project Settings → API** y copiá:
   - `Project URL` → va en `VITE_SUPABASE_URL`
   - `anon public key` → va en `VITE_SUPABASE_ANON_KEY`

## 2. Correr el proyecto localmente

```bash
npm install
cp .env.example .env
# Completá .env con tu Project URL y anon key
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## 3. Desplegar en Netlify

1. Subí este proyecto a un repositorio de GitHub/GitLab.
2. En Netlify: **Add new site → Import an existing project** y conectá el repositorio.
3. Netlify va a detectar `netlify.toml` automáticamente (`npm run build`, carpeta `dist`).
4. Antes de desplegar (o en **Site settings → Environment variables**), agregá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Estas variables son públicas por diseño (la `anon key` de Supabase está pensada para exponerse en el cliente); la seguridad real la dan las políticas de Row Level Security del script SQL, que sólo permiten operar a usuarios autenticados.
5. Deploy. Listo — cada vez que hagas push a la rama principal, Netlify vuelve a construir el sitio.

## Estructura del proyecto

```
src/
  supabaseClient.js       # Cliente de Supabase (usa las env vars de Vite)
  contexts/AuthContext.jsx # Estado de sesión global
  components/
    Login.jsx              # Pantalla de inicio de sesión obligatoria
    Layout.jsx              # Navegación entre las 4 secciones + logout
    Inventario.jsx          # Sección 1: carga, filtros, tabla con badges
    Ventas.jsx               # Sección 2: registro de venta + alta rápida de cliente
    Clientes.jsx             # Sección 3: alta + historial y estado de cuenta
    Dashboard.jsx            # Sección 4: métricas + descarga de PDF
    ClienteModal.jsx          # Modal de alta rápida de cliente (usado en Ventas)
  utils/pdfReport.js         # Generación del reporte PDF con jsPDF
supabase/schema.sql          # Script de creación de la base de datos
```

## Notas de diseño

- Al confirmar una venta, el sistema actualiza automáticamente el producto vendido en `inventario` a `en_stock = false`, por lo que deja de aparecer como disponible en el selector de nuevas ventas.
- El estado de cuenta de un cliente ("Al día" / "En mora") se calcula en el momento a partir de sus ventas: si tiene alguna venta con `pagada = false`, queda "En mora".
- Los usuarios se administran desde Supabase (Authentication), no hay pantalla de registro en la app.
- Las marcas se gestionan en la tabla `marcas` y se referencian desde `inventario.marca_id`. Hay una sección dedicada **Marcas** con alta/edición/borrado, además del selector con autocompletado en Inventario.
- Un producto no se puede eliminar si tiene ventas asociadas (protección `on delete restrict` en la base), para no perder el historial de ventas. Si necesitás "dar de baja" un producto con ventas previas, usá el botón Editar y marcalo como "Sin Stock" en lugar de eliminarlo. Lo mismo aplica a clientes con ventas registradas.
- Todas las fechas se muestran en formato DD/MM/AAAA (incluyendo los reportes PDF), aunque Supabase las almacena internamente en formato ISO.
- El modo oscuro se activa con el botón de sol/luna en la barra de navegación y se guarda en `localStorage`, por lo que se mantiene entre sesiones y recargas de página.
- **Precio de venta automático:** en Ventas, el precio se calcula solo a partir del costo del producto + costo fijo + otros conceptos, con el margen de ganancia configurado, y se ajusta según el medio de pago (recargo para tarjetas, descuento opcional para efectivo/transferencia). Esa configuración vive en `localStorage` del navegador (no en la base de datos) y se puede editar en el panel "⚙️ Configuración de precios". El precio siempre se puede sobrescribir a mano.
- **Dashboard con filtros de fecha:** Hoy / Esta semana / Este mes / Rango personalizado. Todas las métricas (incluyendo el margen de ganancia real) se recalculan según el período elegido. Desde ahí también se descargan 4 reportes en PDF: general del período, stock actual completo, clientes con historial detallado, y ventas del período con margen por venta.
