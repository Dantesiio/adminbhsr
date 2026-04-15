# 🚀 Guía de Despliegue en Vercel con Prisma

## 📋 Índice

1. [Preparación del Proyecto](#preparación-del-proyecto)
2. [Configurar Vercel Postgres](#configurar-vercel-postgres)
3. [Configurar Variables de Entorno](#configurar-variables-de-entorno)
4. [Desplegar el Proyecto](#desplegar-el-proyecto)
5. [Ejecutar Migraciones en Producción](#ejecutar-migraciones-en-producción)
6. [Ejecutar Seed (Datos Iniciales)](#ejecutar-seed-datos-iniciales)
7. [Verificar el Despliegue](#verificar-el-despliegue)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Preparación del Proyecto

### Paso 1: Verificar que el Proyecto esté Listo

Asegúrate de que tu proyecto esté en un repositorio Git y que todos los cambios estén commiteados:

```bash
# Verificar estado
git status

# Si hay cambios sin commitear
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

### Paso 2: Verificar Scripts en package.json

Tu `package.json` ya tiene los scripts necesarios:
- ✅ `postinstall: "prisma generate"` - Genera el cliente Prisma después de instalar dependencias
- ✅ `build: "next build"` - Construye la aplicación

---

## 🗄️ Configurar Vercel Postgres

### Paso 1: Crear Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New Project"**
3. Conecta tu repositorio de GitHub/GitLab/Bitbucket
4. Selecciona el repositorio `adminbhsr`

### Paso 2: Crear Base de Datos Postgres

1. En el dashboard de Vercel, ve a la pestaña **"Storage"**
2. Haz clic en **"Create Database"**
3. Selecciona **"Postgres"**
4. Elige un plan:
   - **Hobby** (Gratis): Para desarrollo/pruebas
   - **Pro** (Pago): Para producción con más recursos
5. Haz clic en **"Create"**

### Paso 3: Obtener URLs de Conexión

Una vez creada la base de datos, Vercel te mostrará **dos URLs importantes**:

1. **Connection String (Pooled)** - Para uso en runtime
   - Formato: `postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true&connection_limit=1`
   - Usa esta para `DATABASE_URL`

2. **Connection String (Direct)** - Para migraciones
   - Formato: `postgresql://user:pass@host:5432/db?sslmode=require`
   - Usa esta para `DIRECT_DATABASE_URL`

**⚠️ IMPORTANTE**: Guarda estas URLs, las necesitarás en el siguiente paso.

---

## 🔐 Configurar Variables de Entorno

### Paso 1: Agregar Variables en Vercel

1. En el dashboard de tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

#### Variables Requeridas:

```env
# Base de datos (desde Vercel Postgres)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth
AUTH_SECRET="tu-secret-aqui-genera-con-openssl-rand-base64-32"
AUTH_URL="https://tu-proyecto.vercel.app"
AUTH_TRUST_HOST="true"

# Public (opcional)
NEXT_PUBLIC_APP_URL="https://tu-proyecto.vercel.app"
```

#### Variables Opcionales:

```env
# Vercel Blob (si usas almacenamiento de archivos)
BLOB_READ_WRITE_TOKEN="tu-token-de-vercel-blob"

# Resend (si usas emails)
RESEND_API_KEY="tu-api-key-de-resend"
```

### Paso 2: Generar AUTH_SECRET

Genera un secreto seguro para NextAuth:

```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como valor de `AUTH_SECRET`.

### Paso 3: Configurar para Todos los Entornos

Asegúrate de que las variables estén configuradas para:
- ✅ **Production**
- ✅ **Preview** (opcional)
- ✅ **Development** (opcional)

---

## 🚀 Desplegar el Proyecto

### Opción A: Despliegue Automático (Recomendado)

1. **Push a la rama principal**:
   ```bash
   git push origin main
   ```

2. Vercel detectará automáticamente el push y comenzará el despliegue

3. **Monitorea el despliegue**:
   - Ve al dashboard de Vercel
   - Verás el progreso del build en tiempo real
   - Espera a que termine (puede tomar 2-5 minutos)

### Opción B: Despliegue Manual

1. En el dashboard de Vercel, haz clic en **"Deploy"**
2. Selecciona la rama `main`
3. Haz clic en **"Deploy"**

### Verificar el Build

Durante el build, verifica que:
- ✅ `prisma generate` se ejecute correctamente (en `postinstall`)
- ✅ `next build` complete sin errores
- ✅ No haya errores de TypeScript

---

## 📊 Ejecutar Migraciones en Producción

**⚠️ IMPORTANTE**: Después del primer despliegue, necesitas ejecutar las migraciones para crear las tablas en la base de datos de producción.

### Opción A: Usando Vercel CLI (Recomendado)

#### Paso 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

#### Paso 2: Login en Vercel

```bash
vercel login
```

#### Paso 3: Conectar al Proyecto

```bash
cd /Users/daviddonneys/Documents/BarcoHospitalHSR/adminbhsr
vercel link
```

Sigue las instrucciones para seleccionar tu proyecto.

#### Paso 4: Descargar Variables de Entorno

```bash
vercel env pull .env.local.production
```

Esto creará un archivo `.env.local.production` con las variables de producción.

#### Paso 5: Ejecutar Migraciones

```bash
# Usar las variables de producción
export $(cat .env.local.production | grep -v '^#' | xargs)

# Ejecutar migraciones
pnpm db:push
```

O directamente:

```bash
# Cargar variables y ejecutar
source <(cat .env.local.production | grep -v '^#' | sed 's/^/export /')
pnpm db:push
```

### Opción B: Desde el Dashboard de Vercel Postgres

1. Ve a **Storage** → Tu base de datos Postgres
2. Haz clic en **"Query"** o **"SQL Editor"**
3. Copia el contenido de `prisma/migrations/20250829214742_init/migration.sql`
4. Pega y ejecuta el SQL

### Opción C: Script de Post-Deploy

Puedes crear un script que se ejecute automáticamente después del deploy.

Crea `scripts/postdeploy.sh`:

```bash
#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma db push --skip-generate

echo "Migrations completed!"
```

Y agrega en `package.json`:

```json
{
  "scripts": {
    "postdeploy": "bash scripts/postdeploy.sh"
  }
}
```

**Nota**: Vercel no ejecuta `postdeploy` automáticamente, necesitarías usar un webhook o ejecutarlo manualmente.

---

## 🌱 Ejecutar Seed (Datos Iniciales)

Después de las migraciones, ejecuta el seed para crear usuarios y datos de prueba:

### Usando Vercel CLI

```bash
# Asegúrate de tener las variables de producción cargadas
source <(cat .env.local.production | grep -v '^#' | sed 's/^/export /')

# Ejecutar seed
pnpm db:seed
```

### Verificar que Funcionó

Puedes verificar que los usuarios se crearon usando Prisma Studio en modo remoto:

```bash
# Con variables de producción cargadas
npx prisma studio
```

O usando una query directa desde el dashboard de Vercel Postgres.

---

## ✅ Verificar el Despliegue

### Paso 1: Verificar que la Aplicación Funciona

1. Abre la URL de tu proyecto: `https://tu-proyecto.vercel.app`
2. Deberías ver la página de login
3. Intenta iniciar sesión con:
   - Email: `prueba@solicitante.com`
   - Contraseña: `prueba123`

### Paso 2: Verificar la Base de Datos

1. Ve a **Storage** → Tu base de datos Postgres
2. Haz clic en **"Data"** o **"Tables"**
3. Verifica que existan las tablas:
   - User
   - Project
   - CostCenter
   - RQ
   - etc.

### Paso 3: Verificar Logs

1. En el dashboard de Vercel, ve a **"Deployments"**
2. Selecciona el último deployment
3. Revisa los logs para verificar que no haya errores

---

## 🔧 Troubleshooting

### Error: "Prisma Client not generated"

**Solución:**
- Verifica que `postinstall: "prisma generate"` esté en `package.json`
- El cliente se genera automáticamente durante el build

### Error: "Database connection failed"

**Solución:**
1. Verifica que `DATABASE_URL` y `DIRECT_DATABASE_URL` estén configuradas
2. Asegúrate de usar la URL "Pooled" para `DATABASE_URL`
3. Asegúrate de usar la URL "Direct" para `DIRECT_DATABASE_URL`
4. Verifica que la base de datos esté activa en Vercel

### Error: "Table does not exist"

**Solución:**
- Las migraciones no se ejecutaron
- Ejecuta `pnpm db:push` usando Vercel CLI (ver sección anterior)

### Error: "Invalid credentials" al hacer login

**Solución:**
1. Verifica que el seed se ejecutó correctamente
2. Ejecuta el seed nuevamente si es necesario
3. Verifica que `AUTH_SECRET` esté configurado correctamente

### Error: "AUTH_SECRET is missing"

**Solución:**
1. Genera un nuevo secret: `openssl rand -base64 32`
2. Agrégalo a las variables de entorno en Vercel
3. Redespliega la aplicación

### Las Migraciones no se Ejecutan Automáticamente

**Solución:**
- Vercel no ejecuta migraciones automáticamente por seguridad
- Debes ejecutarlas manualmente usando Vercel CLI (ver sección anterior)
- O usar un webhook de post-deploy

---

## 📝 Checklist de Despliegue

Antes de considerar el despliegue completo, verifica:

- [ ] Proyecto conectado a Vercel
- [ ] Base de datos Postgres creada en Vercel
- [ ] Variables de entorno configuradas:
  - [ ] `DATABASE_URL` (Pooled)
  - [ ] `DIRECT_DATABASE_URL` (Direct)
  - [ ] `AUTH_SECRET`
  - [ ] `AUTH_URL`
  - [ ] `AUTH_TRUST_HOST`
- [ ] Proyecto desplegado exitosamente
- [ ] Migraciones ejecutadas (`db:push`)
- [ ] Seed ejecutado (`db:seed`)
- [ ] Login funciona correctamente
- [ ] Base de datos tiene datos (usuarios, proyectos, etc.)

---

## 🔄 Actualizaciones Futuras

### Cuando Hagas Cambios al Schema

1. **Desarrollo local**:
   ```bash
   # Hacer cambios en schema.prisma
   pnpm db:push
   pnpm db:generate
   ```

2. **Commit y push**:
   ```bash
   git add prisma/schema.prisma
   git commit -m "Actualizar schema de base de datos"
   git push origin main
   ```

3. **Vercel desplegará automáticamente**

4. **Ejecutar migraciones en producción**:
   ```bash
   vercel env pull .env.local.production
   source <(cat .env.local.production | grep -v '^#' | sed 's/^/export /')
   pnpm db:push
   ```

### Cuando Agregues Nuevas Variables de Entorno

1. Agrega la variable en Vercel Dashboard → Settings → Environment Variables
2. Redespliega la aplicación (o espera al próximo push)

---

## 🎯 Comandos Rápidos de Referencia

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Conectar proyecto
vercel link

# Descargar variables de entorno
vercel env pull .env.local.production

# Cargar variables y ejecutar migraciones
source <(cat .env.local.production | grep -v '^#' | sed 's/^/export /')
pnpm db:push

# Ejecutar seed
pnpm db:seed

# Ver logs de deployment
vercel logs

# Abrir proyecto en navegador
vercel open
```

---

## 📚 Recursos Adicionales

- [Documentación de Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Documentación de Prisma con Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/getting-started/installation)

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Consulta la documentación oficial
4. Contacta al equipo de desarrollo

---

**¡Listo!** Tu aplicación debería estar desplegada y funcionando en Vercel. 🎉


