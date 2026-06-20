import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * GET /api/notes - 获取备注列表（按项目筛选）
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId } = req.query
  if (!projectId) {
    return res.status(400).json({ error: 'projectId 不能为空' })
  }
  const notes = db.prepare('SELECT * FROM notes WHERE project_id = ? ORDER BY created_at DESC').all(projectId)
  res.json({ notes })
})

/**
 * POST /api/notes - 添加备注
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId, content } = req.body
  if (!projectId || !content) {
    return res.status(400).json({ error: '项目ID和内容不能为空' })
  }
  const id = `n_${Date.now()}`
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO notes (id, project_id, author_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, projectId, req.user!.userId, content, now, now)
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
  res.status(201).json({ note })
})

/**
 * DELETE /api/notes/:id - 删除备注
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id)
  res.json({ message: '已删除' })
})

export default router
