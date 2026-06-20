import { cn } from '../../utils/helpers'
import type { Priority } from '../../types'

interface PriorityBadgeProps {
  priority?: Priority
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return null

  const config = {
    high: { label: '高', className: 'bg-red-100 text-red-700' },
    medium: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
    low: { label: '低', className: 'bg-green-100 text-green-700' },
  }

  const { label, className } = config[priority]

  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium', className)}>
      {label}
    </span>
  )
}
