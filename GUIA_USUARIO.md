# Manual de Usuario — AdminBHSR
## Sistema de Gestión de Requisiciones · Hospital San Rafael
### Fundación Italocolombiana del Monte Tabor · NIT 900.168.662-2

---

## Índice

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Acceso e inicio de sesión](#2-acceso-e-inicio-de-sesión)
3. [Interfaz principal](#3-interfaz-principal)
4. [Roles y permisos](#4-roles-y-permisos)
5. [Flujo de trabajo de una RQ](#5-flujo-de-trabajo-de-una-rq)
6. [Guía por rol](#6-guía-por-rol)
   - [Solicitante](#61-solicitante)
   - [Compras](#62-compras)
   - [Autorizador](#63-autorizador)
   - [Administrador](#64-administrador)
7. [Importación de RQs desde Excel](#7-importación-de-rqs-desde-excel)
8. [Registro de recepción de bienes](#8-registro-de-recepción-de-bienes)
9. [Generación de PDF del recibo](#9-generación-de-pdf-del-recibo)
10. [Estados de una RQ y sus colores](#10-estados-de-una-rq-y-sus-colores)
11. [Preguntas frecuentes](#11-preguntas-frecuentes)

---

## 1. Visión general del sistema

**AdminBHSR** es el sistema interno de gestión de Requisiciones de Compra (RQ) del Hospital San Rafael. Su objetivo es digitalizar y trazabilizar todo el ciclo de compra institucional, desde que un área crea la necesidad hasta que los bienes son recibidos y el proceso queda cerrado.

### ¿Qué hace el sistema?

| Etapa | ¿Quién actúa? | ¿Qué ocurre? |
|---|---|---|
| Creación de RQ | Solicitante | Se registra la necesidad con ítems y proyecto |
| Cotización | Compras | Se solicitan y cargan propuestas de proveedores |
| Comparativo | Compras | Se elige la mejor oferta |
| Autorización | Autorizador | Se aprueba o rechaza la compra |
| Orden de Compra | Logística / Admin | Se emite la OC al proveedor |
| Recepción | Compras | Se registra la entrega de bienes |
| Cierre | Sistema | La RQ queda cerrada y archivada |

---

## 2. Acceso e inicio de sesión

### Cómo ingresar

1. Abre tu navegador web (Chrome, Edge o Firefox recomendados).
2. Ve a la URL del sistema proporcionada por el administrador.
3. Ingresa tu **correo institucional** y **contraseña**.
4. Haz clic en **Iniciar sesión**.

> **Importante:** Si olvidaste tu contraseña o no tienes acceso, comunícate con el administrador del sistema. No compartas tus credenciales con otras personas.

### Cerrar sesión

En la esquina superior derecha del encabezado, haz clic en el botón **Salir**. Esto te redirigirá a la pantalla de inicio de sesión de forma segura.

---

## 3. Interfaz principal

### Barra lateral (Sidebar)

Al ingresar verás una barra lateral oscura a la izquierda de la pantalla. Esta es tu **navegación principal**.

```
┌─────────────────┐
│  [Logo] AdminBHSR│
│  ─────────────   │
│  Rol activo      │
│  Compras         │
│  ─────────────   │
│  ⊞ Dashboard     │  ← sección activa (resaltada en magenta)
│  ＋ Nueva RQ     │
│  ✎ Requisiciones │
│  🏢 Proveedores  │
│  📁 Proyectos    │
│  🏷 Centros CC   │
│  ─────────────   │
│  [Logo] v0.1     │
└─────────────────┘
```

- El ítem activo se resalta en **magenta**.
- Las opciones disponibles dependen de tu **rol** (ver sección 4).
- En móvil, la barra lateral se abre con el botón de **menú** (☰) en la esquina superior izquierda.

### Encabezado superior

La barra superior muestra:
- **Izquierda:** Ruta de navegación (breadcrumb) — por ejemplo: `AdminBHSR / Requisiciones`.
- **Derecha:** Tu nombre, rol activo, avatar con iniciales y botón **Salir**.

### Dashboard

El dashboard es la pantalla principal. Muestra:

- **4 tarjetas de indicadores (KPI):**
  - Total RQs registradas
  - RQs en proceso
  - RQs aprobadas
  - RQs cerradas

- **Tabla de requisiciones recientes** con columnas:
  - N° RQ · Proyecto / Título · Estado · Fecha · Ítems · Acción

- **Botón "Nueva RQ"** (visible para Solicitante y Admin) en la esquina superior derecha.

---

## 4. Roles y permisos

El sistema tiene cuatro roles. Tu rol es asignado por el administrador y determina qué puedes ver y hacer.

| Función | SOLICITANTE | COMPRAS | AUTORIZADOR | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Crear RQ | ✅ | — | — | ✅ |
| Ver sus propias RQs | ✅ | — | — | ✅ |
| Ver todas las RQs | — | ✅ | ✅ | ✅ |
| Gestionar cotizaciones | — | ✅ | — | ✅ |
| Aprobar / rechazar | — | — | ✅ | ✅ |
| Registrar recepción | — | ✅ | — | ✅ |
| Administrar proveedores | — | ✅ | — | ✅ |
| Administrar proyectos y CC | — | — | — | ✅ |
| Descargar PDF de recibo | — | ✅ | ✅ | ✅ |

---

## 5. Flujo de trabajo de una RQ

Cada RQ avanza por los siguientes estados. La **barra de progreso (Workflow Timeline)** visible en el detalle de cada RQ muestra en qué etapa se encuentra:

```
ENVIADA_COMPRAS → EN_COMPARATIVO → EN_AUTORIZACION → APROBADA → OC_EMITIDA → CERRADA
```

Si un autorizador rechaza, la RQ regresa a **ENVIADA_COMPRAS** para que Compras la corrija y reenvíe.

### Mapa de colores de estado

| Estado | Color | Significado |
|---|---|---|
| Borrador (DRAFT) | Gris | Guardado pero no enviado |
| En Compras | Azul | Recibida por Compras |
| Comparativo | Amarillo | En proceso de cotizaciones |
| Autorización | Naranja | Pendiente de aprobación |
| Aprobada | Verde | Lista para emitir OC |
| OC Emitida | Teal | Orden de compra enviada al proveedor |
| Cerrada | Gris oscuro | Proceso completado |
| Rechazada | Rojo | Devuelta por el autorizador |

---

## 6. Guía por rol

### 6.1 Solicitante

#### Cómo crear una RQ

1. En el menú lateral, haz clic en **Nueva RQ**.
2. Completa el formulario:

   **Sección: Información general**
   - **Proyecto** *(obligatorio):* Selecciona el proyecto al que pertenece la solicitud. Si no aparece el tuyo, contacta al administrador.
   - **Centro de Costo** *(opcional):* Selecciona el centro de costo correspondiente.
   - **Título** *(obligatorio):* Escribe un nombre descriptivo, por ejemplo: `Compra de bolsas para quirófano — Junio 2025`.
   - **Descripción general:** Agrega el contexto de la solicitud, urgencia o condiciones especiales.

   **Sección: Ítems de la requisición**
   - Por defecto aparece 1 ítem. Puedes agregar más con el botón **+ Agregar ítem**.
   - Por cada ítem completa:
     - **Descripción** *(obligatorio):* Nombre del producto o servicio.
     - **Línea / Especificación:** Línea de proyecto o detalles técnicos.
     - **Unidad:** Unidad de medida (unidad, caja, litro, etc.).
     - **Cantidad** *(obligatorio):* Número de unidades.
     - **Precio Unit COP** *(opcional):* Si conoces el precio referencial, ingrésalo. El sistema calculará el subtotal por ítem y el total general automáticamente.
   - Para eliminar un ítem, haz clic en el ícono de papelera al final de la fila.

3. Verifica el **Total estimado** que aparece en la barra al final de los ítems.
4. Haz clic en **Crear Requisición**.

> La RQ se enviará automáticamente a Compras con estado **En Compras**. Recibirás confirmación en pantalla y serás redirigido al detalle de la RQ.

#### Hacer seguimiento de tus RQs

1. En el menú lateral, haz clic en **Requisiciones**.
2. Verás la tabla con todas tus RQs ordenadas por fecha.
3. Haz clic en **Ver** en cualquier fila para abrir el detalle.
4. En el detalle encontrarás:
   - El estado actual con su color de referencia.
   - La barra de progreso del flujo.
   - Historial de aprobaciones si las hay.
   - Los ítems solicitados con totales.

#### ¿Qué hacer si mi RQ es rechazada?

Si el autorizador rechaza la RQ, aparecerá en estado **Rechazada** (rojo). El historial de aprobaciones mostrará el comentario con el motivo. En ese caso:

1. Revisa el comentario del autorizador.
2. Comunícate con Compras para ajustar la solicitud.
3. Una vez corregida, Compras la enviará nuevamente al flujo.

---

### 6.2 Compras

Tu rol es gestionar todas las RQs que llegan al departamento de compras, solicitar cotizaciones y preparar el comparativo para autorización.

#### Bandeja de trabajo

En el **Dashboard** verás las RQs en los estados que te corresponden:
- **En Compras** — nuevas solicitudes que necesitas revisar.
- **OC Emitida** — órdenes enviadas a proveedores esperando recepción.

#### Gestionar cotizaciones

1. Desde el Dashboard o desde Requisiciones, abre el detalle de una RQ en estado **En Compras** o **Comparativo**.
2. Haz clic en el botón **Gestionar Cotizaciones**.
3. Carga las propuestas recibidas de los proveedores.
4. Una vez listo el comparativo, avanza la RQ al estado **En Autorización**.

#### Registrar recepción de bienes

Ver sección [8. Registro de recepción de bienes](#8-registro-de-recepción-de-bienes).

---

### 6.3 Autorizador

Tu función es revisar los comparativos preparados por Compras y decidir si se aprueba o rechaza la compra.

#### Cómo revisar y autorizar una RQ

1. En el **Dashboard** verás las RQs en estado **Autorización** (naranja).
2. Haz clic en **Ver** para abrir el detalle.
3. Revisa:
   - Los ítems solicitados y sus montos.
   - Las cotizaciones recibidas (sección **Cotizaciones**).
   - El proveedor elegido en el comparativo.
4. Haz clic en **Revisar y Aprobar**.
5. Elige **Aprobar** o **Rechazar**.
6. Si rechazas, escribe un comentario con el motivo — este será visible para Compras y el solicitante.
7. Confirma tu decisión.

> Si apruebas, la RQ pasa a **Aprobada** y Logística podrá emitir la Orden de Compra.
> Si rechazas, la RQ regresa a **En Compras** con tu comentario.

---

### 6.4 Administrador

El rol Admin tiene acceso completo al sistema.

#### Funciones exclusivas del Admin

- **Proyectos** (menú lateral → Proyectos): Crear, editar y gestionar los proyectos disponibles para las RQs.
- **Centros de Costo** (menú lateral → Centros de Costo): Activar o desactivar centros de costo.
- **Proveedores** (menú lateral → Proveedores): Mantener el directorio de proveedores.
- **Dashboard global:** Visualiza todas las RQs de todos los roles y todos los estados.

---

## 7. Importación de RQs desde Excel

El sistema acepta el formato de Excel institucional (`.xlsx` / `.xls`) que ya utilizan los equipos. Esta función está disponible al crear una nueva RQ.

### Pasos para importar

1. Ve a **Nueva RQ** en el menú lateral.
2. En la cabecera de la página, haz clic en el botón **Importar Excel**.
3. Aparece el panel de importación con dos opciones:

#### Opción A: Arrastrar el archivo

- Arrastra tu archivo `.xlsx` desde el explorador de archivos hacia la **zona de carga** (área punteada).
- Suelta el archivo sobre la zona.

#### Opción B: Seleccionar el archivo

- Haz clic dentro de la zona punteada.
- Se abrirá el explorador de archivos. Selecciona tu archivo `.xlsx` o `.xls`.

### Qué pasa después de cargar el archivo

El sistema analizará automáticamente el Excel y mostrará una **vista previa** con:

- **Metadatos detectados:**
  - Consecutivo (N° de RQ original)
  - Fecha de solicitud
  - Proceso de compra

- **Tabla de ítems encontrados:**

| Línea proyecto | Descripción | Unidad | Cantidad | Precio Unit COP | Total |
|---|---|---|---|---|---|
| LP-001 | Bolsa de drenaje 100ml | Caja | 10 | $45.000 | $450.000 |

- **Total estimado** al pie de la tabla.

### Confirmar o cancelar la importación

- **Confirmar importación:** Los ítems se cargan en el formulario de nueva RQ. El título se rellena automáticamente con el número consecutivo.
- **Cancelar:** Limpia la vista previa y vuelve al formulario vacío.

> Después de confirmar, todavía puedes editar los ítems, cambiar el proyecto, centro de costo o título antes de enviar.

### Descargar la plantilla oficial

Si necesitas el formato exacto del Excel, haz clic en **↓ Descargar plantilla** en el panel de importación. Se descargará un archivo `Plantilla_RQ_AdminBHSR.xlsx` con la estructura correcta y datos de ejemplo.

### Formato esperado del Excel

El sistema detecta automáticamente la estructura del archivo. Las columnas que lee son:

| Columna Excel | Campo del sistema |
|---|---|
| Línea de proyecto | Especificación del ítem |
| Descripción | Nombre del ítem |
| Unidad de manejo | Unidad de medida |
| Cantidad Solicitada | Cantidad |
| Precio Unitario en COP | Precio unitario |

> El parser es tolerante con variaciones menores en los nombres de columnas. Si el archivo tiene errores de formato, el sistema mostrará un mensaje explicativo.

---

## 8. Registro de recepción de bienes

Cuando el proveedor entrega los bienes o servicios, Compras debe registrar la recepción en el sistema. Esta función está disponible cuando la RQ está en estado **OC Emitida**.

### Cómo registrar una recepción

1. Abre el detalle de la RQ en estado **OC Emitida**.
2. Haz clic en el botón **Registrar Recepción** (azul índigo).
3. Completa el formulario:

   **Fecha de recepción**
   - Selecciona la fecha en que se recibieron físicamente los bienes. No puede ser una fecha futura.

   **Estado de la recepción** *(obligatorio)*

   Hay dos opciones:

   | Estado | ¿Cuándo usarlo? | Efecto en la RQ |
   |---|---|---|
   | **CONFORME** | Los bienes llegaron completos y en buen estado, coinciden con la OC | La RQ se cierra automáticamente (estado: **Cerrada**) |
   | **NO CONFORME** | Hay faltantes, daños, diferencias de cantidad o calidad | La RQ permanece en **OC Emitida** para seguimiento |

   **Observaciones**
   - Para **CONFORME:** Campo opcional. Puedes anotar detalles relevantes de la entrega.
   - Para **NO CONFORME:** Campo **obligatorio**. Describe con detalle qué no corresponde: qué ítem faltó, qué estaba dañado, la diferencia encontrada, etc.

4. Haz clic en **Registrar recepción**.

### Ver recepciones anteriores

En la columna derecha del formulario de recepción verás el historial de todas las recepciones registradas para esa RQ, con fecha y estado de cada una.

También puedes ver el historial desde el **Detalle de la RQ** en la sección **Recepciones registradas**.

---

## 9. Generación de PDF del recibo

Cuando una RQ está en estado **Cerrada**, puedes descargar el **Recibo de Recepción** en formato PDF.

### Cómo descargar el PDF

1. Abre el detalle de la RQ (estado: **Cerrada**).
2. En la barra de botones de acción, haz clic en **Descargar recibo PDF**.
3. El archivo se descargará con el nombre `recibo-RQ-XXXX.pdf`.

### Contenido del PDF

El recibo incluye:

- **Encabezado:** Nombre de la Fundación, NIT, identificación "RECIBO DE RECEPCIÓN" y número de RQ.
- **Información general:** Proyecto, solicitante, fecha de la RQ, estado.
- **Datos de la OC:** Número de orden, proveedor y total (si aplica).
- **Tabla de ítems:** Descripción, unidad, cantidad, precio unitario y total por ítem.
- **Total general en COP.**
- **Estado de recepción:** CONFORME / NO CONFORME con fecha y observaciones.
- **Sección de firmas:** Tres campos en blanco para firma física: Recibido por · Revisado por · Aprobado por.
- **Pie de página:** Fecha y hora de generación del documento.

---

## 10. Estados de una RQ y sus colores

Referencia rápida de todos los estados posibles:

| Estado | Etiqueta | Color | ¿Quién puede avanzarlo? |
|---|---|---|---|
| DRAFT | Borrador | Gris | Solicitante |
| ENVIADA_COMPRAS | En Compras | Azul | Compras |
| EN_COMPARATIVO | Comparativo | Amarillo | Compras |
| EN_AUTORIZACION | Autorización | Naranja | Autorizador |
| APROBADA | Aprobada | Verde | Admin / Logística |
| OC_EMITIDA | OC Emitida | Teal | Compras |
| CERRADA | Cerrada | Gris oscuro | Sistema (automático) |
| RECHAZADA | Rechazada | Rojo | — (transición automática) |

---

## 11. Preguntas frecuentes

**¿Puedo editar una RQ después de crearla?**
No directamente. Una vez enviada, Compras gestiona el proceso. Si necesitas correcciones, comunícate con Compras para que devuelvan la RQ.

**¿Por qué no veo el botón "Nueva RQ"?**
El botón solo aparece para roles SOLICITANTE y ADMIN. Si tienes otro rol, no puedes crear RQs directamente.

**Mi Excel no se importó correctamente. ¿Qué hago?**
Verifica que tu archivo tenga la fila de encabezados con las columnas "Descripción" y "Cantidad Solicitada". Descarga la plantilla oficial (botón **↓ Descargar plantilla** en el panel de importación) y compara la estructura. Los archivos con contraseña o muy dañados no se pueden procesar.

**¿El sistema guarda los precios del Excel?**
Sí. El precio unitario se guarda en el campo de especificaciones del ítem y se usa para calcular totales en la vista de detalle y en el PDF.

**¿Qué pasa si registro una recepción NO CONFORME?**
La RQ permanece en estado **OC Emitida** y el incidente queda registrado en el historial. El equipo de Compras debe coordinar con el proveedor para resolver la diferencia y puede registrar una nueva recepción cuando se subsane.

**¿Cuántas veces puedo registrar recepciones en una RQ?**
Puedes registrar múltiples recepciones (por ejemplo, entregas parciales). La RQ solo se cerrará cuando registres una recepción **CONFORME**.

**No encuentro mi proyecto en la lista al crear una RQ.**
Los proyectos son administrados por el rol Admin. Solicita al administrador que cree el proyecto correspondiente.

**¿El sistema funciona en celular?**
Sí. La interfaz es responsive. En dispositivos móviles el menú lateral aparece como un panel deslizable que se abre con el botón ☰ en la esquina superior izquierda.

---

*Manual generado para AdminBHSR v0.1 · Fundación Italocolombiana del Monte Tabor · Hospital San Rafael*
*Para soporte técnico, contacta al administrador del sistema.*
