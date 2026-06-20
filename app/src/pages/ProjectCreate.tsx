import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { useAuthStore } from '../store/authStore'
import { useUsers } from '../hooks/useUsers'
import { STAGE_LABELS, STAGE_ORDER } from '../types'
import type { ProjectStage, Priority } from '../types'

export default function ProjectCreate() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const createProject = useProjectStore(s => s.createProject)
  const { users } = useUsers()

  const [name, setName] = useState('')
  const [stage, setStage] = useState<ProjectStage>('initial_visit')
  const [ownerId, setOwnerId] = useState(currentUser?.id || '')
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('')
  const [description, setDescription] = useState('')
  const [relatedClient, setRelatedClient] = useState('')
  const [expectedBenefit, setExpectedBenefit] = useState('')
  const [initialNote, setInitialNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !ownerId || !expectedCompletionDate || !currentUser) return

    setSaving(true)
    try {
      const project = await createProject({
        name: name.trim(),
        stage,
        creatorId: currentUser.id,
        ownerIds: [ownerId],
        expectedCompletionDate,
        description: description.trim(),
        relatedClient: relatedClient.trim() || undefined,
        expectedBenefit: expectedBenefit ? parseFloat(expectedBenefit) : undefined,
        priority: 'medium',
      })

      if (initialNote.trim() && project.id) {
        await useProjectStore.getState().addNote(project.id, currentUser.id, initialNote.trim())
      }

      navigate('/team-kanban')
    } catch (err: any) {
      alert(err.message || '创建失败')
    } finally {
      setSaving(false)
    }
  }

  const members = users.filter(u => u.role !== 'super_admin')

  return (
    <div className="page-container">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 h-12 flex items-center">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 mr-3">← 返回</button>
        <h2 className="font-semibold text-gray-900">创建项目</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="card">
          <h3 className="section-title">必填信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="请输入项目名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初始环节 <span className="text-red-500">*</span>
              </label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value as ProjectStage)}
                className="select-field"
              >
                {STAGE_ORDER.filter(s => s !== 'maintenance').map(s => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目负责人 <span className="text-red-500">*</span>
              </label>
              <select
                value={ownerId}
                onChange={e => setOwnerId(e.target.value)}
                className="select-field"
                required
              >
                <option value="">请选择负责人</option>
                {members.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role === 'admin' ? '管理员' : '成员'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预计完成时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={e => setExpectedCompletionDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目简要描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="请输入项目描述..."
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">选填信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联客户/合作方</label>
              <input
                type="text"
                value={relatedClient}
                onChange={e => setRelatedClient(e.target.value)}
                className="input-field"
                placeholder="请输入关联客户或合作方"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目预计效益</label>
              <div className="relative">
                <input
                  type="number"
                  value={expectedBenefit}
                  onChange={e => setExpectedBenefit(e.target.value)}
                  className="input-field pr-8"
                  placeholder="请输入预计效益金额"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">元</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">初始备注</label>
              <textarea
                value={initialNote}
                onChange={e => setInitialNote(e.target.value)}
                className="input-field min-h-[80px]"
                placeholder="请输入备注..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">取消</button>
          <button
            type="submit"
            disabled={saving || !name.trim() || !ownerId || !expectedCompletionDate}
            className="btn-primary flex-1"
          >
            {saving ? '创建中...' : '创建项目'}
          </button>
        </div>
      </form>
    </div>
  )
}
