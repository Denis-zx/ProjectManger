import { create } from 'zustand'
import type { Project, ProjectStage, TransferRecord, Difficulty, ProjectNote, BenefitBatch, AbolishRequest, StageConfig, Priority } from '../types'
import dayjs from 'dayjs'
import {
  projectApi,
  transferApi,
  difficultyApi,
  noteApi,
  benefitApi,
  abolishApi,
  stageConfigApi,
} from '../services/projectApi'

interface ProjectState {
  projects: Project[]
  transfers: TransferRecord[]
  difficulties: Difficulty[]
  notes: ProjectNote[]
  benefitBatches: BenefitBatch[]
  abolishRequests: AbolishRequest[]
  stageConfigs: StageConfig[]
  loading: boolean
  error: string | null

  // 数据加载
  fetchProjects: (params?: { stage?: ProjectStage; status?: string; owner?: string; search?: string }) => Promise<void>
  fetchMaintenanceProjects: () => Promise<void>
  fetchReservedProjects: () => Promise<void>
  fetchProjectDetail: (id: string) => Promise<void>
  fetchTransfers: (params?: { toUserId?: string; status?: string }) => Promise<void>
  fetchAbolishRequests: (status?: string) => Promise<void>
  fetchStageConfigs: () => Promise<void>

  // 项目操作
  getProjectById: (id: string) => Project | undefined
  getProjectsByStage: (stage: ProjectStage) => Project[]
  getProjectsByOwner: (userId: string) => Project[]
  getReservedProjects: () => Project[]
  getMaintenanceProjects: () => Project[]
  createProject: (projectData: any) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  toggleFavorite: (projectId: string) => Promise<void>
  setPriority: (projectId: string, priority: Priority) => Promise<void>

  // 流转操作
  createTransfer: (transfer: any) => Promise<void>
  respondTransfer: (transferId: string, accept: boolean, reason?: string) => Promise<void>

  // 困难操作
  addDifficulty: (projectId: string, authorId: string, content: string, mentionedUserIds?: string[]) => Promise<void>
  updateDifficultyStatus: (difficultyId: string, status: Difficulty['status']) => Promise<void>
  deleteDifficulty: (difficultyId: string) => Promise<void>

  // 备注操作
  addNote: (projectId: string, authorId: string, content: string) => Promise<void>
  deleteNote: (noteId: string) => Promise<void>

  // 收益操作
  addBenefitBatch: (projectId: string, amount: number, note: string, createdBy: string) => Promise<void>

  // 废止操作
  submitAbolishRequest: (projectId: string, requesterId: string, reason: string) => Promise<void>
  reviewAbolishRequest: (requestId: string, approved: boolean, reviewerId: string, reviewNote?: string) => Promise<void>

  // 环节配置
  updateStageConfig: (stage: ProjectStage, hours: number) => Promise<void>

  // 辅助方法
  getStageDuration: (stage: ProjectStage) => number
  getStageElapsedTime: (project: Project) => number
  isOverdue: (project: Project) => boolean
  isWarning: (project: Project) => boolean
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  transfers: [],
  difficulties: [],
  notes: [],
  benefitBatches: [],
  abolishRequests: [],
  stageConfigs: [],
  loading: false,
  error: null,

  fetchProjects: async (params) => {
    set({ loading: true, error: null })
    try {
      const { projects } = await projectApi.list(params)
      set({ projects, loading: false })
    } catch (err: any) {
      set({ loading: false, error: err.message })
    }
  },

  fetchMaintenanceProjects: async () => {
    set({ loading: true, error: null })
    try {
      const { projects } = await projectApi.maintenance()
      set({ projects, loading: false })
    } catch (err: any) {
      set({ loading: false, error: err.message })
    }
  },

  fetchReservedProjects: async () => {
    set({ loading: true, error: null })
    try {
      const { projects } = await projectApi.reserved()
      set({ projects, loading: false })
    } catch (err: any) {
      set({ loading: false, error: err.message })
    }
  },

  fetchProjectDetail: async (id) => {
    set({ loading: true, error: null })
    try {
      const data = await projectApi.detail(id)
      set({
        loading: false,
        projects: get().projects.some(p => p.id === id)
          ? get().projects.map(p => p.id === id ? data.project : p)
          : [...get().projects, data.project],
        transfers: data.transfers,
        difficulties: data.difficulties,
        notes: data.notes,
        benefitBatches: data.benefitBatches,
      })
    } catch (err: any) {
      set({ loading: false, error: err.message })
    }
  },

