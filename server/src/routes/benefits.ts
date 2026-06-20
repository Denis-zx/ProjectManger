import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * GET /api/benefit-batches - 获取收益批次（按项目筛选）
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId } = req.query
  if (!projectId) {
    return res.status(400).json({ error: 'projectId 不能为空' })
  }
  const batches = db.prepare('SELECT * FROM benefit_batches WHERE project_id = ? ORDER BY created_at DESC').all(projectId)
  res.json({ benefitBatches: batches })
})

/**
 * POST /api/benefit-batches - 添加收益批次
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId, amount, note } = req.body
  if (!projectId || amount == null) {
    return res.status(400).json({ error: '项目ID和金额不能为空' })
  }
  const id = `b_${Date.now()}`
  const now = new Date().toISOString()

  const insertTx = db.transaction(() => {
    db.prepare(
      'INSERT INTO benefit_batches (id, project_id, amount, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, projectId, amount, note || null, req.user!.userId, now)

    // 更新项目累计收益
    db.prepare('UPDATE projects SET produced_benefit = produced_benefit + ?, updated_at = ? WHERE id = ?')
      .run(amount, now, projectId)
  })
  insertTx()

  const batch = db.prepare('SELECT * FROM benefit_batches WHERE id = ?').get(id)
  res.status(201).json({ benefitBatch: batch })
})

export default router
