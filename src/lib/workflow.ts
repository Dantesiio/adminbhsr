import type { AppRole } from './roles'

export type WorkflowStatus =
  | 'ENVIADA_COMPRAS'
  | 'EN_COMPARATIVO'
  | 'EN_AUTORIZACION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'OC_EMITIDA'
  | 'EN_RECEPCION'
  | 'CERRADA'

export type WorkflowActor =
  | AppRole
  | 'TESORERIA'
  | 'ALERTAS'
  | 'LOGISTICA'
  | 'PROVEEDOR'

export interface WorkflowStage {
  readonly status: WorkflowStatus
  readonly label: string
  readonly description: string
  readonly actor: WorkflowActor
  readonly guidance: string[]
  readonly next: WorkflowStatus[]
  readonly allowBackTo?: WorkflowStatus
}

export const workflowPath: WorkflowStatus[] = [
  'ENVIADA_COMPRAS',
  'EN_COMPARATIVO',
  'EN_AUTORIZACION',
  'APROBADA',
  'OC_EMITIDA',
  'EN_RECEPCION',
  'CERRADA',
]

export const workflowStages: Record<WorkflowStatus, WorkflowStage> = {
  ENVIADA_COMPRAS: {
    status: 'ENVIADA_COMPRAS',
    label: 'RQ enviada a Compras',
    description: 'La requisición fue creada por el solicitante y está lista para gestión de compras.',
    actor: 'COMPRAS',
    guidance: [
      'Validar que el centro logístico confirmó el código de centro de costo.',
      'Solicitar cotizaciones a los proveedores registrados.',
      'Cargar cotizaciones y documentos de soporte al sistema.',
    ],
    next: ['EN_COMPARATIVO'],
  },
  EN_COMPARATIVO: {
    status: 'EN_COMPARATIVO',
    label: 'En comparativo',
    description: 'Compras recibe cotizaciones y prepara el comparativo para selección de proveedor.',
    actor: 'COMPRAS',
    guidance: [
      'Registrar cada cotización recibida del proveedor.',
      'Analizar precios, disponibilidad y condiciones.',
      'Crear el comparativo con mínimo dos cotizaciones válidas.',
    ],
    next: ['EN_AUTORIZACION'],
    allowBackTo: 'ENVIADA_COMPRAS',
  },
  EN_AUTORIZACION: {
    status: 'EN_AUTORIZACION',
    label: 'Pendiente de autorización',
    description: 'El comparativo se envió a los autorizadores para revisión y comentarios.',
    actor: 'AUTORIZADOR',
    guidance: [
      'Revisar el comparativo y la documentación cargada.',
      'Completar la lista de verificación de presupuesto y políticas.',
      'Registrar comentarios y decidir aprobar o rechazar.',
    ],
    next: ['APROBADA', 'RECHAZADA'],
  },
  APROBADA: {
    status: 'APROBADA',
    label: 'Requisición aprobada',
    description: 'Todos los autorizadores aprobaron para generar orden de compra.',
    actor: 'LOGISTICA',
    guidance: [
      'Emitir la orden de compra referenciando la RQ y el proyecto.',
      'Enviar la orden al proveedor seleccionado con los anexos necesarios.',
    ],
    next: ['OC_EMITIDA'],
    allowBackTo: 'EN_AUTORIZACION',
  },
  RECHAZADA: {
    status: 'RECHAZADA',
    label: 'Requisición rechazada',
    description: 'Algún autorizador rechazó la RQ. Debe corregirse antes de reingresar a compras.',
    actor: 'SOLICITANTE',
    guidance: [
      'Revisar los comentarios del autorizador.',
      'Ajustar especificaciones, cantidades o documentación.',
      'Reenviar a Compras o cerrar la solicitud si ya no aplica.',
    ],
    next: ['ENVIADA_COMPRAS'],
  },
  OC_EMITIDA: {
    status: 'OC_EMITIDA',
    label: 'Orden de compra emitida',
    description: 'La orden de compra fue emitida y enviada al proveedor.',
    actor: 'LOGISTICA',
    guidance: [
      'Compartir la OC con Tesorería para programación de pagos.',
      'Coordinar con el proveedor la logística de entrega.',
      'Generar alerta de cierre parcial si aplica.',
    ],
    next: ['EN_RECEPCION'],
  },
  EN_RECEPCION: {
    status: 'EN_RECEPCION',
    label: 'Recepción en proceso',
    description: 'Se está validando la recepción de bienes y facturas contra la orden de compra.',
    actor: 'LOGISTICA',
    guidance: [
      'Registrar la recepción parcial o total en el sistema.',
      'Notificar a Tesorería para validar pagos y anticipos.',
      'Coordinar correcciones o devoluciones con el proveedor.',
    ],
    next: ['CERRADA'],
    allowBackTo: 'OC_EMITIDA',
  },
  CERRADA: {
    status: 'CERRADA',
    label: 'Proceso cerrado',
    description: 'Recepción validada, facturas conciliadas y pagos programados según políticas.',
    actor: 'TESORERIA',
    guidance: [
      'Confirmar cierre y archivar comparativos y OC.',
      'Actualizar el tablero de control y las métricas.',
      'Enviar alerta de cierre final a las áreas involucradas.',
    ],
    next: [],
  },
}

const REQUIRED_SEQUENCE = [
  'ENVIADA_COMPRAS',
  'EN_COMPARATIVO',
  'EN_AUTORIZACION',
  'APROBADA',
  'OC_EMITIDA',
  'EN_RECEPCION',
  'CERRADA',
] as const satisfies readonly WorkflowStatus[]

export function validateWorkflowDefinition(): string[] {
  const errors: string[] = []

  REQUIRED_SEQUENCE.forEach((status, index) => {
    const stage = workflowStages[status]
    if (!stage) {
      errors.push(`Estado ${status} no está definido en workflowStages`)
      return
    }
    const nextStatus = REQUIRED_SEQUENCE[index + 1]
    if (nextStatus && !stage.next.includes(nextStatus)) {
      errors.push(`El estado ${status} no conecta con ${nextStatus} como indica el flujo maestro`)
    }
  })

  Object.values(workflowStages).forEach((stage) => {
    stage.next.forEach((target) => {
      if (!workflowStages[target]) {
        errors.push(`El estado ${stage.status} apunta a un estado inexistente ${target}`)
      }
    })
  })

  return errors
}

export function getStageByStatus(status?: string | null): WorkflowStage | undefined {
  if (!status) return undefined
  return workflowStages[status as WorkflowStatus]
}

export function getRoleFocusStatuses(role: AppRole): WorkflowStatus[] {
  switch (role) {
    case 'SOLICITANTE':
      return ['ENVIADA_COMPRAS', 'RECHAZADA']
    case 'COMPRAS':
      return ['ENVIADA_COMPRAS', 'EN_COMPARATIVO']
    case 'AUTORIZADOR':
      return ['EN_AUTORIZACION']
    case 'ADMIN':
    default:
      return [...REQUIRED_SEQUENCE]
  }
}

export function getRoleGuidance(role: AppRole): string[] {
  const focus = getRoleFocusStatuses(role)
  const seen = new Set<string>()
  return focus
    .flatMap((status) => workflowStages[status]?.guidance || [])
    .filter((tip) => {
      if (seen.has(tip)) return false
      seen.add(tip)
      return true
    })
}
