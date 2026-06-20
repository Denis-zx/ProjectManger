import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { useAuthStore, isAdmin } from '../store/authStore'
import { STAGE_LABELS } from '../types'
import { useUsers } from '../hooks/useUsers'
import { cn, formatDate, formatMoney, truncateText } from '../utils/helpers'
import Avatar from '../components/ui/Avatar'

export default function ReserveProjects() {
  const { getReservedProjects, abolishRequests, fetchProjects, fetchAbolishRequests } = useProjectStore()
  const { currentUser } = useAuthStore()
  const { getUserById } = useUsers()
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchProjects()
    fetchAbolishRequests()
  }, [fetchProjects, fetchAbolishRequests])

  const reservedProjects = getReservedProjects().filter(p =>
    !searchText || p.name.includes(searchText) || p.projectNo.includes(searchText)
  )

  const getAbolishInfo = (projectId: string) => {
    const req = abolishRequests.find(r => r.projectId === projectId && r.status === 'approved')
    return req
  }

  return (
    <div className="page-container">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 h-12 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">← 返回</button>
        <h2 className="font-semibold text-gray-900">储备项目库</h2>
      </div>

      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="text-yellow-500 text-lg">⏰</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-yellow-800">定期更新提醒</div>
            <div className="text-xs text-yellow-600">储备项目库已超过3个月未更新，请及时核对项目信息</div>
          </div>
          <button className="btn-primary btn-sm text-xs">开始更新</button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索储备项目..."
              className="input-field pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          </div>
        </div>

        <div className="space-y-3">
          {reservedProjects.map(project => {
            const abolishInfo = getAbolishInfo(project.id)
            const requester = abolishInfo ? getUserById(abolishInfo.requesterId) : null
            const reviewer = abolishInfo ? getUserById(abolishInfo.reviewerId) : null

            return (
              <div key={project.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">{project.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{project.projectNo}</p>
                  </div>
                  <span className="badge-danger">已废止</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">原环节：{STAGE_LABELS[project.stage]}</span>
                  {abolishInfo && (
                    <span className="text-xs text-gray-400">废止于 {formatDate(abolishInfo.reviewedAt || abolishInfo.createdAt, 'MM-DD')}</span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3">{truncateText(project.description, 80)}</p>

                {abolishInfo && (
                  <div className="text-xs text-gray-400 mb-3">
                    废止申请人：{requester?.name} | 审批人：{reviewer?.name}
                    {abolishInfo.reviewNote && ` | ${abolishInfo.reviewNote}`}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {project.expectedBenefit && (
                      <span className="text-xs text-gray-500">预计效益 {formatMoney(project.expectedBenefit)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="btn-secondary btn-sm text-xs"
                    >
                      编辑
                    </button>
                    {isAdmin(currentUser) ? (
                      <button className="btn-danger btn-sm text-xs">删除</button>
                    ) : (
                      <button className="btn-secondary btn-sm text-xs text-red-500">申请删除</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {reservedProjects.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-2">📦</span>
              <p>储备项目库为空</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
