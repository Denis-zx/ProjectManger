import { Router } from 'express'
import dayjs from 'dayjs'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * 辅助函数：查询项目详情（含 ownerIds）
 */
function getProjectWithOwners(projectRow: any) {
  if (!projectRow) return null
  const owners = db.prepare(
    'SELECT user_id FROM project_owners WHERE project_id = ?'
  ).all(projectRow.id) as { user_id: string }[]

  return {
    ...projectRow,
    ownerIds: owners.map(o => o.user_id),
    isFavorited: !!projectRow.isFavorited,
    expectedBenefit: projectRow.expected_benefit ?? 0,
    producedBenefit: projectRow.produced_benefit ?? 0,
    benefitNote: projectRow.benefit_note,
    maintenanceSubStage: projectRow.maintenance_sub_stage,
    expectedCompletionDate: projectRow.expected_completion_date,
    relatedClient: projectRow.related_client,
    isFavorited: !!projectRow.is_favorited,
    createdAt: projectRow.created_at,
    updatedAt: projectRow.updated_at,
    stageEnteredAt: projectRow.stage_entered_at,
    nextReminderAt: projectRow.next_reminder_at,
    reminderCycle: projectRow.reminder_cycle,
  }
}

function mapProject(row: any) {
  return getProjectWithOwners(row)
}

/**
 * GET /api/projects - 获取项目列表
 * 支持筛选: stage, status, owner, search
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { stage, status, owner, search, maintenance } = req.query

  let sql = 'SELECT * FROM projects WHERE 1=1'
  const params: any[] = []

  if (stage) {
    sql += ' AND stage = ?'
    params.push(stage)
  }
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  } else {
    sql += " AND status = 'active'"
  }
  if (owner) {
    sql += ' AND id IN (SELECT project_id FROM project_owners WHERE user_id = ?)'
    params.push(owner)
  }
  if (search) {
    sql += ' AND (name LIKE ? OR project_no LIKE ? OR description LIKE ?)'
    const kw = `%${search}%`
    params.push(kw, kw, kw)
  }
  if (maintenance === 'true') {
    sql += " AND stage = 'maintenance'"
  }

  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params) as any[]
  const projects = rows.map(mapProject).filter(Boolean)

  res.json({ projects })
})

/**
 * GET /api/projects/maintenance - 获取维护阶段项目
 */
router.get('/maintenance', authMiddleware, (_req: Request, res: Response) => {
  const rows = db.prepare(
    "SELECT * FROM projects WHERE stage = 'maintenance' AND status = 'active' ORDER BY created_at DESC"
  ).all() as any[]
  res.json({ projects: rows.map(mapProject) })
})

/**
 * GET /api/projects/reserved - 获取储备项目
 */
router.get('/reserved', authMiddleware, (_req: Request, res: Response) => {
  const rows = db.prepare(
    "SELECT * FROM projects WHERE status = 'reserved' ORDER BY created_at DESC"
  ).all() as any[]
  res.json({ projects: rows.map(mapProject) })
})

