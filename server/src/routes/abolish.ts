import { Router } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * GET /api/abolish-requests - 获取废止申请列表
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { status } = req.query
  let sql = 'SELECT * FROM abolish_requests'
  const params: any[] = []
  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }
  sql += ' ORDER BY created_at DESC'
  const requests = db.prepare(sql).all(...params)
  res.json({ abolishRequests: requests })
})

/**
 * POST /api/abolish-requests - 提交废止申请
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId, reason } = req.body
  if (!projectId || !reason) {
    return res.status(400).json({ error: '项目ID和原因不能为空' })
  }
  const id = `a_${Date.now()}`
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO abolish_requests (id, project_id, requester_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, projectId, req.user!.userId, reason, 'pending', now)

  const request = db.prepare('SELECT * FROM abolish_requests WHERE id = ?').get(id)
  res.status(201).json({ abolishRequest: request })
})

/**
 * PUT /api/abolish-requests/:id/review - 审核废止申请（管理员权限）
 */
router.put('/:id/review', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params
  const { approved, reviewNote } = req.body

  const request = db.prepare('SELECT * FROM abolish_requests WHERE id = ?').get(id) as any
  if (!request) {
    return res.status(404).json({ error: '废止申请不存在' })
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ error: '该申请已处理' })
  }

  const now = new Date().toISOString()
  const reviewTx = db.transaction(() => {
    db.prepare(
      'UPDATE abolish_requests SET status = ?, reviewer_id = ?, review_note = ?, reviewed_at = ? WHERE id = ?'
    ).run(approved ? 'approved' : 'rejected', req.user!.userId, reviewNote || null, now, id)

    if (approved) {
      db.prepare("UPDATE projects SET status = 'reserved', updated_at = ? WHERE id = ?")
        .run(now, request.project_id)
    }
  })
  reviewTx()

  const updated = db.prepare('SELECT * FROM abolish_requests WHERE id = ?').get(id)
  res.json({ abolishRequest: updated })
})

export default router
