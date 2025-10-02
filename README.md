# adminbhsr App - Sistema de Requisiciones Hospital San Rafael

## MVP - Fase Beta

Este es un MVP (Producto Mínimo Viable) del sistema de requisiciones para el Hospital San Rafael, implementando el flujo completo desde la solicitud inicial hasta la gestión de órdenes de compra.

## Arquitectura del Sistema

### Tecnologías Utilizadas
- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Base de Datos**: Vercel Postgres + Prisma ORM
- **Almacenamiento**: Vercel Blob (o S3 alternativo)
- **Autenticación**: Auth.js (NextAuth v5) con roles RBAC
- **Emails**: Resend
- **PDFs**: @react-pdf/renderer
- **Estilos**: Tailwind CSS
- **Formularios**: React Hook Form + Zod

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

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Vercel Postgres (o PostgreSQL local)
- Vercel Blob (o S3)
- pnpm (recomendado)

### Pasos de Instalación

1. **Clonar e instalar dependencias**
```bash
git clone <repository>
cd adminbhsr
pnpm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con:
# - DATABASE_URL (Vercel Postgres)
# - AUTH_SECRET (generar uno fuerte)
# - BLOB_READ_WRITE_TOKEN (Vercel Blob)
# - RESEND_API_KEY
```

3. **Configurar base de datos**
```bash
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
```

4. **Iniciar servidor de desarrollo**
```bash
pnpm dev
```

### Despliegue en Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Vincular Vercel Postgres y Blob
4. Desplegar

## Uso del Sistema

### Navegación por Roles

La aplicación está diseñada para funcionar con diferentes roles. Puedes cambiar de rol usando el selector en la barra de navegación.

#### Como Solicitante:
1. Ir a "Nueva RQ"
2. Llenar formulario con proyecto, ítems requeridos
3. Enviar requisición
4. Hacer seguimiento en "Mis Requisiciones"

#### Como Compras:
1. Ver "RQs Pendientes" en dashboard
2. Hacer clic en "Gestionar Cotizaciones"
3. Solicitar cotizaciones a proveedores
4. Una vez con 2+ cotizaciones, crear comparativo
5. Enviar a autorización

#### Como Autorizador:
1. Ver "Pendientes Autorización" en dashboard
2. Hacer clic en "Revisar" para cada RQ
3. Revisar comparativo y completar lista de verificación
4. Aprobar o rechazar con comentarios

### Datos de Prueba

El sistema incluye datos de prueba:
- **Usuarios**: Un usuario por cada rol
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
