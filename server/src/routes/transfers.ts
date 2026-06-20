import { Router } from 'express'
import dayjs from 'dayjs'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * GET /api/transfers - 获取流转记录
 * 支持筛选: projectId, toUserId, status
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId, toUserId, status } = req.query

  let sql = 'SELECT * FROM transfers WHERE 1=1'
  const params: any[] = []

  if (projectId) {
    sql += ' AND project_id = ?'
    params.push(projectId)
  }
  if (toUserId) {
    sql += ' AND to_user_id = ?'
    params.push(toUserId)
  }
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  } else {
    sql += " AND status = 'pending'"
  }

  sql += ' ORDER BY created_at DESC'
  const transfers = db.prepare(sql).all(...params)
  res.json({ transfers })
})

/**
 * POST /api/transfers - 创建流转记录
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const {
    projectId, fromUserId, toUserId, fromStage, toStage,
    reason, customReason, note,
  } = req.body

  if (!projectId || !toUserId || !fromStage || !toStage) {
    return res.status(400).json({ error: '缺少必要参数' })
  }

  const id = `t_${Date.now()}`
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO transfers (id, project_id, from_user_id, to_user_id, from_stage, to_stage, reason, custom_reason, note, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(id, projectId, fromUserId || req.user!.userId, toUserId, fromStage, toStage, reason || 'other', customReason || null, note || null, now)

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id)
  res.status(201).json({ transfer })
})

/**
 * PUT /api/transfers/:id/respond - 响应流转（接受/拒绝）
 */
router.put('/:id/respond', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  const { accept, reason } = req.body

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id) as any
  if (!transfer) {
    return res.status(404).json({ error: '流转记录不存在' })
  }
  if (transfer.status !== 'pending') {
    return res.status(400).json({ error: '该流转已处理' })
  }

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE transfers SET status = ?, reject_reason = ?, responded_at = ? WHERE id = ?`
  ).run(accept ? 'accepted' : 'rejected', accept ? null : reason, now, id)

  // 如果接受，更新项目阶段和负责人
  if (accept) {
    const stageEnteredAt = transfer.to_stage !== transfer.from_stage ? now : undefined
    db.prepare('DELETE FROM project_owners WHERE project_id = ?').run(transfer.project_id)
    db.prepare('INSERT INTO project_owners (project_id, user_id) VALUES (?, ?)').run(transfer.project_id, transfer.to_user_id)

    if (stageEnteredAt) {
      db.prepare('UPDATE projects SET stage = ?, stage_entered_at = ?, updated_at = ? WHERE id = ?')
        .run(transfer.to_stage, stageEnteredAt, now, transfer.project_id)
    } else {
      db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
        .run(now, transfer.project_id)
    }
  }

  const updated = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id)
  res.json({ transfer: updated })
})

export default router
