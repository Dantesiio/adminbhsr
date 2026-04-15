# 📊 Guía Completa: Base de Datos y Despliegue

## 🗄️ Estructura de la Base de Datos

### Resumen General

La base de datos está construida con **PostgreSQL** y utiliza **Prisma ORM** como capa de abstracción. El sistema gestiona el flujo completo de requisiciones (RQ) desde la creación hasta la orden de compra.

### Modelos Principales

#### 1. **User** (Usuarios)
- **Propósito**: Gestiona usuarios del sistema con diferentes roles
- **Campos clave**:
  - `id`: Identificador único (CUID)
  - `email`: Email único del usuario
  - `name`: Nombre del usuario
  - `role`: Rol del usuario (enum: SOLICITANTE, COMPRAS, AUTORIZADOR, ADMIN)
  - `passwordHash`: Hash de la contraseña (bcrypt)
- **Relaciones**:
  - `requests`: RQs creadas por el usuario
  - `approvals`: Aprobaciones realizadas
  - `fileAssets`: Archivos subidos

#### 2. **Project** (Proyectos)
- **Propósito**: Catálogo de proyectos del hospital
- **Campos clave**:
  - `code`: Código único del proyecto (ej: "PRJ-001")
  - `name`: Nombre del proyecto
  - `client`: Cliente asociado (opcional)
- **Relaciones**:
  - `rqs`: Requisiciones asociadas al proyecto

#### 3. **CostCenter** (Centros de Costo)
- **Propósito**: Centros de costo para clasificación contable
- **Campos clave**:
  - `code`: Código único (ej: "CC-001")
  - `name`: Nombre del centro de costo
  - `active`: Estado activo/inactivo
- **Relaciones**:
  - `rqs`: Requisiciones asociadas

#### 4. **Supplier** (Proveedores)
- **Propósito**: Catálogo de proveedores
- **Campos clave**:
  - `name`: Nombre del proveedor
  - `nit`: NIT único (opcional)
  - `email`, `phone`: Datos de contacto
- **Relaciones**:
  - `quotes`: Cotizaciones del proveedor
  - `pos`: Órdenes de compra
  - `chosenIn`: Comparativos donde fue elegido

#### 5. **RQ** (Requisiciones) - ⭐ Modelo Central
- **Propósito**: Requisiciones de compra
- **Campos clave**:
  - `code`: Código único (ej: "RQ-0001")
  - `title`: Título de la requisición
  - `description`: Descripción detallada
  - `status`: Estado del workflow (enum)
    - `DRAFT` → `ENVIADA_COMPRAS` → `EN_COMPARATIVO` → `EN_AUTORIZACION` → `APROBADA` → `OC_EMITIDA` → `CERRADA`
  - `projectId`: Proyecto asociado
  - `costCenterId`: Centro de costo (opcional)
  - `requesterId`: Usuario que creó la RQ
- **Relaciones**:
  - `items`: Ítems de la requisición
  - `quotes`: Cotizaciones recibidas
  - `comparison`: Comparativo de cotizaciones
  - `approvals`: Aprobaciones
  - `po`: Orden de compra generada
  - `receipts`: Recepciones de productos

#### 6. **RQItem** (Ítems de Requisición)
- **Propósito**: Detalle de productos/servicios solicitados
- **Campos clave**:
  - `name`: Nombre del ítem
  - `spec`: Especificaciones técnicas
  - `qty`: Cantidad (Decimal 12,2)
  - `uom`: Unidad de medida
- **Relaciones**:
  - `rq`: Requisición padre
  - `quoteItems`: Cotizaciones de este ítem

#### 7. **Quote** (Cotizaciones)
- **Propósito**: Cotizaciones de proveedores para una RQ
- **Campos clave**:
  - `currency`: Moneda (default: "COP")
  - `total`: Total de la cotización (Decimal 14,2)
  - `validez`: Fecha de validez
  - `leadTime`: Tiempo de entrega
  - `notes`: Notas adicionales
- **Relaciones**:
  - `rq`: Requisición asociada
  - `supplier`: Proveedor que cotiza
  - `items`: Detalle de ítems cotizados

#### 8. **QuoteItem** (Ítems de Cotización)
- **Propósito**: Detalle de precios por ítem en una cotización
- **Campos clave**:
  - `price`: Precio unitario (Decimal 14,2)
  - `qty`: Cantidad cotizada
  - `uom`: Unidad de medida
  - `specNote`: Nota sobre especificaciones
