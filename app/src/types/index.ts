export type UserRole = 'super_admin' | 'admin' | 'member'

export interface User {
  id: string
  username: string
  password: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  status: 'active' | 'disabled'
  createdAt: string
}

export type ProjectStage = 'initial_visit' | 'collect_docs' | 'form_report' | 'under_review' | 'disbursement' | 'maintenance'
export type MaintenanceSubStage = 'pending_callback' | 'potential_mining'
export type ProjectStatus = 'active' | 'abolished' | 'reserved'
export type TransferReason = 'task_handover' | 'stage_advance' | 'issue_feedback' | 'other'
export type TransferStatus = 'pending' | 'accepted' | 'rejected'
export type DifficultyStatus = 'pending' | 'processing' | 'resolved'
export type Priority = 'high' | 'medium' | 'low'

export const STAGE_LABELS: Record<ProjectStage, string> = {
  initial_visit: '初访',
  collect_docs: '收资料-建档',
  form_report: '形成报告',
  under_review: '审批中',
  disbursement: '放款',
  maintenance: '日常维护',
}

export const MAINTENANCE_SUB_LABELS: Record<MaintenanceSubStage, string> = {
  pending_callback: '待回访',
  potential_mining: '挖潜中',
}

export const TRANSFER_REASON_LABELS: Record<TransferReason, string> = {
  task_handover: '任务交接',
  stage_advance: '环节推进',
  issue_feedback: '问题反馈',
  other: '其他',
}

export const STAGE_ORDER: ProjectStage[] = [
  'initial_visit',
  'collect_docs',
  'form_report',
  'under_review',
  'disbursement',
  'maintenance',
]

export interface Project {
  id: string
  projectNo: string
  name: string
  description: string
  stage: ProjectStage
  maintenanceSubStage?: MaintenanceSubStage
  status: ProjectStatus
  creatorId: string
  ownerIds: string[]
  expectedCompletionDate: string
  relatedClient?: string
  expectedBenefit?: number
  producedBenefit?: number
  benefitNote?: string
  createdAt: string
  updatedAt: string
  stageEnteredAt: string
  isFavorited: boolean
  priority?: Priority
  nextReminderAt?: string
  reminderCycle?: 'monthly' | 'quarterly' | 'custom'
}

export interface TransferRecord {
  id: string
  projectId: string
  fromUserId: string
  toUserId: string
  fromStage: ProjectStage
  toStage: ProjectStage
  reason: TransferReason
  customReason?: string
  note?: string
  status: TransferStatus
  rejectReason?: string
  createdAt: string
  respondedAt?: string
}

export interface Difficulty {
  id: string
  projectId: string
  authorId: string
  content: string
  status: DifficultyStatus
  mentionedUserIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ProjectNote {
  id: string
  projectId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface BenefitBatch {
  id: string
  projectId: string
  amount: number
  note?: string
  createdBy: string
  createdAt: string
}

export interface AbolishRequest {
  id: string
  projectId: string
  requesterId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewerId?: string
  reviewNote?: string
  createdAt: string
  reviewedAt?: string
}

export interface StageConfig {
  stage: ProjectStage
  standardDurationHours: number
}

export interface EditHistory {
  id: string
  projectId: string
  editorId: string
  field: string
  oldValue: string
  newValue: string
  createdAt: string
}
