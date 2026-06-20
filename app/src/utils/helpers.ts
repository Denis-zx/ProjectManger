import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import type { ProjectStage, MaintenanceSubStage } from '../types'
import { STAGE_LABELS, MAINTENANCE_SUB_LABELS } from '../types'

dayjs.extend(duration)

export function formatStageTime(stageEnteredAt: string): string {
  const entered = dayjs(stageEnteredAt)
  const now = dayjs()
  const diff = now.diff(entered)
  const d = dayjs.duration(diff)
  const days = Math.floor(d.asDays())
  const hours = d.hours()
  const minutes = d.minutes()
  return `${days}天${hours}小时${minutes}分钟`
}

export function getStageLabel(stage: ProjectStage, subStage?: MaintenanceSubStage): string {
  if (stage === 'maintenance' && subStage) {
    return `${STAGE_LABELS[stage]}·${MAINTENANCE_SUB_LABELS[subStage]}`
  }
  return STAGE_LABELS[stage]
}

export function getStageProgress(stage: ProjectStage): number {
  const stages: ProjectStage[] = ['initial_visit', 'collect_docs', 'form_report', 'under_review', 'disbursement', 'maintenance']
  const idx = stages.indexOf(stage)
  return Math.round(((idx + 1) / stages.length) * 100)
}

export function formatDate(dateStr: string, format: string = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(dateStr).format(format)
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function getInitials(name: string): string {
  return name.slice(0, 1)
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 }).format(amount)
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