- **Relaciones**:
  - `quote`: Cotización padre
  - `rqItem`: Ítem de requisición relacionado (opcional)

#### 9. **Comparison** (Comparativo)
- **Propósito**: Comparación de múltiples cotizaciones
- **Campos clave**:
  - `chosenId`: Proveedor elegido
  - `checklist`: Lista de verificación (JSON)
  - `publishedAt`: Fecha de publicación
- **Relaciones**:
  - `rq`: Requisición (relación 1:1)
  - `chosen`: Proveedor seleccionado

#### 10. **Approval** (Aprobaciones)
- **Propósito**: Registro de aprobaciones/rechazos
- **Campos clave**:
  - `status`: Estado (PENDIENTE, APROBADO, RECHAZADO)
  - `comment`: Comentario del aprobador
- **Relaciones**:
  - `rq`: Requisición
  - `approver`: Usuario que aprueba

#### 11. **PO** (Purchase Order - Orden de Compra)
- **Propósito**: Órdenes de compra generadas
- **Campos clave**:
  - `number`: Número único de OC
  - `currency`: Moneda
  - `total`: Total (Decimal 14,2)
  - `pdfUrl`: URL del PDF generado
- **Relaciones**:
  - `rq`: Requisición (1:1)
  - `supplier`: Proveedor

#### 12. **Receipt** (Recepciones)
- **Propósito**: Control de recepción de productos
- **Campos clave**:
  - `status`: Estado (PENDIENTE, CONFORME, NO_CONFORME)
  - `notes`: Notas de recepción
- **Relaciones**:
  - `rq`: Requisición

#### 13. **FileAsset** (Archivos)
- **Propósito**: Gestión de archivos adjuntos
- **Campos clave**:
  - `entityType`: Tipo de entidad (RQ, QUOTE, SUPPLIER, PO, RECEIPT)
  - `entityId`: ID de la entidad relacionada
  - `name`: Nombre del archivo
  - `mimeType`: Tipo MIME
  - `size`: Tamaño en bytes
  - `storageKey`: Clave en Vercel Blob
  - `urlSigned`: URL firmada temporal
- **Relaciones**:
  - `uploadedBy`: Usuario que subió el archivo

#### 14. **NotificationLog** (Log de Notificaciones)
- **Propósito**: Registro de notificaciones enviadas
- **Campos clave**:
  - `type`: Tipo de notificación
  - `entityRef`: Referencia a entidad
  - `to`: Destinatario
  - `subject`: Asunto
  - `payload`: Datos adicionales (JSON)

#### 15. **Setting** (Configuraciones)
- **Propósito**: Configuraciones del sistema
- **Campos clave**:
  - `key`: Clave única
  - `value`: Valor (JSON)

### Diagrama de Relaciones

```
User
  ├── requests (RQ[])
  ├── approvals (Approval[])
  └── fileAssets (FileAsset[])

Project
  └── rqs (RQ[])

CostCenter
  └── rqs (RQ[])

Supplier
  ├── quotes (Quote[])
  ├── pos (PO[])
  └── chosenIn (Comparison[])

RQ (⭐ Central)
  ├── project (Project)
  ├── costCenter (CostCenter?)
  ├── requester (User)
  ├── items (RQItem[])
  ├── quotes (Quote[])
  ├── comparison (Comparison?)
  ├── approvals (Approval[])
  ├── po (PO?)
  └── receipts (Receipt[])

RQItem
  ├── rq (RQ)
  └── quoteItems (QuoteItem[])

Quote
  ├── rq (RQ)
  ├── supplier (Supplier)
  └── items (QuoteItem[])

QuoteItem
  ├── quote (Quote)
  └── rqItem (RQItem?)

Comparison
  ├── rq (RQ) [1:1]
  └── chosen (Supplier?)

Approval
  ├── rq (RQ)
  └── approver (User)

PO
  ├── rq (RQ) [1:1]
  └── supplier (Supplier)

Receipt
  └── rq (RQ)

FileAsset
  └── uploadedBy (User)
```

---

## 🚀 Cómo Levantar la Base de Datos

### Opción 1: Docker (Desarrollo Local) ⭐ Recomendado

#### Paso 1: Iniciar PostgreSQL en Docker

