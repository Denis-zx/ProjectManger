import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { initDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import projectRoutes from './routes/projects.js'
import transferRoutes from './routes/transfers.js'
import difficultyRoutes from './routes/difficulties.js'
import noteRoutes from './routes/notes.js'
import benefitRoutes from './routes/benefits.js'
import abolishRoutes from './routes/abolish.js'
import stageConfigRoutes from './routes/stageConfigs.js'

const app = express()
const PORT = process.env.PORT || 3001

// 初始化数据库
initDatabase()

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
}))

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))

// 请求日志
app.use(morgan('combined'))

// JSON 解析
app.use(express.json({ limit: '10mb' }))

// 限流：每个 IP 每分钟最多 300 次请求
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: '请求过于频繁，请稍后再试' },
})
app.use('/api/', limiter)

// 登录接口额外限流：每个 IP 每分钟最多 10 次登录尝试
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: '登录尝试过于频繁，请稍后再试' },
})
app.use('/api/auth/login', loginLimiter)

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/transfers', transferRoutes)
app.use('/api/difficulties', difficultyRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/benefit-batches', benefitRoutes)
app.use('/api/abolish-requests', abolishRoutes)
app.use('/api/stage-configs', stageConfigRoutes)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 全局错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('未处理的错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`\n========================================`)
  console.log(`  项目管理系统后端已启动`)
  console.log(`  地址: http://localhost:${PORT}`)
  console.log(`  API:  http://localhost:${PORT}/api`)
  console.log(`  健康检查: http://localhost:${PORT}/api/health`)
  console.log(`========================================\n`)
})
