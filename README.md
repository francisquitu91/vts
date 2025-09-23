# CRM VTS (Valpotec System) - Prototipo TSX mínimo

Prototipo mínimo en React + TypeScript que implementa un CRM sencillo parecido a las capturas: panel admin, lista de clientes y modal para agregar/editar. Los datos se guardan en `localStorage` para demostración.

Requisitos:
- Node.js 18+ (recomendado)
- PowerShell (Windows)

Arranque rápido (PowerShell):

```powershell
cd 'C:/Users/franc/Victor Sanhueza/crm-vts'
npm install
npm run dev
```

El servidor de desarrollo iniciará y mostrará la app. Abre la URL que indique Vite (por defecto `http://localhost:5173`).

Notas:
- Prototipo para arrancar el proyecto. Siguientes pasos: añadir API backend, autenticación real, base de datos en servidor y más funcionalidades.

Deploy a Render (static site)
--------------------------------

Pasos rápidos para desplegar esta aplicación en Render como sitio estático:

1. Crea una cuenta en https://render.com y en el Dashboard selecciona "New" → "Web Service" o "Static Site" (elige "Static Site" para una SPA simple).
2. Conecta tu cuenta de GitHub y selecciona el repositorio `francisquitu91/vts`.
3. Configure los ajustes de build:
	- Build Command: `npm install && npm run build`
	- Publish Directory: `dist`

4. Añade variables de entorno en Render (Environment > Environment Variables). Importantes para la app:
	- `VITE_SUPABASE_URL` = tu URL de Supabase (p. ej. `https://xyzcompany.supabase.co`)
	- `VITE_SUPABASE_ANON_KEY` = la ANON KEY de tu proyecto Supabase

5. Despliega y espera a que Render ejecute el build. La app se servirá desde la carpeta `dist` y la SPA usará `public/_redirects` para manejar rutas.

Notas de seguridad y recomendaciones:
- No subas secretos a `.env`; usa las Environment Variables en Render.
- En producción es recomendable usar Supabase Auth y no almacenar contraseñas en texto plano.

Si quieres, puedo automatizar la configuración de Render (crear el Static Site desde la CLI) o preparar un script `render.yaml` para la creación de infraestructuras. Dime si quieres que lo haga.
