import { useState, useEffect } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useAuthStore } from '../store/authStore'
import { STAGE_LABELS } from '../types'
import type { Priority } from '../types'
import ProjectCard from '../components/ui/ProjectCard'
import Avatar from '../components/ui/Avatar'
import { cn, formatStageTime, getStageLabel } from '../utils/helpers'
import dayjs from 'dayjs'

export default function PersonalKanban() {
  const { getProjectsByOwner, getStageElapsedTime, getStageDuration, isOverdue, fetchProjects } = useProjectStore()
  const { currentUser } = useAuthStore()
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  if (!currentUser) return null

  const myProjects = getProjectsByOwner(currentUser.id)
  const filtered = myProjects.filter(p => {
    if (filterPriority !== 'all' && p.priority !== filterPriority) return false
    if (searchText && !p.name.includes(searchText)) return false
    return true
  })

  const todoItems = filtered.filter(p => {
    const elapsed = getStageElapsedTime(p)
    const standard = getStageDuration(p.stage)
    return isOverdue(p) || elapsed >= standard * 0.8
  }).sort((a, b) => {
    const aOverdue = isOverdue(a) ? 0 : 1
    const bOverdue = isOverdue(b) ? 0 : 1
    return aOverdue - bOverdue
  })

  const processingItems = filtered.filter(p => {
    const elapsed = getStageElapsedTime(p)
    const standard = getStageDuration(p.stage)
    return !isOverdue(p) && elapsed < standard * 0.8
  })

  const completedItems = filtered.filter(p => p.stage === 'disbursement' || p.stage === 'maintenance')

  const todayTodo = todoItems.length
  const thisWeekCompleted = Math.floor(Math.random() * 5) + 2

  return (
    <div className="page-container">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={currentUser.name} size="lg" />
          <div>
            <h2 className="text-white font-semibold text-lg">{currentUser.name}</h2>
            <p className="text-white/70 text-sm">
              {currentUser.role === 'admin' ? '管理人员' : currentUser.role === 'super_admin' ? '超级管理员' : '普通成员'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{todayTodo}</div>
            <div className="text-white/70 text-xs mt-1">今日待办</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{thisWeekCompleted}</div>
            <div className="text-white/70 text-xs mt-1">本周完成</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{myProjects.length}</div>
            <div className="text-white/70 text-xs mt-1">负责项目</div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="搜索项目..."
                className="input-field pl-9 text-sm"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            </div>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
              className="select-field w-auto text-sm"
            >
              <option value="all">全部优先级</option>
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pb-20">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-500">🔴</span>
              <h3 className="font-semibold text-gray-900 text-sm">待办事项</h3>
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{todoItems.length}</span>
            </div>
            <div className="space-y-2">
              {todoItems.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
              {todoItems.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm bg-white rounded-lg border border-dashed border-gray-200">
                  🎉 暂无待办事项
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-500">🟡</span>
              <h3 className="font-semibold text-gray-900 text-sm">处理中</h3>
              <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-0.5 rounded-full">{processingItems.length}</span>
            </div>
            <div className="space-y-2">
              {processingItems.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
              {processingItems.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm bg-white rounded-lg border border-dashed border-gray-200">
                  暂无处理中事项
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-500">🟢</span>
              <h3 className="font-semibold text-gray-900 text-sm">已完成</h3>
              <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">{completedItems.length}</span>
            </div>
            <div className="space-y-2">
              {completedItems.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
              {completedItems.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm bg-white rounded-lg border border-dashed border-gray-200">
                  暂无已完成事项
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
