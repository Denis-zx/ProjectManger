import bcrypt from 'bcryptjs'
import db, { initDatabase } from './db.js'
import dayjs from 'dayjs'

/**
 * 种子数据脚本：初始化数据库并导入示例数据
 * 运行: npm run seed
 */
async function seed() {
  console.log('开始初始化数据库...')
  initDatabase()

  // 检查是否已有数据
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
  if (userCount > 0) {
    console.log('数据库已有数据，跳过种子数据导入。')
    console.log('如需重新导入，请先删除 data/app.db 文件。')
    return
  }

  console.log('导入用户数据...')
  const users = [
    { id: 'u1', username: 'superadmin', password: 'admin123', name: '超级管理员', role: 'super_admin' },
    { id: 'u2', username: 'admin', password: 'admin123', name: '管理员A', role: 'admin' },
    { id: 'u3', username: 'zhangsan', password: '123456', name: '张三', role: 'member' },
    { id: 'u4', username: 'lisi', password: '123456', name: '李四', role: 'member' },
    { id: 'u5', username: 'wangwu', password: '123456', name: '王五', role: 'member' },
    { id: 'u6', username: 'zhaoliu', password: '123456', name: '赵六', role: 'member' },
    { id: 'u7', username: 'sunqi', password: '123456', name: '孙七', role: 'member' },
  ]

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (const u of users) {
    const hashed = bcrypt.hashSync(u.password, 10)
    insertUser.run(u.id, u.username, hashed, u.name, u.role, 'active', dayjs().subtract(3, 'month').toISOString())
  }

  console.log('导入环节配置...')
  const stageConfigs = [
    { stage: 'initial_visit', hours: 72 },
    { stage: 'collect_docs', hours: 96 },
    { stage: 'form_report', hours: 120 },
    { stage: 'under_review', hours: 72 },
    { stage: 'disbursement', hours: 48 },
    { stage: 'maintenance', hours: 720 },
  ]
  const insertConfig = db.prepare('INSERT INTO stage_configs (stage, standard_duration_hours) VALUES (?, ?)')
  for (const c of stageConfigs) {
    insertConfig.run(c.stage, c.hours)
  }

  console.log('导入项目数据...')
  const projects = [
    { id: 'p1', no: 'PRJ-2024-0425-001', name: '客户A贷款咨询项目', desc: '客户咨询个人住房贷款业务', stage: 'initial_visit', status: 'active', creatorId: 'u3', owners: ['u3'], expDate: '2024-05-10', expBenefit: 30000, priority: 'medium', created: '2024-04-25T09:00:00' },
    { id: 'p2', no: 'PRJ-2024-0425-002', name: '企业B融资项目', desc: '企业流动资金贷款申请', stage: 'initial_visit', status: 'active', creatorId: 'u4', owners: ['u4'], expDate: '2024-05-15', expBenefit: 80000, priority: 'high', created: '2024-04-25T14:00:00' },
    { id: 'p3', no: 'PRJ-2024-0427-003', name: '个人C消费贷申请', desc: '个人消费贷款', stage: 'initial_visit', status: 'active', creatorId: 'u5', owners: ['u5'], expDate: '2024-05-20', expBenefit: 15000, priority: 'low', created: '2024-04-27T10:00:00' },
    { id: 'p4', no: 'PRJ-2024-0426-004', name: '客户D车贷申请', desc: '车辆抵押贷款', stage: 'collect_docs', status: 'active', creatorId: 'u6', owners: ['u6'], expDate: '2024-05-08', expBenefit: 25000, prodBenefit: 5000, priority: 'medium', created: '2024-04-26T11:00:00' },
    { id: 'p5', no: 'PRJ-2024-0422-005', name: '客户E装修贷款', desc: '装修贷款申请', stage: 'collect_docs', status: 'active', creatorId: 'u7', owners: ['u7'], expDate: '2024-05-06', expBenefit: 50000, prodBenefit: 34000, fav: 1, priority: 'high', created: '2024-04-22T14:30:00' },
    { id: 'p6', no: 'PRJ-2024-0424-006', name: '企业F投资项目贷款', desc: '大型投资项目贷款', stage: 'form_report', status: 'active', creatorId: 'u3', owners: ['u3'], expDate: '2024-05-20', expBenefit: 120000, prodBenefit: 60000, priority: 'medium', created: '2024-04-24T09:00:00' },
    { id: 'p7', no: 'PRJ-2024-0425-007', name: '客户G经营贷申请', desc: '个体工商户经营贷款', stage: 'under_review', status: 'active', creatorId: 'u4', owners: ['u4'], expDate: '2024-05-12', expBenefit: 45000, prodBenefit: 20000, priority: 'medium', created: '2024-04-25T16:00:00' },
    { id: 'p8', no: 'PRJ-2024-0427-008', name: '客户H留学贷款', desc: '出国留学贷款申请', stage: 'under_review', status: 'active', creatorId: 'u5', owners: ['u5'], expDate: '2024-05-18', expBenefit: 35000, prodBenefit: 10000, priority: 'low', created: '2024-04-27T13:00:00' },
    { id: 'p9', no: 'PRJ-2024-0418-009', name: '客户I房贷项目', desc: '个人住房按揭贷款', stage: 'disbursement', status: 'active', creatorId: 'u3', owners: ['u3'], expDate: '2024-04-30', expBenefit: 100000, prodBenefit: 80000, fav: 1, priority: 'low', created: '2024-04-18T08:00:00' },
    { id: 'p10', no: 'PRJ-2024-0420-010', name: '客户J信用卡回访', desc: '日常维护项目', stage: 'maintenance', subStage: 'pending_callback', status: 'active', creatorId: 'u4', owners: ['u4'], expDate: '2024-06-30', expBenefit: 20000, prodBenefit: 15000, priority: 'medium', cycle: 'quarterly', created: '2024-04-20T10:00:00' },
    { id: 'p11', no: 'PRJ-2024-0415-011', name: '客户K贷款跟进', desc: '日常维护项目', stage: 'maintenance', subStage: 'pending_callback', status: 'active', creatorId: 'u5', owners: ['u5'], expDate: '2024-07-31', expBenefit: 18000, prodBenefit: 12000, priority: 'low', cycle: 'monthly', created: '2024-04-15T09:00:00' },
    { id: 'p12', no: 'PRJ-2024-0410-012', name: '客户L增贷潜力', desc: '日常维护项目', stage: 'maintenance', subStage: 'potential_mining', status: 'active', creatorId: 'u6', owners: ['u6'], expDate: '2024-08-31', expBenefit: 40000, prodBenefit: 25000, priority: 'medium', cycle: 'quarterly', created: '2024-04-10T11:00:00' },
    { id: 'p13', no: 'PRJ-2024-0405-013', name: '客户M交叉销售', desc: '日常维护项目', stage: 'maintenance', subStage: 'potential_mining', status: 'active', creatorId: 'u7', owners: ['u7'], expDate: '2024-09-30', expBenefit: 30000, prodBenefit: 18000, priority: 'low', cycle: 'monthly', created: '2024-04-05T14:00:00' },
    { id: 'p14', no: 'PRJ-2024-0315-014', name: '客户O融资项目', desc: '企业融资项目，主动申请废止', stage: 'collect_docs', status: 'reserved', creatorId: 'u3', owners: ['u3'], expDate: '2024-05-01', expBenefit: 60000, created: '2024-03-15T09:00:00' },
    { id: 'p15', no: 'PRJ-2024-0228-015', name: '客户P车贷申请', desc: '个人车贷项目', stage: 'initial_visit', status: 'reserved', creatorId: 'u4', owners: ['u4'], expDate: '2024-04-15', expBenefit: 20000, created: '2024-02-28T10:00:00' },
    { id: 'p16', no: 'PRJ-2024-0210-016', name: '客户Q经营贷项目', desc: '个体工商户经营贷款', stage: 'form_report', status: 'reserved', creatorId: 'u5', owners: ['u5'], expDate: '2024-04-01', expBenefit: 35000, prodBenefit: 5000, created: '2024-02-10T14:00:00' },
  ]

  const insertProject = db.prepare(
    `INSERT INTO projects (
      id, project_no, name, description, stage, maintenance_sub_stage, status, creator_id,
      expected_completion_date, related_client, expected_benefit, produced_benefit,
      is_favorited, priority, reminder_cycle, created_at, updated_at, stage_entered_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertOwner = db.prepare('INSERT INTO project_owners (project_id, user_id) VALUES (?, ?)')

  for (const p of projects) {
    insertProject.run(
      p.id, p.no, p.name, p.desc, p.stage, (p as any).subStage || null, p.status, p.creatorId,
      p.expDate, null, p.expBenefit, (p as any).prodBenefit || 0, (p as any).fav || 0, p.priority || null,
      (p as any).cycle || null, p.created, p.created, p.created
    )
    for (const oid of p.owners) {
      insertOwner.run(p.id, oid)
    }
  }

  console.log('导入流转记录...')
  const transfers = [
    { id: 't1', projectId: 'p5', fromUserId: 'u7', toUserId: 'u7', fromStage: 'initial_visit', toStage: 'collect_docs', reason: 'stage_advance', note: '项目创建，进入收资料环节', status: 'accepted', createdAt: '2024-04-22T14:30:00', respondedAt: '2024-04-22T14:30:00' },
    { id: 't2', projectId: 'p9', fromUserId: 'u4', toUserId: 'u3', fromStage: 'under_review', toStage: 'disbursement', reason: 'stage_advance', note: '审批通过，进入放款环节', status: 'accepted', createdAt: '2024-04-28T08:00:00', respondedAt: '2024-04-28T08:30:00' },
  ]
  const insertTransfer = db.prepare(
    `INSERT INTO transfers (id, project_id, from_user_id, to_user_id, from_stage, to_stage, reason, note, status, created_at, responded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  for (const t of transfers) {
    insertTransfer.run(t.id, t.projectId, t.fromUserId, t.toUserId, t.fromStage, t.toStage, t.reason, t.note, t.status, t.createdAt, t.respondedAt)
  }

  console.log('导入困难记录...')
  db.prepare(
    'INSERT INTO difficulties (id, project_id, author_id, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('d1', 'p5', 'u7', '客户需要补充收入证明和房产证明，已多次催促仍未提交', 'pending', '2024-04-28T10:30:00', '2024-04-28T10:30:00')
  db.prepare('INSERT INTO difficulty_mentions (difficulty_id, user_id) VALUES (?, ?)').run('d1', 'u2')

  console.log('导入备注记录...')
  const notes = [
    { id: 'n1', projectId: 'p5', authorId: 'u4', content: '已收集客户基本资料，包括身份证、户口本等', createdAt: '2024-04-26T15:20:00' },
    { id: 'n2', projectId: 'p5', authorId: 'u7', content: '客户表示本周内会补齐剩余资料', createdAt: '2024-04-27T09:00:00' },
  ]
  const insertNote = db.prepare('INSERT INTO notes (id, project_id, author_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
  for (const n of notes) {
    insertNote.run(n.id, n.projectId, n.authorId, n.content, n.createdAt, n.createdAt)
  }

  console.log('导入收益批次...')
  const batches = [
    { id: 'b1', projectId: 'p5', amount: 20000, note: '首期手续费', createdBy: 'u7', createdAt: '2024-04-23T10:00:00' },
    { id: 'b2', projectId: 'p5', amount: 14000, note: '二期手续费', createdBy: 'u7', createdAt: '2024-04-25T14:00:00' },
  ]
  const insertBatch = db.prepare('INSERT INTO benefit_batches (id, project_id, amount, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
  for (const b of batches) {
    insertBatch.run(b.id, b.projectId, b.amount, b.note, b.createdBy, b.createdAt)
  }

  console.log('导入废止申请...')
  const abolishes = [
    { id: 'a1', projectId: 'p14', requesterId: 'u3', reason: '客户资金需求变更，主动申请废止', status: 'approved', reviewerId: 'u2', reviewNote: '同意废止', createdAt: '2024-04-08T10:00:00', reviewedAt: '2024-04-10T09:00:00' },
    { id: 'a2', projectId: 'p15', requesterId: 'u4', reason: '客户资质不符合要求', status: 'approved', reviewerId: 'u2', reviewNote: '同意废止', createdAt: '2024-04-03T11:00:00', reviewedAt: '2024-04-05T10:00:00' },
  ]
  const insertAbolish = db.prepare(
    'INSERT INTO abolish_requests (id, project_id, requester_id, reason, status, reviewer_id, review_note, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  for (const a of abolishes) {
    insertAbolish.run(a.id, a.projectId, a.requesterId, a.reason, a.status, a.reviewerId, a.reviewNote, a.createdAt, a.reviewedAt)
  }

  console.log('\n========================================')
  console.log('  种子数据导入完成！')
  console.log('  默认账号:')
  console.log('    超级管理员: superadmin / admin123')
  console.log('    管理员:     admin / admin123')
  console.log('    普通用户:   zhangsan / 123456')
  console.log('========================================\n')
}

seed().catch(err => {
  console.error('种子数据导入失败:', err)
  process.exit(1)
})
