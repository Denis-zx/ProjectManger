import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * GET /api/difficulties - 获取困难列表（按项目筛选）
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId } = req.query
  let sql = 'SELECT * FROM difficulties'
  const params: any[] = []
  if (projectId) {
    sql += ' WHERE project_id = ?'
    params.push(projectId)
  }
  sql += ' ORDER BY created_at DESC'
  const rows = db.prepare(sql).all(...params) as any[]

  const difficulties = rows.map(d => {
    const mentions = db.prepare('SELECT user_id FROM difficulty_mentions WHERE difficulty_id = ?').all(d.id) as { user_id: string }[]
    return { ...d, mentionedUserIds: mentions.map(m => m.user_id) }
  })

  res.json({ difficulties })
})

/**
 * POST /api/difficulties - 添加困难
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { projectId, content, mentionedUserIds } = req.body
  if (!projectId || !content) {
    return res.status(400).json({ error: '项目ID和内容不能为空' })
  }
  const id = `d_${Date.now()}`
  const now = new Date().toISOString()

  db.prepare(
    'INSERT INTO difficulties (id, project_id, author_id, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, projectId, req.user!.userId, content, 'pending', now, now)

  if (mentionedUserIds && Array.isArray(mentionedUserIds)) {
    const insertMention = db.prepare('INSERT INTO difficulty_mentions (difficulty_id, user_id) VALUES (?, ?)')
    for (const uid of mentionedUserIds) {
      insertMention.run(id, uid)
    }
  }

  const difficulty = db.prepare('SELECT * FROM difficulties WHERE id = ?').get(id) as any
  difficulty.mentionedUserIds = mentionedUserIds || []
  res.status(201).json({ difficulty })
})

/**
 * PUT /api/difficulties/:id - 更新困难状态
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  if (!['pending', 'processing', 'resolved'].includes(status)) {
    return res.status(400).json({ error: '无效的状态' })
  }
  const now = new Date().toISOString()
  db.prepare('UPDATE difficulties SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id)
  res.json({ difficulty: db.prepare('SELECT * FROM difficulties WHERE id = ?').get(id) })
})

/**
 * DELETE /api/difficulties/:id - 删除困难
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  db.prepare('DELETE FROM difficulties WHERE id = ?').run(id)
  res.json({ message: '已删除' })
})

export default router