  fetchTransfers: async (params) => {
    try {
      const { transfers } = await transferApi.list(params)
      set({ transfers })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  fetchAbolishRequests: async (status) => {
    try {
      const { abolishRequests } = await abolishApi.list(status)
      set({ abolishRequests })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  fetchStageConfigs: async () => {
    try {
      const { stageConfigs } = await stageConfigApi.list()
      set({ stageConfigs })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  getProjectById: (id) => get().projects.find(p => p.id === id),

  getProjectsByStage: (stage) => get().projects.filter(p => p.stage === stage && p.status === 'active'),

  getProjectsByOwner: (userId) => get().projects.filter(p => p.ownerIds.includes(userId) && p.status === 'active'),

  getReservedProjects: () => get().projects.filter(p => p.status === 'reserved'),

  getMaintenanceProjects: () => get().projects.filter(p => p.stage === 'maintenance' && p.status === 'active'),

  createProject: async (projectData) => {
    const { project } = await projectApi.create(projectData)
    set(state => ({ projects: [...state.projects, project] }))
    return project
  },

  updateProject: async (id, updates) => {
    const { project } = await projectApi.update(id, updates)
    set(state => ({
      projects: state.projects.map(p => p.id === id ? project : p),
    }))
  },

  toggleFavorite: async (projectId) => {
    const { isFavorited } = await projectApi.toggleFavorite(projectId)
    set(state => ({
      projects: state.projects.map(p =>
        p.id === projectId ? { ...p, isFavorited } : p
      ),
    }))
  },

  setPriority: async (projectId, priority) => {
    await projectApi.setPriority(projectId, priority)
    set(state => ({
      projects: state.projects.map(p =>
        p.id === projectId ? { ...p, priority } : p
      ),
    }))
  },

  createTransfer: async (transferData) => {
    const { transfer } = await transferApi.create(transferData)
    set(state => ({ transfers: [...state.transfers, transfer] }))
    await get().fetchProjects()
  },

  respondTransfer: async (transferId, accept, reason) => {
    await transferApi.respond(transferId, accept, reason)
    set(state => ({
      transfers: state.transfers.map(t =>
        t.id === transferId
          ? { ...t, status: accept ? 'accepted' : 'rejected', rejectReason: reason, respondedAt: dayjs().toISOString() }
          : t
      ),
    }))
    await get().fetchProjects()
  },

  addDifficulty: async (projectId, authorId, content, mentionedUserIds = []) => {
    const { difficulty } = await difficultyApi.create({ projectId, content, mentionedUserIds })
    set(state => ({ difficulties: [...state.difficulties, difficulty] }))
  },

  updateDifficultyStatus: async (difficultyId, status) => {
    await difficultyApi.updateStatus(difficultyId, status)
    set(state => ({
      difficulties: state.difficulties.map(d =>
        d.id === difficultyId ? { ...d, status, updatedAt: dayjs().toISOString() } : d
      ),
    }))
  },

  deleteDifficulty: async (difficultyId) => {
    await difficultyApi.delete(difficultyId)
    set(state => ({ difficulties: state.difficulties.filter(d => d.id !== difficultyId) }))
  },

  addNote: async (projectId, authorId, content) => {
    const { note } = await noteApi.create({ projectId, content })
    set(state => ({ notes: [...state.notes, note] }))
  },

  deleteNote: async (noteId) => {
    await noteApi.delete(noteId)
    set(state => ({ notes: state.notes.filter(n => n.id !== noteId) }))
  },

  addBenefitBatch: async (projectId, amount, note, createdBy) => {
    const { benefitBatch } = await benefitApi.create({ projectId, amount, note })
    set(state => ({
      benefitBatches: [...state.benefitBatches, benefitBatch],
      projects: state.projects.map(p =>
        p.id === projectId
          ? { ...p, producedBenefit: (p.producedBenefit || 0) + amount, updatedAt: dayjs().toISOString() }
          : p
      ),
    }))
  },

  submitAbolishRequest: async (projectId, requesterId, reason) => {
    const { abolishRequest } = await abolishApi.submit({ projectId, reason })
    set(state => ({ abolishRequests: [...state.abolishRequests, abolishRequest] }))
  },

  reviewAbolishRequest: async (requestId, approved, reviewerId, reviewNote) => {
    await abolishApi.review(requestId, approved, reviewNote)
    set(state => ({
      abolishRequests: state.abolishRequests.map(r =>
        r.id === requestId
          ? { ...r, status: approved ? 'approved' : 'rejected', reviewerId, reviewNote, reviewedAt: dayjs().toISOString() }
          : r
      ),
      projects: state.abolishRequests.find(r => r.id === requestId && approved)
        ? state.projects.map(p => {
            const req = state.abolishRequests.find(r => r.id === requestId)
            if (req && p.id === req.projectId && approved) {
              return { ...p, status: 'reserved' as const, updatedAt: dayjs().toISOString() }
            }
            return p
          })
        : state.projects,
    }))
  },

  updateStageConfig: async (stage, hours) => {
    await stageConfigApi.update(stage, hours)
    set(state => ({
      stageConfigs: state.stageConfigs.map(c =>
        c.stage === stage ? { ...c, standardDurationHours: hours } : c
      ),
    }))
  },

  getStageDuration: (stage) => {
    const config = get().stageConfigs.find(c => c.stage === stage)
    return config?.standardDurationHours || 72
  },

  getStageElapsedTime: (project) => {
    const entered = dayjs(project.stageEnteredAt)
    const now = dayjs()
    return now.diff(entered, 'hour')
  },

  isOverdue: (project) => {
    const elapsed = get().getStageElapsedTime(project)
    const standard = get().getStageDuration(project.stage)
    return elapsed > standard
  },

  isWarning: (project) => {
    const elapsed = get().getStageElapsedTime(project)
    const standard = get().getStageDuration(project.stage)
    return elapsed >= standard * 0.8 && elapsed <= standard
  },
}))
