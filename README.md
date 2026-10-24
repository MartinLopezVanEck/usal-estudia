# Usal Estudia

Web para compartir parciales, apuntes, guías resueltas y demás material de la USAL.
Se ingresa con cuenta `@usal.edu.ar`; los alumnos suben material y un admin lo aprueba antes de publicarlo.

- **Next.js** (App Router) hosteado en **Vercel**
- **Supabase**: base de datos Postgres y login con Google
- **Cloudflare R2**: almacenamiento de archivos (los archivos van directo del navegador a R2)

## Cómo está organizado

```
Carrera ─┬─ plan_materias (año + cuatrimestre) ─── Materia ─┬─ catedras ─── Profesor
         └─ (una materia puede estar en varias carreras)     └─ archivos (con o sin profesor)
```

- Todo (archivos, carreras, materias, profesores) tiene `estado`: `pendiente` / `aprobado` / `rechazado`.
- Lo que sube un alumno queda `pendiente`. Si propone una materia o un profesor que no existe, también.
  Al aprobar el archivo se aprueba todo lo que propuso junto con él.
- Lo que sube un admin se publica directo.
- Archivos anónimos: los alumnos no ven el autor, los admins sí (lo resuelve la vista `archivos_visibles`).
- Límite por archivo: 25 MB para alumnos y 100 MB para admins (configurable en `.env.local`).

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com) (plan Free).
2. **SQL Editor** → pegá y ejecutá todo [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)
   y después [0002_permisos.sql](supabase/migrations/0002_permisos.sql),
   [0003_cuentas_externas.sql](supabase/migrations/0003_cuentas_externas.sql) y
   [0004_seguridad.sql](supabase/migrations/0004_seguridad.sql), en ese orden.

   El Security Advisor va a seguir marcando *Security Definer View* en `archivos_visibles`: es intencional
   (la vista filtra por usuario y oculta el autor de los archivos anónimos).
3. **Project Settings → API**: copiá `Project URL`, `anon public` y `service_role` (esta última es secreta).

### 2. Google (login)

1. En [console.cloud.google.com](https://console.cloud.google.com) creá un proyecto.
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo *Externo*, completá nombre y mail de soporte.
   Alcances: `email`, `profile`, `openid`. Después pasala a *En producción* para que pueda entrar cualquiera.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth** → *Aplicación web*.
   En *URI de redireccionamiento autorizados* poné `https://<tu-proyecto>.supabase.co/auth/v1/callback`.
4. En Supabase: **Authentication → Sign In / Providers → Google** → activalo y pegá el *Client ID* y *Client Secret*.
5. En Supabase: **Authentication → URL Configuration**:
   - *Site URL*: la URL de producción (ej. `https://usal-estudia.vercel.app`)
   - *Redirect URLs*: `http://localhost:3000/auth/callback` y `https://usal-estudia.vercel.app/auth/callback`

Solo pueden entrar cuentas `@usal.edu.ar`: lo valida un trigger en la base, así que aunque alguien
fuerce el login con otra cuenta, el alta se rechaza.

### 3. Cloudflare R2

1. En [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → activalo (pide tarjeta pero el plan gratis cubre 10 GB).
2. Creá un bucket `usal-estudia` (privado, no actives acceso público).
3. En el bucket → **Settings → CORS policy** pegá (con tu dominio real):
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://usal-estudia.vercel.app"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. **R2 → Manage API tokens → Create API token** con permiso *Object Read & Write* sobre ese bucket.
   Copiá *Access Key ID*, *Secret Access Key* y tu *Account ID*.

### 4. Correr en local

```bash
cp .env.example .env.local   # y completá los valores
npm install
npm run dev
```

Entrá a http://localhost:3000 con tu cuenta. Después, en el **SQL Editor** de Supabase, hacete admin:

```sql
update profiles set rol = 'admin' where email = 'tu-mail@usal.edu.ar';
```

A partir de ahí podés nombrar otros admins desde **Admin → Usuarios**.

### 5. Deploy en Vercel

1. Subí el repo a GitHub e importalo en [vercel.com](https://vercel.com).
2. Cargá las mismas variables de `.env.local` en **Settings → Environment Variables**.
3. Agregá la URL final en Supabase (*URL Configuration*) y en el CORS de R2.

> El plan Free de Supabase pausa el proyecto después de 7 días sin actividad. Si pasa, se reactiva desde el panel.

## Cargar el contenido

1. **Admin → Carreras y materias**: creá las carreras y agregá las materias con su año y cuatrimestre
   (una misma materia se puede agregar a varias carreras). Abriendo cada materia le asignás los profesores.
2. **Subir**: elegí carrera, materia y profesor, y seleccioná **varios archivos de una vez** (hasta 50).
   El título, el tipo y el año se completan solos a partir del nombre del archivo y se pueden corregir antes de subir.
   Lo que sube un admin se publica directo.

## Migrar el Drive con un script (opcional)

En lugar de cargar a mano, el script trabaja sobre una **copia local** del Drive: con [Google Drive para escritorio](https://www.google.com/drive/download/)
(aparece como una unidad, ej. `G:\Mi unidad\...`) o descargando la carpeta como zip y descomprimiéndola.

Antes de importar, entrá una vez a la web con tu cuenta y hacete admin (ver arriba). Después:

```bash
# 1. Analiza la carpeta y genera migracion.csv con lo que va a subir
npm run migrar -- analizar "G:/Mi unidad/Ing-Lic Informática Usal/Lo importante"

# 2. Abrí migracion.csv en Excel y revisá: materia, profesor, tipo, título y la columna "importar" (si/no)

# 3. Importa (sube a R2 y carga todo como aprobado)
npm run migrar -- importar migracion.csv \
  --raiz "G:/Mi unidad/Ing-Lic Informática Usal/Lo importante" \
  --admin tu-mail@usal.edu.ar \
  --carreras "Ingeniería en Informática;Licenciatura en Informática"
```

- Estructura esperada: `<N° Año>/[Primer|Segundo cuatrimestre]/<Materia>/[<Profesor>]/...`.
  Las materias directo bajo el año se toman como anuales; los archivos sueltos en la materia quedan como "General".
- Los archivos nativos de Google (Docs/Sheets/Slides) se marcan para omitir: exportalos a PDF/Office primero.
- Se puede volver a correr `importar`: lo que ya se subió se saltea.
