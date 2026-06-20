import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { useAuthStore, isAdmin } from '../store/authStore'
import { STAGE_LABELS, MAINTENANCE_SUB_LABELS, STAGE_ORDER } from '../types'
import type { ProjectStage } from '../types'
import ProjectCard from '../components/ui/ProjectCard'
import { cn } from '../utils/helpers'

export default function TeamKanban() {
  const { getProjectsByStage, getMaintenanceProjects, fetchProjects, fetchStageConfigs, loading } = useProjectStore()
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProjects()
    fetchStageConfigs()
  }, [fetchProjects, fetchStageConfigs])

  const toggleCollapse = (stage: string) => {
    setCollapsedStages(prev => {
      const next = new Set(prev)
      if (next.has(stage)) next.delete(stage)
      else next.add(stage)
      return next
    })
  }

  const stageProjects: Record<string, ReturnType<typeof getProjectsByStage>> = {}
  STAGE_ORDER.forEach(stage => {
    if (stage === 'maintenance') return
    stageProjects[stage] = getProjectsByStage(stage).filter(p =>
      !searchText || p.name.includes(searchText) || p.projectNo.includes(searchText)
    )
  })

  const maintenanceProjects = getMaintenanceProjects().filter(p =>
    !searchText || p.name.includes(searchText) || p.projectNo.includes(searchText)
  )
  const pendingCallback = maintenanceProjects.filter(p => p.maintenanceSubStage === 'pending_callback')
  const potentialMining = maintenanceProjects.filter(p => p.maintenanceSubStage === 'potential_mining')

  return (
    <div className="page-container">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索项目名称或编号..."
              className="input-field pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          </div>
          <button
            onClick={() => navigate('/reserve-projects')}
            className="btn-secondary btn-sm whitespace-nowrap"
          >
            📦 储备库
          </button>
          {isAdmin(currentUser) && (
            <button
              onClick={() => navigate('/management-dashboard')}
              className="btn-primary btn-sm whitespace-nowrap"
            >
              📊 管理看板
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-120px)]">
        {STAGE_ORDER.filter(s => s !== 'maintenance').map(stage => (
          <div key={stage} className="flex-shrink-0 w-72">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => toggleCollapse(stage)}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">{STAGE_LABELS[stage]}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {stageProjects[stage]?.length || 0}
                </span>
              </div>
              <span className={cn('text-gray-400 text-xs transition-transform', collapsedStages.has(stage) && 'rotate-180')}>
                ▼
              </span>
            </div>

            {!collapsedStages.has(stage) && (
              <div className="space-y-2">
                {stageProjects[stage]?.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                {(!stageProjects[stage] || stageProjects[stage].length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm">暂无项目</div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex-shrink-0 w-80">
          <div
            className="flex items-center justify-between mb-3 cursor-pointer"
            onClick={() => toggleCollapse('maintenance')}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{STAGE_LABELS.maintenance}</h3>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {maintenanceProjects.length}
              </span>
            </div>
            <span className={cn('text-gray-400 text-xs transition-transform', collapsedStages.has('maintenance') && 'rotate-180')}>
              ▼
            </span>
          </div>

          {!collapsedStages.has('maintenance') && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">📞</span>
                  <span className="text-xs font-medium text-gray-600">{MAINTENANCE_SUB_LABELS.pending_callback}</span>
                  <span className="text-xs text-gray-400">({pendingCallback.length})</span>
                </div>
                <div className="space-y-2">
                  {pendingCallback.map(project => (
                    <ProjectCard key={project.id} project={project} compact />
                  ))}
                  {pendingCallback.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs">暂无</div>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">📈</span>
                  <span className="text-xs font-medium text-gray-600">{MAINTENANCE_SUB_LABELS.potential_mining}</span>
                  <span className="text-xs text-gray-400">({potentialMining.length})</span>
                </div>
                <div className="space-y-2">
                  {potentialMining.map(project => (
                    <ProjectCard key={project.id} project={project} compact />
                  ))}
                  {potentialMining.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs">暂无</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
