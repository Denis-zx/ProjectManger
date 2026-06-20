import { useState, useEffect } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useAuthStore, isAdmin } from '../store/authStore'
import { useUsers } from '../hooks/useUsers'
import { STAGE_LABELS, STAGE_ORDER } from '../types'
import { cn, formatMoney } from '../utils/helpers'
import Avatar from '../components/ui/Avatar'

export default function ManagementDashboard() {
  const { projects, stageConfigs, abolishRequests, fetchProjects, fetchStageConfigs, fetchAbolishRequests } = useProjectStore()
  const { currentUser } = useAuthStore()
  const { users, getUserById } = useUsers()
  const [activeTab, setActiveTab] = useState<'efficiency' | 'benefit' | 'warning' | 'config'>('efficiency')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'custom'>('30d')

  useEffect(() => {
    fetchProjects()
    fetchStageConfigs()
    fetchAbolishRequests()
  }, [fetchProjects, fetchStageConfigs, fetchAbolishRequests])

  if (!currentUser || !isAdmin(currentUser)) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center text-gray-400">
          <span className="text-4xl block mb-2">🔒</span>
          <p>仅管理人员可访问此页面</p>
        </div>
      </div>
    )
  }

  const activeProjects = projects.filter(p => p.status === 'active')
  const totalExpectedBenefit = activeProjects.reduce((sum, p) => sum + (p.expectedBenefit || 0), 0)
  const totalProducedBenefit = activeProjects.reduce((sum, p) => sum + (p.producedBenefit || 0), 0)
  const benefitRate = totalExpectedBenefit > 0 ? Math.round((totalProducedBenefit / totalExpectedBenefit) * 100) : 0
  const pendingAbolish = abolishRequests.filter(r => r.status === 'pending').length

  const memberStats = users
    .filter(u => u.role !== 'super_admin' && u.status === 'active')
    .map(user => {
      const userProjects = activeProjects.filter(p => p.ownerIds.includes(user.id))
      const userBenefit = userProjects.reduce((sum, p) => sum + (p.producedBenefit || 0), 0)
      return { ...user, projectCount: userProjects.length, totalBenefit: userBenefit }
    })
    .sort((a, b) => b.totalBenefit - a.totalBenefit)

  const stageStats = STAGE_ORDER.map(stage => ({
    stage,
    label: STAGE_LABELS[stage],
    count: activeProjects.filter(p => p.stage === stage).length,
    benefit: activeProjects.filter(p => p.stage === stage).reduce((sum, p) => sum + (p.producedBenefit || 0), 0),
  }))

  const maxBenefit = Math.max(...stageStats.map(s => s.benefit), 1)

  return (
    <div className="page-container">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">管理看板</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">活跃项目</div>
            <div className="text-2xl font-bold text-gray-900">{activeProjects.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">预计效益</div>
            <div className="text-2xl font-bold text-primary-600">{formatMoney(totalExpectedBenefit)}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">已产生效益</div>
            <div className="text-2xl font-bold text-green-600">{formatMoney(totalProducedBenefit)}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">效益完成率</div>
            <div className="text-2xl font-bold text-accent-500">{benefitRate}%</div>
          </div>
        </div>

        {pendingAbolish > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-800">待审批废止申请</div>
              <div className="text-xs text-yellow-600">有 {pendingAbolish} 条废止申请待处理</div>
            </div>
            <button className="btn-primary btn-sm">去审批</button>
          </div>
        )}

        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'efficiency', label: '效率统计' },
            { key: 'benefit', label: '效益统计' },
            { key: 'warning', label: '异常预警' },
            { key: 'config', label: '管理配置' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex-1 py-2 text-sm rounded-md transition-colors',
                activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'efficiency' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title">人员效率排名</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">成员</th>
                      <th className="text-center py-2 text-gray-500 font-medium">负责项目</th>
                      <th className="text-center py-2 text-gray-500 font-medium">已产生效益</th>
                      <th className="text-center py-2 text-gray-500 font-medium">效率评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberStats.map((member, idx) => (
                      <tr key={member.id} className="border-b border-gray-50">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white',
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-300'
                            )}>
                              {idx + 1}
                            </span>
                            <Avatar name={member.name} size="sm" />
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-2">{member.projectCount}</td>
                        <td className="text-center py-2 text-green-600 font-medium">{formatMoney(member.totalBenefit)}</td>
                        <td className="text-center py-2">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            member.projectCount > 3 ? 'bg-green-100 text-green-700' : member.projectCount > 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {Math.min(100, Math.round((member.totalBenefit / (totalProducedBenefit || 1)) * 100 * member.projectCount))}分
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">环节项目分布</h3>
              <div className="space-y-3">
                {stageStats.map(stat => (
                  <div key={stat.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{stat.label}</span>
                      <span className="text-sm font-medium text-gray-900">{stat.count} 个项目</span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(5, (stat.count / Math.max(...stageStats.map(s => s.count), 1)) * 100)}%` }}
                      >
                        {stat.count > 0 && <span className="text-xs text-white font-medium">{stat.count}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benefit' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title">环节效益贡献</h3>
              <div className="space-y-3">
                {stageStats.map(stat => (
                  <div key={stat.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{stat.label}</span>
                      <span className="text-sm font-medium text-green-600">{formatMoney(stat.benefit)}</span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(5, (stat.benefit / maxBenefit) * 100)}%` }}
                      >
                        {stat.benefit > 0 && <span className="text-xs text-white font-medium">{Math.round((stat.benefit / totalProducedBenefit) * 100)}%</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">项目效益明细</h3>
              <div className="space-y-2">
                {activeProjects.slice(0, 8).map(project => {
                  const rate = project.expectedBenefit ? Math.round(((project.producedBenefit || 0) / project.expectedBenefit) * 100) : 0
                  return (
                    <div key={project.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{project.name}</div>
                        <div className="text-xs text-gray-400">{STAGE_LABELS[project.stage]}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">{formatMoney(project.producedBenefit || 0)}</div>
                        <div className={cn('text-xs', rate >= 50 ? 'text-green-500' : 'text-red-500')}>
                          完成率 {rate}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'warning' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title">超时预警项目</h3>
              <div className="space-y-2">
                {activeProjects.filter(p => {
                  const { getStageElapsedTime, getStageDuration } = useProjectStore.getState()
                  return getStageElapsedTime(p) > getStageDuration(p.stage)
                }).map(project => (
                  <div key={project.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-red-500">⚠️</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-red-600">
                        {STAGE_LABELS[project.stage]} 已超时
                      </div>
                    </div>
                  </div>
                ))}
                {activeProjects.filter(p => {
                  const { getStageElapsedTime, getStageDuration } = useProjectStore.getState()
                  return getStageElapsedTime(p) > getStageDuration(p.stage)
                }).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">暂无超时预警 ✅</div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">效益未达预期项目</h3>
              <div className="space-y-2">
                {activeProjects.filter(p => p.expectedBenefit && p.producedBenefit !== undefined && p.producedBenefit < p.expectedBenefit * 0.5).map(project => (
                  <div key={project.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <span className="text-yellow-500">📉</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-yellow-700">
                        完成率 {Math.round(((project.producedBenefit || 0) / (project.expectedBenefit || 1)) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title">环节时效配置</h3>
              <div className="space-y-3">
                {stageConfigs.map(config => (
                  <div key={config.stage} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{STAGE_LABELS[config.stage]}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={config.standardDurationHours}
                        className="input-field w-20 text-center text-sm"
                        onChange={e => {
                          const val = parseInt(e.target.value)
                          if (val > 0) {
                            useProjectStore.setState(state => ({
                              stageConfigs: state.stageConfigs.map(c =>
                                c.stage === config.stage ? { ...c, standardDurationHours: val } : c
                              ),
                            }))
                          }
                        }}
                      />
                      <span className="text-xs text-gray-400">小时</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">待审批事项</h3>
              <div className="space-y-2">
                {abolishRequests.filter(r => r.status === 'pending').map(req => {
                  const project = projects.find(p => p.id === req.projectId)
                  const requester = getUserById(req.requesterId)
                  return (
                    <div key={req.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{project?.name || '未知项目'}</span>
                        <span className="badge-warning">待审批</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        申请人：{requester?.name} | 原因：{req.reason}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => useProjectStore.getState().reviewAbolishRequest(req.id, true, currentUser.id, '同意废止')}
                          className="btn-danger btn-sm text-xs"
                        >
                          同意废止
                        </button>
                        <button
                          onClick={() => useProjectStore.getState().reviewAbolishRequest(req.id, false, currentUser.id, '拒绝')}
                          className="btn-secondary btn-sm text-xs"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  )
                })}
                {abolishRequests.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">暂无待审批事项</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
