import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { useAuthStore, isAdmin } from '../store/authStore'
import { STAGE_LABELS, MAINTENANCE_SUB_LABELS, TRANSFER_REASON_LABELS, STAGE_ORDER } from '../types'
import type { TransferReason, ProjectStage, DifficultyStatus } from '../types'
import { useUsers } from '../hooks/useUsers'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import PriorityBadge from '../components/ui/PriorityBadge'
import { cn, formatStageTime, getStageLabel, getStageProgress, formatDate, formatMoney, truncateText } from '../utils/helpers'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { users, getUserById } = useUsers()
  const {
    getProjectById, difficulties, notes, transfers, benefitBatches, abolishRequests,
    getStageElapsedTime, getStageDuration, isOverdue, isWarning,
    addNote, addDifficulty, updateDifficultyStatus, deleteDifficulty,
    createTransfer, submitAbolishRequest, addBenefitBatch, toggleFavorite, setPriority,
    fetchProjectDetail,
  } = useProjectStore()

  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showDifficultyModal, setShowDifficultyModal] = useState(false)
  const [showBenefitModal, setShowBenefitModal] = useState(false)
  const [showAbolishModal, setShowAbolishModal] = useState(false)
  const [activeSection, setActiveSection] = useState<'info' | 'benefit' | 'difficulty' | 'note' | 'transfer'>('info')

  const [noteContent, setNoteContent] = useState('')
  const [difficultyContent, setDifficultyContent] = useState('')
  const [abolishReason, setAbolishReason] = useState('')
  const [benefitAmount, setBenefitAmount] = useState('')
  const [benefitNote, setBenefitNote] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferReason, setTransferReason] = useState<TransferReason>('stage_advance')
  const [transferNote, setTransferNote] = useState('')
  const [transferToStage, setTransferToStage] = useState<ProjectStage>('collect_docs')

  useEffect(() => {
    if (id) {
      fetchProjectDetail(id)
    }
  }, [id, fetchProjectDetail])

  const project = getProjectById(id || '')

  if (!project) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-2">📋</span>
          <p className="text-gray-400">项目不存在</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">返回</button>
        </div>
      </div>
    )
  }

  const projectDifficulties = difficulties.filter(d => d.projectId === project.id)
  const projectNotes = notes.filter(n => n.projectId === project.id)
  const projectTransfers = transfers.filter(t => t.projectId === project.id)
  const projectBenefits = benefitBatches.filter(b => b.projectId === project.id)
  const projectAbolish = abolishRequests.filter(a => a.projectId === project.id)

  const owner = getUserById(project.ownerIds[0])
  const creator = getUserById(project.creatorId)
  const overdue = isOverdue(project)
  const warning = isWarning(project)
  const elapsed = getStageElapsedTime(project)
  const standard = getStageDuration(project.stage)
  const progress = getStageProgress(project.stage)
  const benefitRate = project.expectedBenefit ? Math.round(((project.producedBenefit || 0) / project.expectedBenefit) * 100) : 0

  const currentStageIdx = STAGE_ORDER.indexOf(project.stage)
  const nextStages = STAGE_ORDER.slice(currentStageIdx + 1, currentStageIdx + 2)
  const canAdvance = nextStages.length > 0

  const handleTransfer = () => {
    if (!transferTo || !currentUser) return
    createTransfer({
      projectId: project.id,
      fromUserId: currentUser.id,
      toUserId: transferTo,
      fromStage: project.stage,
      toStage: transferToStage,
      reason: transferReason,
      note: transferNote,
    })
    setShowTransferModal(false)
    setTransferTo('')
    setTransferNote('')
  }

  const handleAddNote = () => {
    if (!noteContent.trim() || !currentUser) return
    addNote(project.id, currentUser.id, noteContent)
    setNoteContent('')
    setShowNoteModal(false)
  }

  const handleAddDifficulty = () => {
    if (!difficultyContent.trim() || !currentUser) return
    addDifficulty(project.id, currentUser.id, difficultyContent)
    setDifficultyContent('')
    setShowDifficultyModal(false)
  }

  const handleSubmitAbolish = () => {
    if (!abolishReason.trim() || !currentUser) return
    submitAbolishRequest(project.id, currentUser.id, abolishReason)
    setAbolishReason('')
    setShowAbolishModal(false)
  }

  const handleAddBenefit = () => {
    if (!benefitAmount || !currentUser) return
    addBenefitBatch(project.id, parseFloat(benefitAmount), benefitNote, currentUser.id)
    setBenefitAmount('')
    setBenefitNote('')
    setShowBenefitModal(false)
  }

  const getUserName = (userId: string) => getUserById(userId)?.name || '未知'

  return (
    <div className="page-container">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">← 返回</button>
          <h2 className="font-semibold text-gray-900 flex-1 truncate">{project.name}</h2>
          <button onClick={() => toggleFavorite(project.id)} className="text-lg">
            {project.isFavorited ? '★' : '☆'}
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-4 overflow-x-auto">
          {[
            { key: 'info', label: '基础信息' },
            { key: 'benefit', label: '效益信息' },
            { key: 'difficulty', label: '问题与难点' },
            { key: 'note', label: '备注' },
            { key: 'transfer', label: '流转记录' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as any)}
              className={cn(
                'px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors',
                activeSection === tab.key ? 'border-primary-500 text-primary-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-32">
        {activeSection === 'info' && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{project.projectNo}</p>
                </div>
                <PriorityBadge priority={project.priority} />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">当前环节</span>
                  <span className={cn('font-medium', overdue ? 'text-red-600' : 'text-primary-600')}>
                    {getStageLabel(project.stage, project.maintenanceSubStage)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', overdue ? 'bg-red-500' : 'bg-primary-500')}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                  <span>进度 {progress}%</span>
                  <span>初访 → 放款</span>
                </div>
              </div>

              <div className={cn('p-3 rounded-lg mb-3', overdue ? 'bg-red-50' : warning ? 'bg-yellow-50' : 'bg-gray-50')}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">环节停留时间</span>
                  <span className={cn('text-sm font-medium', overdue ? 'text-red-600' : warning ? 'text-yellow-600' : 'text-gray-900')}>
                    {formatStageTime(project.stageEnteredAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">标准时效</span>
                  <span className="text-xs text-gray-400">{standard}小时</span>
                </div>
                {overdue && <div className="text-xs text-red-500 mt-1">⚠️ 已超时</div>}
              </div>
            </div>

            <div className="card">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">项目信息</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">创建人</span>
                  <div className="flex items-center gap-1.5">
                    {creator && <Avatar name={creator.name} size="sm" />}
                    <span>{creator?.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">创建时间</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">项目负责人</span>
                  <div className="flex items-center gap-1.5">
                    {owner && <Avatar name={owner.name} size="sm" />}
                    <span>{owner?.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">预计完成</span>
                  <span>{project.expectedCompletionDate}</span>
                </div>
                {project.relatedClient && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">关联客户</span>
                    <span>{project.relatedClient}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">项目描述</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
            </div>
          </div>
        )}

        {activeSection === 'benefit' && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">效益概览</h4>
                <button onClick={() => setShowBenefitModal(true)} className="btn-primary btn-sm text-xs">添加效益</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-primary-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">预计效益</div>
                  <div className="text-sm font-bold text-primary-600">{formatMoney(project.expectedBenefit || 0)}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">已产生</div>
                  <div className="text-sm font-bold text-green-600">{formatMoney(project.producedBenefit || 0)}</div>
                </div>
                <div className="bg-accent-500/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">完成率</div>
                  <div className="text-sm font-bold text-accent-500">{benefitRate}%</div>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', benefitRate >= 80 ? 'bg-green-500' : benefitRate >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                  style={{ width: `${Math.min(100, benefitRate)}%` }}
                />
              </div>
            </div>

            <div className="card">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">效益记录</h4>
              <div className="space-y-2">
                {projectBenefits.map(batch => (
                  <div key={batch.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-green-600">+{formatMoney(batch.amount)}</div>
                      <div className="text-xs text-gray-400">{batch.note} · {formatDate(batch.createdAt)}</div>
                    </div>
                    <span className="text-xs text-gray-400">{getUserName(batch.createdBy)}</span>
                  </div>
                ))}
                {projectBenefits.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">暂无效益记录</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'difficulty' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">难点列表</h4>
              <button onClick={() => setShowDifficultyModal(true)} className="btn-primary btn-sm text-xs">添加难点</button>
            </div>
            <div className="space-y-2">
              {projectDifficulties.map(diff => (
                <div key={diff.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-700 flex-1">{diff.content}</p>
                    <select
                      value={diff.status}
                      onChange={e => updateDifficultyStatus(diff.id, e.target.value as DifficultyStatus)}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border-0 font-medium',
                        diff.status === 'pending' ? 'bg-red-100 text-red-700' :
                        diff.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}
                    >
                      <option value="pending">待解决</option>
                      <option value="processing">解决中</option>
                      <option value="resolved">已解决</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{getUserName(diff.authorId)} · {formatDate(diff.createdAt)}</span>
                    {(diff.authorId === currentUser?.id || isAdmin(currentUser)) && (
                      <button onClick={() => deleteDifficulty(diff.id)} className="text-red-400 hover:text-red-600">删除</button>
                    )}
                  </div>
                </div>
              ))}
              {projectDifficulties.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">暂无难点记录</div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'note' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">项目备注</h4>
              <button onClick={() => setShowNoteModal(true)} className="btn-primary btn-sm text-xs">添加备注</button>
            </div>
            <div className="space-y-2">
              {projectNotes.map(note => (
                <div key={note.id} className="card">
                  <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{getUserName(note.authorId)} · {formatDate(note.createdAt)}</span>
                    {(note.authorId === currentUser?.id || isAdmin(currentUser)) && (
                      <button onClick={() => useProjectStore.getState().deleteNote(note.id)} className="text-red-400 hover:text-red-600">删除</button>
                    )}
                  </div>
                </div>
              ))}
              {projectNotes.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">暂无备注</div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'transfer' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">流转记录</h4>
            <div className="space-y-2">
              {projectTransfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(transfer => (
                <div key={transfer.id} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={getUserName(transfer.fromUserId)} size="sm" />
                    <span className="text-sm font-medium">{getUserName(transfer.fromUserId)}</span>
                    <span className="text-gray-400">→</span>
                    <Avatar name={getUserName(transfer.toUserId)} size="sm" />
                    <span className="text-sm font-medium">{getUserName(transfer.toUserId)}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {STAGE_LABELS[transfer.fromStage]} → {STAGE_LABELS[transfer.toStage]}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    原因：{TRANSFER_REASON_LABELS[transfer.reason]}
                    {transfer.note && ` | 备注：${transfer.note}`}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(transfer.createdAt)}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      transfer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      transfer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {transfer.status === 'accepted' ? '已接收' : transfer.status === 'rejected' ? '已拒绝' : '待接收'}
                    </span>
                  </div>
                </div>
              ))}
              {projectTransfers.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">暂无流转记录</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-56 bg-white border-t border-gray-200 p-3 z-20">
        <div className="flex gap-2 overflow-x-auto max-w-4xl mx-auto">
          <button onClick={() => setShowTransferModal(true)} className="btn-primary btn-sm whitespace-nowrap">发起流转</button>
          <button onClick={() => setShowNoteModal(true)} className="btn-secondary btn-sm whitespace-nowrap">添加备注</button>
          <button onClick={() => setShowDifficultyModal(true)} className="btn-secondary btn-sm whitespace-nowrap">标记难点</button>
          {project.stage === 'maintenance' && (
            <>
              <button onClick={() => setShowBenefitModal(true)} className="btn-secondary btn-sm whitespace-nowrap">修改效益</button>
              <button className="btn-secondary btn-sm whitespace-nowrap">设置提醒</button>
            </>
          )}
          <button onClick={() => setShowAbolishModal(true)} className="btn-danger btn-sm whitespace-nowrap">提交废止</button>
        </div>
      </div>

      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="发起流转">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">流转目标环节</label>
            <select
              value={transferToStage}
              onChange={e => setTransferToStage(e.target.value as ProjectStage)}
              className="select-field"
            >
              {canAdvance && nextStages.map(s => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
              <option value={project.stage}>同环节流转（更换负责人）</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">接收人</label>
            <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="select-field">
              <option value="">请选择接收人</option>
              {users.filter(u => u.role !== 'super_admin' && u.id !== currentUser?.id).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">流转原因</label>
            <select value={transferReason} onChange={e => setTransferReason(e.target.value as TransferReason)} className="select-field">
              {Object.entries(TRANSFER_REASON_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">流转备注</label>
            <textarea
              value={transferNote}
              onChange={e => setTransferNote(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="请输入流转备注..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowTransferModal(false)} className="btn-secondary">取消</button>
            <button onClick={handleTransfer} disabled={!transferTo} className="btn-primary">确认流转</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="添加备注" size="sm">
        <div className="space-y-4">
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            className="input-field min-h-[120px]"
            placeholder="请输入备注内容..."
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowNoteModal(false)} className="btn-secondary">取消</button>
            <button onClick={handleAddNote} disabled={!noteContent.trim()} className="btn-primary">添加</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDifficultyModal} onClose={() => setShowDifficultyModal(false)} title="标记难点" size="sm">
        <div className="space-y-4">
          <textarea
            value={difficultyContent}
            onChange={e => setDifficultyContent(e.target.value)}
            className="input-field min-h-[120px]"
            placeholder="请描述难点问题..."
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDifficultyModal(false)} className="btn-secondary">取消</button>
            <button onClick={handleAddDifficulty} disabled={!difficultyContent.trim()} className="btn-primary">添加</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBenefitModal} onClose={() => setShowBenefitModal(false)} title="添加效益" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">效益金额</label>
            <input
              type="number"
              value={benefitAmount}
              onChange={e => setBenefitAmount(e.target.value)}
              className="input-field"
              placeholder="请输入金额"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <input
              type="text"
              value={benefitNote}
              onChange={e => setBenefitNote(e.target.value)}
              className="input-field"
              placeholder="效益说明"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowBenefitModal(false)} className="btn-secondary">取消</button>
            <button onClick={handleAddBenefit} disabled={!benefitAmount} className="btn-primary">添加</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAbolishModal} onClose={() => setShowAbolishModal(false)} title="提交废止审批" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">提交后项目将被冻结，等待管理人员审批</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">废止原因</label>
            <textarea
              value={abolishReason}
              onChange={e => setAbolishReason(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="请输入废止原因..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAbolishModal(false)} className="btn-secondary">取消</button>
            <button onClick={handleSubmitAbolish} disabled={!abolishReason.trim()} className="btn-danger">提交废止</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
