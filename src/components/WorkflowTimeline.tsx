import clsx from 'clsx'
import {
  workflowPath,
  workflowStages,
  validateWorkflowDefinition,
  type WorkflowStatus,
} from '@/lib/workflow'

interface WorkflowTimelineProps {
  readonly currentStatus?: string | null
  readonly compact?: boolean
}

function getStatusIndex(status?: string | null) {
  if (!status) return -1
  const normalized = status.toUpperCase() as WorkflowStatus
  const canonicalIndex = workflowPath.indexOf(normalized)
  if (canonicalIndex >= 0) return canonicalIndex
  if (normalized === 'RECHAZADA') {
    return workflowPath.indexOf('EN_AUTORIZACION')
  }
  return -1
}

export function WorkflowTimeline({ currentStatus, compact = false }: WorkflowTimelineProps) {
  const errors = validateWorkflowDefinition()
  const activeIndex = getStatusIndex(currentStatus)
  const rejected = currentStatus?.toUpperCase() === 'RECHAZADA'

  return (
    <div className={clsx('space-y-4', compact && 'space-y-2')}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-plum">Flujo del proceso</p>
          <p className="text-xs text-brand-plum/60">
            {currentStatus ? `Estado actual: ${currentStatus.replaceAll('_', ' ')}` : 'Sin estado asignado'}
          </p>
        </div>
        {errors.length === 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-magenta/15 px-2 py-1 text-xs font-medium text-brand-magentaDark">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Flujo validado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
            Flujo requiere ajustes
          </span>
        )}
      </div>

      <div className={clsx('max-w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}>
        <div
          className={clsx(
            'relative flex flex-col md:flex-row md:flex-wrap',
            compact ? 'gap-3 md:gap-4' : 'gap-4 md:gap-6'
          )}
        >
        {workflowPath.map((status, index) => {
          const stage = workflowStages[status]
          const isCompleted = activeIndex > index
          const isActive = activeIndex === index && !rejected

          return (
            <div key={status} className={clsx('flex-1 min-w-[140px] md:flex-[1_1_180px]')}> 
              <div
                className={clsx(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition-colors',
                  isActive && 'border-brand-magenta bg-white text-brand-magentaDark shadow-brandSoft',
                  isCompleted && !isActive && 'border-brand-magenta/50 bg-brand-magenta/10 text-brand-magentaDark',
                  !isActive && !isCompleted && 'border-brand-magenta/10 bg-white text-brand-plum/65'
                )}
              >
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold',
                    isActive && 'border-brand-magenta bg-brand-magenta/15 text-brand-magentaDark',
                    isCompleted && !isActive && 'border-brand-magenta/40 bg-brand-magenta/10 text-brand-magentaDark',
                    !isActive && !isCompleted && 'border-brand-magenta/15 bg-brand-magenta/5 text-brand-plum/60'
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-plum">
                    {stage.label}
                  </span>
                  <span className="text-[11px] text-brand-plum/60">
                    {stage.actor}
                  </span>
                </div>
              </div>
              <p className={clsx('mt-2 text-xs leading-relaxed text-brand-plum/60', compact && 'hidden md:block')}>
                {stage.description}
              </p>
              {rejected && status === 'EN_AUTORIZACION' && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0 9 9 0 0112.728 0zM9 9l6 6m0-6l-6 6" />
                  </svg>
                  Rechazada - volver a Compras
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <p className="font-semibold mb-1">Inconsistencias detectadas en el workflow:</p>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
