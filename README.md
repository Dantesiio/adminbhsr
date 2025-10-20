# 🏥 AdminBHSR - Sistema de Requisiciones Hospital San Rafael

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.15-2D3748)](https://www.prisma.io/)

Sistema integral de gestión de requisiciones para el Hospital San Rafael. Implementa el flujo completo desde la solicitud hasta la orden de compra, con control de roles y estados.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **pnpm** ([Instalar](https://pnpm.io/installation)): `npm install -g pnpm`
- **Docker** ([Descargar](https://www.docker.com/)) - para la base de datos local

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Dantesiio/adminbhsr.git
cd adminbhsr

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local si es necesario (valores por defecto funcionan para desarrollo)
```

### Iniciar el Proyecto (Desarrollo)

```bash
# 1. Iniciar la base de datos (PostgreSQL en Docker)
./scripts/start-db.sh

# 2. Configurar la base de datos (primera vez solamente)
pnpm db:generate    # Generar cliente Prisma
pnpm db:push        # Crear tablas en la BD
pnpm db:seed        # Poblar datos de prueba

# 3. Iniciar el servidor de desarrollo
pnpm dev
```

🎉 **Listo!** Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Usuarios de Prueba (después del seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `solicitante@hospital.com` | `password123` | SOLICITANTE |
| `compras@hospital.com` | `password123` | COMPRAS |
| `autorizador@hospital.com` | `password123` | AUTORIZADOR |
| `admin@hospital.com` | `password123` | ADMIN |

---

## 🛠️ Tecnologías Principales

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth v5 con roles RBAC
- **Estilos**: Tailwind CSS
- **Formularios**: React Hook Form + Zod
- **PDFs**: @react-pdf/renderer
- **Emails**: Resend
- **Storage**: Vercel Blob

### Estructura del Flujo de Trabajo

#### 1. **Solicitante**
- ✅ Crear nuevas requisiciones (RQ)
- ✅ Especificar ítems con cantidades y especificaciones
- ✅ Vincular a proyectos y centros de costo
- ✅ Seguimiento de estado de sus requisiciones

#### 2. **Compras**
- ✅ Ver RQs pendientes de cotización
- ✅ Solicitar cotizaciones a proveedores
- ✅ Gestionar cotizaciones recibidas
- ✅ Crear comparativos cuando se tienen múltiples cotizaciones
- 🔄 Enviar a autorización una vez completado el comparativo

#### 3. **Autorizador**
- ✅ Revisar RQs con comparativo completo
- ✅ Lista de verificación para autorización
- ✅ Aprobar o rechazar con comentarios
- ✅ Historial de decisiones

#### 4. **Logística** (Preparado)
- 🔄 Generar órdenes de compra para RQs aprobadas
- 🔄 Gestionar recepción de productos
- 🔄 Actualizar estado de entregas

#### 5. **Tesorería** (Preparado)
- 🔄 Gestión de pagos
- 🔄 Control financiero de órdenes de compra

#### 6. **Administrador** (Preparado)
- 🔄 Gestión de catálogos maestros
- 🔄 Configuración de usuarios
- 🔄 Reportes y métricas

## Estados de las Requisiciones

1. **DRAFT** - Borrador (no implementado)
2. **ENVIADA_COMPRAS** - Enviada al departamento de compras
3. **EN_COMPARATIVO** - En proceso de comparativo de cotizaciones
4. **EN_AUTORIZACION** - Pendiente de autorización
5. **APROBADA** - Aprobada y lista para orden de compra
6. **RECHAZADA** - Rechazada por autorizador
7. **OC_EMITIDA** - Orden de compra emitida
8. **CERRADA** - Proceso completado

## 📦 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo (puerto 3000)
pnpm build            # Crear build de producción
pnpm start            # Iniciar servidor de producción
pnpm lint             # Ejecutar ESLint

# Base de datos
pnpm db:generate      # Generar cliente Prisma
pnpm db:push          # Sincronizar schema con la BD
pnpm db:seed          # Poblar datos de prueba

# Docker (Base de datos)
./scripts/start-db.sh  # Iniciar PostgreSQL en Docker
./scripts/stop-db.sh   # Detener PostgreSQL
```

## 🔧 Configuración Avanzada

### Variables de Entorno (`.env.local`)

```env
# Base de datos (local con Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dondiego"

# NextAuth
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Blob (opcional para desarrollo)
BLOB_READ_WRITE_TOKEN="tu_token_aqui"

# Resend (opcional para desarrollo)
RESEND_API_KEY="tu_api_key_aqui"
```

### Gestión de Base de Datos

```bash
# Ver los datos en Prisma Studio
npx prisma studio

# Resetear la base de datos (¡CUIDADO! Borra todos los datos)
pnpm db:push --force-reset
pnpm db:seed

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion
```

---

## 📁 Estructura del Proyecto

```
adminbhsr/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # Dashboard por rol
│   │   ├── login/             # Página de login
│   │   ├── rq/                # Gestión de requisiciones
│   │   │   ├── new/           # Crear RQ
│   │   │   ├── [id]/          # Ver/Editar RQ
│   │   │   │   ├── quotes/    # Cotizaciones
│   │   │   │   └── approve/   # Autorización
│   │   ├── projects/          # Proyectos
│   │   ├── cost-centers/      # Centros de costo
│   │   └── suppliers/         # Proveedores
│   ├── components/            # Componentes React
│   │   ├── Layout.tsx         # Layout principal
│   │   └── WorkflowTimeline.tsx
│   ├── lib/                   # Utilidades
│   │   ├── auth.ts            # Configuración NextAuth
│   │   ├── prisma.ts          # Cliente Prisma
│   │   └── roles.ts           # Definición de roles
│   └── types/                 # Tipos TypeScript
├── prisma/
│   ├── schema.prisma          # Esquema de la BD
│   └── seed.ts                # Datos de prueba
├── scripts/
│   ├── start-db.sh            # Iniciar BD en Docker
│   └── stop-db.sh             # Detener BD
└── middleware.ts              # Protección de rutas
```

---

## 🚀 Despliegue en Vercel

### Configuración

1. **Fork/Push el repositorio a GitHub**
2. **Ir a [Vercel](https://vercel.com) y crear nuevo proyecto**
3. **Conectar con el repositorio**
4. **Configurar variables de entorno:**
   - `DATABASE_URL` - desde Vercel Postgres
   - `NEXTAUTH_SECRET` - generar con `openssl rand -base64 32`
   - `NEXTAUTH_URL` - URL de producción
   - `BLOB_READ_WRITE_TOKEN` - desde Vercel Blob

5. **Agregar Vercel Postgres:**
   - En el dashboard del proyecto → Storage → Create Database
   - Seleccionar Postgres → Connect

6. **Agregar Vercel Blob:**
   - En el dashboard del proyecto → Storage → Create Store
   - Seleccionar Blob → Connect

7. **Desplegar:**
   ```bash
   git push origin main
   ```

### Primera ejecución en producción

Después del primer deploy, ejecutar el seed:
```bash
vercel env pull .env.local
pnpm db:seed
```

---

## 🔐 Sistema de Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **SOLICITANTE** | Crear RQs, ver sus propias requisiciones |
| **COMPRAS** | Gestionar cotizaciones, crear comparativos |
| **AUTORIZADOR** | Aprobar/rechazar RQs con comparativo |
| **LOGISTICA** | Crear órdenes de compra (en desarrollo) |
| **TESORERIA** | Gestión de pagos (en desarrollo) |
| **ADMIN** | Acceso total al sistema |

---

## 🎯 Flujo de Trabajo del Sistema

### 1️⃣ **Solicitante** crea RQ
- Llenar formulario con proyecto, centro de costo e ítems
- Enviar a compras

### 2️⃣ **Compras** gestiona cotizaciones
- Solicitar cotizaciones a proveedores
- Cargar respuestas recibidas
- Crear comparativo con 2+ cotizaciones
- Enviar a autorización

### 3️⃣ **Autorizador** revisa y aprueba
- Revisar comparativo
- Completar lista de verificación
- Aprobar o rechazar

### 4️⃣ **Logística** genera OC (próximamente)
- Crear orden de compra
- Gestionar recepción

---

## 🐛 Solución de Problemas

### La base de datos no conecta

```bash
# Verificar que Docker esté corriendo
docker ps

# Reiniciar la base de datos
./scripts/stop-db.sh
./scripts/start-db.sh

# Verificar logs
docker logs adminbhsr-postgres
```

### Error: "Module not found" o errores de TypeScript

```bash
# Limpiar y reinstalar
rm -rf node_modules .next
pnpm install
pnpm db:generate
```

### Problemas con el cache del navegador

1. Abrir DevTools (F12)
2. Click derecho en el botón Reload → "Empty Cache and Hard Reload"
3. O usar modo incógnito: `Cmd+Shift+N`

---

## 📝 Próximas Funcionalidades

- [ ] Módulo de Órdenes de Compra
- [ ] Gestión de recepción de productos
- [ ] Módulo de pagos (Tesorería)
- [ ] Reportes y analytics
- [ ] Notificaciones por email
- [ ] Historial de cambios (audit log)
- [ ] Exportación a Excel
- [ ] Dashboard con gráficas

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Proyecto privado - Hospital San Rafael

---

## 👥 Contacto

**Equipo de Desarrollo**
- GitHub: [@Dantesiio](https://github.com/Dantesiio)
- Proyecto: [AdminBHSR](https://github.com/Dantesiio/adminbhsr)
- **Proyectos**: ECHO Bolsas, ECHO 731, Mensajería
- **Centros de Costo**: Operaciones, Logística, Administración
- **RQ de Ejemplo**: RQ-0001 con ítems de bolsas

## Funcionalidades Implementadas ✅

### Core MVP
- [x] Creación de RQs con múltiples ítems
- [x] Dashboard por rol con RQs filtradas
- [x] Gestión de cotizaciones (interfaz)
- [x] Proceso de autorización completo
- [x] Navegación fluida entre roles
- [x] Vista detallada de RQs con toda la información
- [x] Estados de workflow claramente definidos
- [x] Interfaz responsiva y moderna

### Base de Datos
- [x] Esquema completo con todas las entidades
- [x] Relaciones entre RQs, cotizaciones, comparativos, etc.
- [x] Datos semilla para testing
- [x] Migraciones de Prisma configuradas

## Próximos Pasos (Roadmap)

### Fase 1 - Completar Workflow
- [ ] Implementar APIs reales para cotizaciones
- [ ] Integración con sistema de proveedores
- [ ] Generación de órdenes de compra
- [ ] Módulo de recepción/logística

### Fase 2 - Funcionalidades Avanzadas
- [ ] Autenticación real con NextAuth
- [ ] Notificaciones por email
- [ ] Carga de archivos (especificaciones, cotizaciones)
- [ ] Reportes y métricas

### Fase 3 - Optimizaciones
- [ ] Cache y optimización de performance
- [ ] Búsqueda y filtros avanzados
- [ ] Historial de cambios/auditoría
- [ ] Integración con sistemas existentes

## Estructura del Código

```
src/
├── app/                  # Rutas de Next.js App Router
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard por rol
│   ├── rq/              # Gestión de RQs
│   └── layout.tsx       # Layout principal
├── components/          # Componentes reutilizables
│   └── Layout.tsx       # Layout con navegación por rol
└── lib/                 # Utilidades
    ├── prisma.ts        # Cliente de Prisma
    └── roles.ts         # Lógica de roles

prisma/
├── schema.prisma        # Esquema de base de datos
├── seed.ts             # Datos de prueba
└── migrations/         # Migraciones de DB
```

## Contribución

Este es un MVP en desarrollo activo. Las próximas funcionalidades se desarrollarán basándose en feedback y requerimientos específicos del hospital.

---

**Versión**: Beta 1.0  
**Fecha**: Agosto 2025  
**Desarrollado para**: Hospital San Rafael
