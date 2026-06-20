import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * GET /api/users - 获取所有用户列表
 */
router.get('/', authMiddleware, (_req: Request, res: Response) => {
  const users = db.prepare(
    'SELECT id, username, name, role, avatar, phone, status, created_at FROM users ORDER BY created_at'
  ).all()
  res.json({ users })
})

/**
 * POST /api/users - 创建用户（管理员权限）
 */
router.post('/', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
  const { username, password, name, role, phone } = req.body

  if (!username || !password || !name) {
    return res.status(400).json({ error: '用户名、密码和姓名不能为空' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' })
  }

  if (role === 'super_admin' && req.user!.role !== 'super_admin') {
    return res.status(403).json({ error: '无权创建超级管理员' })
  }

  const id = `u_${Date.now()}`
  const hashedPassword = bcrypt.hashSync(password, 10)
  const createdAt = new Date().toISOString()

  db.prepare(
    `INSERT INTO users (id, username, password, name, role, phone, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
  ).run(id, username, hashedPassword, name, role || 'member', phone || null, createdAt)

  const user = db.prepare(
    'SELECT id, username, name, role, avatar, phone, status, created_at FROM users WHERE id = ?'
  ).get(id)

  res.status(201).json({ user })
})

/**
 * PUT /api/users/:id - 更新用户信息
 */
router.put('/:id', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params
  const { name, role, phone, status, password } = req.body

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }

  if (user.role === 'super_admin' && req.user!.role !== 'super_admin') {
    return res.status(403).json({ error: '无权修改超级管理员' })
  }

  if (role === 'super_admin' && req.user!.role !== 'super_admin') {
    return res.status(403).json({ error: '无权设置超级管理员' })
  }

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id)
  }

  db.prepare(
    `UPDATE users SET name = ?, role = ?, phone = ?, status = ? WHERE id = ?`
  ).run(
    name ?? user.name,
    role ?? user.role,
    phone ?? user.phone,
    status ?? user.status,
    id
  )

  const updated = db.prepare(
    'SELECT id, username, name, role, avatar, phone, status, created_at FROM users WHERE id = ?'
  ).get(id)

  res.json({ user: updated })
})

/**
 * DELETE /api/users/:id - 禁用用户（软删除）
 */
router.delete('/:id', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params

  if (id === req.user!.userId) {
    return res.status(400).json({ error: '不能禁用自己的账号' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }

  if (user.role === 'super_admin' && req.user!.role !== 'super_admin') {
    return res.status(403).json({ error: '无权禁用超级管理员' })
  }

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run('disabled', id)
  res.json({ message: '用户已禁用' })
})

export default router