```bash
# Dar permisos de ejecución al script
chmod +x scripts/start-db.sh

# Iniciar la base de datos
./scripts/start-db.sh
```

Este script:
- Crea un contenedor Docker con PostgreSQL 15
- Expone el puerto **5433** (para no conflictuar con PostgreSQL local)
- Configura:
  - Usuario: `postgres`
  - Contraseña: `postgres`
  - Base de datos: `adminbhsr`

#### Paso 2: Configurar Variables de Entorno

Crea un archivo `.env.local` con:

```env
# Base de datos Docker local
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/adminbhsr"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/adminbhsr"

# NextAuth
AUTH_SECRET="tu-secret-aqui-genera-con-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# Vercel Blob (opcional para desarrollo)
BLOB_READ_WRITE_TOKEN="tu_token_aqui"

# Resend (opcional para desarrollo)
RESEND_API_KEY="tu_api_key_aqui"
```

#### Paso 3: Generar Cliente Prisma y Crear Tablas

```bash
# Generar el cliente Prisma
pnpm db:generate

# Crear las tablas en la base de datos
pnpm db:push

# Poblar con datos de prueba
pnpm db:seed
```

#### Paso 4: Verificar que Funciona

```bash
# Abrir Prisma Studio (interfaz visual de la BD)
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes ver y editar los datos.

### Opción 2: PostgreSQL Local

Si ya tienes PostgreSQL instalado localmente:

```bash
# Crear la base de datos
createdb adminbhsr

# Configurar .env.local
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/adminbhsr"
DIRECT_DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/adminbhsr"

# Generar y aplicar schema
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### Detener la Base de Datos Docker

```bash
# Detener el contenedor
./scripts/stop-db.sh

# O manualmente
docker stop adminbhsr-postgres
```

---

## 📈 Generar Diagrama de la Base de Datos

### Opción 1: Prisma ERD (Recomendado)

Prisma tiene una herramienta integrada para generar diagramas:

```bash
# Instalar Prisma ERD Generator (si no está instalado)
pnpm add -D prisma-erd-generator

# Agregar al schema.prisma (en la sección generator)
# generator erd {
#   provider = "prisma-erd-generator"
#   output = "./prisma/ERD.svg"
# }

# Generar el diagrama
npx prisma generate
```

### Opción 2: Prisma Studio + Screenshot

1. Abre Prisma Studio: `npx prisma studio`
2. Navega por las tablas y relaciones
3. Toma capturas de pantalla

### Opción 3: Herramientas Externas

#### dbdiagram.io

1. Exporta el schema de Prisma a formato dbml:
```bash
npx prisma-dbml-generator
```

