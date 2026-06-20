import { Router } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

/**
 * GET /api/stage-configs - 获取环节配置
 */
router.get('/', authMiddleware, (_req: Request, res: Response) => {
  const configs = db.prepare('SELECT * FROM stage_configs').all() as any[]
  const result = configs.map(c => ({
    stage: c.stage,
    standardDurationHours: c.standard_duration_hours,
  }))
  res.json({ stageConfigs: result })
})

/**
 * PUT /api/stage-configs/:stage - 更新环节配置（管理员权限）
 */
router.put('/:stage', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
  const { stage } = req.params
  const { standardDurationHours } = req.body

  if (standardDurationHours == null || standardDurationHours < 1) {
    return res.status(400).json({ error: '标准时长必须大于0' })
  }

  db.prepare(
    'UPDATE stage_configs SET standard_duration_hours = ? WHERE stage = ?'
  ).run(standardDurationHours, stage)

  res.json({
    stageConfig: { stage, standardDurationHours },
  })
})

export default router
