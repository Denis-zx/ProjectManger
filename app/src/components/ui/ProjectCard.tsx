import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../store/projectStore'
import { useUsers } from '../../hooks/useUsers'
import { cn, formatStageTime, truncateText, getStageLabel } from '../../utils/helpers'
import Avatar from './Avatar'
import PriorityBadge from './PriorityBadge'
import type { Project } from '../../types'

interface ProjectCardProps {
  project: Project
  compact?: boolean
}

export default function ProjectCard({ project, compact = false }: ProjectCardProps) {
  const navigate = useNavigate()
  const { getStageElapsedTime, getStageDuration, isOverdue, isWarning } = useProjectStore()
  const { getUserById } = useUsers()

  const overdue = isOverdue(project)
  const warning = isWarning(project)
  const elapsed = getStageElapsedTime(project)
  const standard = getStageDuration(project.stage)

  const getOwnerName = () => {
    const user = getUserById(project.ownerIds[0])
    return user?.name || '未知'
  }

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className={cn(
        'bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all',
        overdue ? 'border-red-300 bg-red-50/30' : warning ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-200',
        compact && 'p-2'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm text-gray-900 leading-tight flex-1">
          {truncateText(project.name, compact ? 8 : 20)}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {project.isFavorited && <span className="text-yellow-400 text-xs">★</span>}
          {overdue && <span className="text-red-500 text-xs">⚠️</span>}
          {warning && !overdue && <span className="text-yellow-500 text-xs">🔔</span>}
          <PriorityBadge priority={project.priority} />
        </div>
      </div>

      <div className={cn('text-xs mb-2', overdue ? 'text-red-600 font-medium' : 'text-gray-500')}>
        ⏱ {formatStageTime(project.stageEnteredAt)}
        {standard > 0 && (
          <span className="ml-1 text-gray-400">
            (标准{standard}h)
          </span>
        )}
      </div>

      {!compact && project.description && (
        <p className="text-xs text-gray-500 mb-2 leading-relaxed">
          {truncateText(project.description, 50)}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={getOwnerName()} size="sm" />
          <span className="text-xs text-gray-600">{getOwnerName()}</span>
        </div>
        <span className="text-xs text-gray-400">
          {getStageLabel(project.stage, project.maintenanceSubStage)}
        </span>
      </div>
    </div>
  )
}
