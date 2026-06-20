import api from './api'
import type {
  Project,
  ProjectStage,
  ProjectStatus,
  TransferRecord,
  Difficulty,
  ProjectNote,
  BenefitBatch,
  AbolishRequest,
  StageConfig,
  Priority,
  TransferReason,
} from '../types'

// ==================== 项目 API ====================
export const projectApi = {
  list(params?: {
    stage?: ProjectStage
    status?: ProjectStatus
    owner?: string
    search?: string
    maintenance?: boolean
  }) {
    return api.get('/projects', { params }) as Promise<{ projects: Project[] }>
  },

  maintenance() {
    return api.get('/projects/maintenance') as Promise<{ projects: Project[] }>
  },

  reserved() {
    return api.get('/projects/reserved') as Promise<{ projects: Project[] }>
  },

  detail(id: string) {
    return api.get(`/projects/${id}`) as Promise<{
      project: Project
      transfers: TransferRecord[]
      difficulties: Difficulty[]
      notes: ProjectNote[]
      benefitBatches: BenefitBatch[]
    }>
  },

  create(data: {
    name: string
    description: string
    stage: ProjectStage
    ownerIds: string[]
    expectedCompletionDate?: string
    relatedClient?: string
    expectedBenefit?: number
    priority?: Priority
    reminderCycle?: string
  }) {
    return api.post('/projects', data) as Promise<{ project: Project }>
  },

  update(id: string, data: Partial<Project> & { ownerIds?: string[] }) {
    return api.put(`/projects/${id}`, data) as Promise<{ project: Project }>
  },

  toggleFavorite(id: string) {
    return api.patch(`/projects/${id}/favorite`) as Promise<{ isFavorited: boolean }>
  },

  setPriority(id: string, priority: Priority) {
    return api.patch(`/projects/${id}/priority`, { priority }) as Promise<{ priority: Priority }>
  },
}

// ==================== 流转 API ====================
export const transferApi = {
  list(params?: { projectId?: string; toUserId?: string; status?: string }) {
    return api.get('/transfers', { params }) as Promise<{ transfers: TransferRecord[] }>
  },

  create(data: {
    projectId: string
    fromUserId?: string
    toUserId: string
    fromStage: ProjectStage
    toStage: ProjectStage
    reason: TransferReason
    customReason?: string
    note?: string
  }) {
    return api.post('/transfers', data) as Promise<{ transfer: TransferRecord }>
  },

  respond(id: string, accept: boolean, reason?: string) {
    return api.put(`/transfers/${id}/respond`, { accept, reason }) as Promise<{ transfer: TransferRecord }>
  },
}

// ==================== 困难 API ====================
export const difficultyApi = {
  list(projectId?: string) {
    return api.get('/difficulties', {
      params: projectId ? { projectId } : undefined,
    }) as Promise<{ difficulties: Difficulty[] }>
  },

  create(data: { projectId: string; content: string; mentionedUserIds?: string[] }) {
    return api.post('/difficulties', data) as Promise<{ difficulty: Difficulty }>
  },

  updateStatus(id: string, status: Difficulty['status']) {
    return api.put(`/difficulties/${id}`, { status }) as Promise<{ difficulty: Difficulty }>
  },

  delete(id: string) {
    return api.delete(`/difficulties/${id}`) as Promise<{ message: string }>
  },
}

// ==================== 备注 API ====================
export const noteApi = {
  list(projectId: string) {
    return api.get('/notes', { params: { projectId } }) as Promise<{ notes: ProjectNote[] }>
  },

  create(data: { projectId: string; content: string }) {
    return api.post('/notes', data) as Promise<{ note: ProjectNote }>
  },

  delete(id: string) {
    return api.delete(`/notes/${id}`) as Promise<{ message: string }>
  },
}

// ==================== 收益批次 API ====================
export const benefitApi = {
  list(projectId: string) {
    return api.get('/benefit-batches', { params: { projectId } }) as Promise<{ benefitBatches: BenefitBatch[] }>
  },

  create(data: { projectId: string; amount: number; note?: string }) {
    return api.post('/benefit-batches', data) as Promise<{ benefitBatch: BenefitBatch }>
  },
}

// ==================== 废止申请 API ====================
export const abolishApi = {
  list(status?: string) {
    return api.get('/abolish-requests', {
      params: status ? { status } : undefined,
    }) as Promise<{ abolishRequests: AbolishRequest[] }>
  },

  submit(data: { projectId: string; reason: string }) {
    return api.post('/abolish-requests', data) as Promise<{ abolishRequest: AbolishRequest }>
  },

  review(id: string, approved: boolean, reviewNote?: string) {
    return api.put(`/abolish-requests/${id}/review`, { approved, reviewNote }) as Promise<{
      abolishRequest: AbolishRequest
    }>
  },
}

// ==================== 环节配置 API ====================
export const stageConfigApi = {
  list() {
    return api.get('/stage-configs') as Promise<{ stageConfigs: StageConfig[] }>
  },

  update(stage: string, standardDurationHours: number) {
    return api.put(`/stage-configs/${stage}`, { standardDurationHours }) as Promise<{
      stageConfig: StageConfig
    }>
  },
}