2. Ve a [dbdiagram.io](https://dbdiagram.io)
3. Pega el código DBML generado
4. Genera el diagrama visual

#### DBDiagram desde Prisma Schema

```bash
# Instalar herramienta de conversión
pnpm add -D prisma-markdown

# O usar herramienta online
# https://dbdiagram.io/d
```

Puedes copiar manualmente el schema de `prisma/schema.prisma` y convertirlo.

### Opción 4: Diagrama Manual con Mermaid

He creado un diagrama Mermaid que puedes usar en documentación:

```mermaid
erDiagram
    User ||--o{ RQ : "crea"
    User ||--o{ Approval : "aprueba"
    User ||--o{ FileAsset : "sube"
    Project ||--o{ RQ : "tiene"
    CostCenter ||--o{ RQ : "tiene"
    RQ ||--o{ RQItem : "contiene"
    RQ ||--o{ Quote : "recibe"
    RQ ||--|| Comparison : "tiene"
    RQ ||--o{ Approval : "requiere"
    RQ ||--o| PO : "genera"
    RQ ||--o{ Receipt : "tiene"
    Supplier ||--o{ Quote : "envía"
    Supplier ||--o{ PO : "recibe"
    Quote ||--o{ QuoteItem : "contiene"
    QuoteItem }o--|| RQItem : "corresponde"
    Comparison }o--|| Supplier : "elige"
```

---

## 🚀 Desplegar en Vercel

### Paso 1: Preparar el Repositorio

```bash
# Asegúrate de que todo esté commiteado
git add .
git commit -m "Preparar para despliegue"
git push origin main
```

### Paso 2: Crear Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New Project"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `adminbhsr`

### Paso 3: Configurar Base de Datos (Vercel Postgres)

1. En el dashboard de Vercel, ve a **Storage**
2. Click en **"Create Database"**
3. Selecciona **Postgres**
4. Elige un plan (Hobby es gratis para empezar)
5. Click en **"Connect"**

Vercel te dará dos URLs:
- **Connection String (Pooled)**: Para uso en runtime
- **Connection String (Direct)**: Para migraciones

### Paso 4: Configurar Variables de Entorno

En el dashboard de Vercel → Settings → Environment Variables, agrega:

```env
# Base de datos (desde Vercel Postgres)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth
AUTH_SECRET="genera-con-openssl-rand-base64-32"
AUTH_URL="https://tu-proyecto.vercel.app"
AUTH_TRUST_HOST="true"

# Vercel Blob (opcional)
BLOB_READ_WRITE_TOKEN="desde-vercel-blob-dashboard"

# Resend (opcional)
RESEND_API_KEY="tu-api-key-de-resend"
```

**Generar AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Paso 5: Configurar Vercel Blob (Opcional)

1. En Vercel Dashboard → Storage → Create Store
2. Selecciona **Blob**
3. Copia el token y agrégalo a las variables de entorno

### Paso 6: Configurar Build Settings

En Vercel, asegúrate de que:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (o `npm run build`)
- **Install Command**: `pnpm install` (o `npm install`)
- **Output Directory**: `.next` (automático para Next.js)

### Paso 7: Desplegar

Vercel desplegará automáticamente cuando hagas push. O puedes:

1. Click en **"Deploy"** en el dashboard
2. O hacer push a la rama main:
```bash
git push origin main
```

### Paso 8: Ejecutar Migraciones y Seed

Después del primer despliegue, necesitas ejecutar las migraciones:

#### Opción A: Desde Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Conectar al proyecto
vercel link

# Descargar variables de entorno
vercel env pull .env.local

# Ejecutar migraciones (localmente apuntando a Vercel)
pnpm db:push

# Ejecutar seed (opcional)
pnpm db:seed
```

#### Opción B: Desde Vercel Dashboard (Postgres)

1. Ve a Storage → Tu base de datos → Query
2. Ejecuta las migraciones manualmente copiando el SQL de `prisma/migrations/20250829214742_init/migration.sql`

#### Opción C: Script de Post-Deploy

Puedes crear un script que se ejecute después del deploy. Crea `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

Y agrega un script en `package.json`:

```json
{
  "scripts": {
    "postdeploy": "prisma migrate deploy && prisma db seed"
  }
}
```

### Paso 9: Verificar el Despliegue

1. Ve a la URL de tu proyecto: `https://tu-proyecto.vercel.app`
2. Verifica que la aplicación carga correctamente
3. Prueba el login con los usuarios de prueba

### Troubleshooting en Vercel

#### Error: "Module not found"
- Verifica que `pnpm` esté configurado correctamente
- Asegúrate de que `package.json` tenga `postinstall: "prisma generate"`

#### Error: "Database connection failed"
- Verifica que `DATABASE_URL` y `DIRECT_DATABASE_URL` estén configuradas
- Asegúrate de usar la URL "Pooled" para `DATABASE_URL` y "Direct" para `DIRECT_DATABASE_URL`

#### Error: "Prisma Client not generated"
- Agrega en `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

#### Las migraciones no se ejecutan
- Ejecuta manualmente desde Vercel CLI o desde el dashboard de Postgres

---

## 📝 Resumen de Comandos Útiles

### Desarrollo Local

```bash
# Iniciar BD
./scripts/start-db.sh

# Configurar BD
pnpm db:generate
pnpm db:push
pnpm db:seed

# Iniciar servidor
pnpm dev

# Ver datos
npx prisma studio
```

### Producción (Vercel)

```bash
# Conectar a Vercel
vercel login
vercel link

# Descargar env
vercel env pull .env.local

# Migraciones
pnpm db:push

# Seed (opcional)
pnpm db:seed
```

### Generar Diagrama

```bash
# Prisma Studio (visual)
npx prisma studio

# O usar herramientas externas como dbdiagram.io
```

---

## 🔗 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [dbdiagram.io](https://dbdiagram.io) - Para generar diagramas ERD

---

¡Listo! Ahora tienes toda la información para entender, levantar y desplegar tu base de datos. 🎉