/**
 * GET /api/projects/:id - 获取项目详情
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any
  if (!row) {
    return res.status(404).json({ error: '项目不存在' })
  }

  const project = mapProject(row)

  // 同时返回关联数据
  const transfers = db.prepare('SELECT * FROM transfers WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id)
  const difficulties = db.prepare('SELECT * FROM difficulties WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id) as any[]
  const notes = db.prepare('SELECT * FROM notes WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id)
  const benefitBatches = db.prepare('SELECT * FROM benefit_batches WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id)

  // 获取困难提及的用户
  const difficultiesWithMentions = difficulties.map(d => {
    const mentions = db.prepare(
      'SELECT user_id FROM difficulty_mentions WHERE difficulty_id = ?'
    ).all(d.id) as { user_id: string }[]
    return {
      ...d,
      mentionedUserIds: mentions.map(m => m.user_id),
    }
  })

  res.json({
    project,
    transfers,
    difficulties: difficultiesWithMentions,
    notes,
    benefitBatches,
  })
})

/**
 * POST /api/projects - 创建项目
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const {
    name, description, stage, ownerIds, expectedCompletionDate,
    relatedClient, expectedBenefit, priority, reminderCycle,
  } = req.body

  if (!name || !stage) {
    return res.status(400).json({ error: '项目名称和阶段不能为空' })
  }

  const id = `p_${Date.now()}`
  const projectNo = `PRJ-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`
  const now = new Date().toISOString()
  const owners = ownerIds && ownerIds.length > 0 ? ownerIds : [req.user!.userId]

  db.prepare(
    `INSERT INTO projects (
      id, project_no, name, description, stage, status, creator_id,
      expected_completion_date, related_client, expected_benefit, produced_benefit,
      is_favorited, priority, reminder_cycle,
      created_at, updated_at, stage_entered_at
    ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)`
  ).run(
    id, projectNo, name, description || '', stage,
    req.user!.userId,
    expectedCompletionDate || null,
    relatedClient || null,
    expectedBenefit || 0,
    priority || 'medium',
    reminderCycle || null,
    now, now, now
  )

  // 插入 owner 关联
  const insertOwner = db.prepare('INSERT INTO project_owners (project_id, user_id) VALUES (?, ?)')
  for (const ownerId of owners) {
    insertOwner.run(id, ownerId)
  }

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
  res.status(201).json({ project: mapProject(row) })
})

/**
 * PUT /api/projects/:id - 更新项目
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
  if (!row) {
    return res.status(404).json({ error: '项目不存在' })
  }

  const {
    name, description, stage, maintenanceSubStage, status,
    expectedCompletionDate, relatedClient, expectedBenefit,
    producedBenefit, benefitNote, priority, reminderCycle,
    nextReminderAt, ownerIds,
  } = req.body

  const now = new Date().toISOString()
  const stageEnteredAt = stage && stage !== row.stage ? now : row.stage_entered_at

  db.prepare(
    `UPDATE projects SET
      name = ?, description = ?, stage = ?, maintenance_sub_stage = ?,
      status = ?, expected_completion_date = ?, related_client = ?,
      expected_benefit = ?, produced_benefit = ?, benefit_note = ?,
      priority = ?, reminder_cycle = ?, next_reminder_at = ?,
      updated_at = ?, stage_entered_at = ?
    WHERE id = ?`
  ).run(
    name ?? row.name,
    description ?? row.description,
    stage ?? row.stage,
    maintenanceSubStage ?? row.maintenance_sub_stage,
    status ?? row.status,
    expectedCompletionDate ?? row.expected_completion_date,
    relatedClient ?? row.related_client,
    expectedBenefit ?? row.expected_benefit,
    producedBenefit ?? row.produced_benefit,
    benefitNote ?? row.benefit_note,
    priority ?? row.priority,
    reminderCycle ?? row.reminder_cycle,
    nextReminderAt ?? row.next_reminder_at,
    now, stageEnteredAt, id
  )

  // 更新 ownerIds
  if (ownerIds && Array.isArray(ownerIds)) {
    db.prepare('DELETE FROM project_owners WHERE project_id = ?').run(id)
    const insertOwner = db.prepare('INSERT INTO project_owners (project_id, user_id) VALUES (?, ?)')
    for (const ownerId of ownerIds) {
      insertOwner.run(id, ownerId)
    }
  }

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
  res.json({ project: mapProject(updated) })
})

/**
 * PATCH /api/projects/:id/favorite - 切换收藏状态
 */
router.patch('/:id/favorite', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  const row = db.prepare('SELECT is_favorited FROM projects WHERE id = ?').get(id) as any
  if (!row) {
    return res.status(404).json({ error: '项目不存在' })
  }
  db.prepare('UPDATE projects SET is_favorited = ?, updated_at = ? WHERE id = ?')
    .run(row.is_favorited ? 0 : 1, new Date().toISOString(), id)
  res.json({ isFavorited: !row.is_favorited })
})

/**
 * PATCH /api/projects/:id/priority - 设置优先级
 */
router.patch('/:id/priority', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  const { priority } = req.body
  if (!['high', 'medium', 'low'].includes(priority)) {
    return res.status(400).json({ error: '无效的优先级' })
  }
  db.prepare('UPDATE projects SET priority = ?, updated_at = ? WHERE id = ?')
    .run(priority, new Date().toISOString(), id)
  res.json({ priority })
})

export default router
