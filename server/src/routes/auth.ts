import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * POST /api/auth/login - 用户登录
 */
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND status = ?'
  ).get(username, 'active') as any

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  // 返回用户信息（不含密码）
  const { password: _, ...userInfo } = user
  res.json({ token, user: userInfo })
})

/**
 * GET /api/auth/me - 获取当前登录用户信息
 */
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const user = db.prepare(
    'SELECT id, username, name, role, avatar, phone, status, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId) as any

  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  res.json({ user })
})

/**
 * PUT /api/auth/password - 修改密码
 */
router.put('/password', authMiddleware, (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于6位' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }

  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ error: '旧密码错误' })
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id)

  res.json({ message: '密码修改成功' })
})

/**
 * POST /api/auth/logout - 退出登录
 */
router.post('/logout', authMiddleware, (_req: Request, res: Response) => {
  // JWT 是无状态的，前端清除 token 即可
  res.json({ message: '退出成功' })
})

export default router
