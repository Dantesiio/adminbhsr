```mermaid
graph TD
    A[Solicitante crea RQ] --> B[RQ ENVIADA_COMPRAS]
    B --> C[Compras solicita cotizaciones]
    C --> D[Recibe cotizaciones de proveedores]
    D --> E{¿Tiene 2+ cotizaciones?}
    E -->|No| C
    E -->|Sí| F[Crea comparativo]
    F --> G[RQ EN_AUTORIZACION]
    G --> H[Autorizador revisa]
    H --> I{¿Aprobada?}
    I -->|No| J[RQ RECHAZADA]
    I -->|Sí| K[RQ APROBADA]
    K --> L[Logística genera OC]
    L --> M[RQ OC_EMITIDA]
    M --> N[Recepción de productos]
    N --> O[RQ CERRADA]
    
    J --> P[Fin del proceso]
    O --> P

    style A fill:#e1f5fe
    style B fill:#fff3e0
    style G fill:#fff8e1
    style K fill:#e8f5e8
    style J fill:#ffebee
    style M fill:#f3e5f5
    style O fill:#e0e0e0
```

## Flujo de Trabajo del Sistema de Requisiciones

### Fases del Proceso

#### 1. Inicio del Proceso
- **Solicitante** crea una nueva RQ especificando:
  - Proyecto asociado
  - Centro de costo (opcional)
  - Lista de ítems con cantidades y especificaciones
  - La RQ pasa automáticamente a estado **ENVIADA_COMPRAS**

#### 2. Gestión de Cotizaciones
- **Compras** ve la RQ en su dashboard
- Solicita cotizaciones a múltiples proveedores
- Recibe y registra cotizaciones
- Una vez con 2+ cotizaciones, crea el comparativo
- La RQ pasa a estado **EN_AUTORIZACION**

#### 3. Proceso de Autorización
- **Autorizador** revisa el comparativo
- Completa lista de verificación
- Decide aprobar o rechazar con comentarios
- Si aprueba: **APROBADA**
- Si rechaza: **RECHAZADA** (fin del proceso)

#### 4. Generación de Orden de Compra
- **Logística** genera la orden de compra
- Selecciona el proveedor del comparativo
- La RQ pasa a **OC_EMITIDA**

#### 5. Recepción y Cierre
- **Logística** gestiona la recepción
- Una vez recibido, la RQ pasa a **CERRADA**

### Roles y Responsabilidades

| Rol | Responsabilidades | Dashboard |
|-----|------------------|-----------|
| **Solicitante** | Crear RQs, hacer seguimiento | Mis requisiciones activas |
| **Compras** | Gestionar cotizaciones y comparativos | RQs pendientes de cotización |
| **Autorizador** | Aprobar/rechazar basándose en comparativos | RQs pendientes de autorización |
| **Logística** | Generar OCs y gestionar recepción | OCs pendientes |
| **Tesorería** | Gestionar pagos | Pagos pendientes |
| **Admin** | Configurar sistema y usuarios | Vista completa |
