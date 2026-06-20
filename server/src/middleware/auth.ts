import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'pm_secret_key_change_in_production_2024'
const JWT_EXPIRES_IN = '7d'

export interface JwtPayload {
  userId: string
  username: string
  role: string
}

/**
 * 生成 JWT token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * 认证中间件：验证 JWT token
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或 token 缺失' })
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'token 无效或已过期，请重新登录' })
  }
}

/**
 * 角色权限中间件：要求用户至少拥有指定角色
 * 角色优先级: member < admin < super_admin
 */
const rolePriority = ['member', 'admin', 'super_admin']

export function requireRole(minRole: 'admin' | 'super_admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' })
    }
    const userLevel = rolePriority.indexOf(req.user.role)
    const requiredLevel = rolePriority.indexOf(minRole)
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: '权限不足' })
    }
    next()
  }
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
