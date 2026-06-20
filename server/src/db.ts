import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DB_PATH = path.resolve(__dirname, '../../data/app.db')

// 确保数据目录存在
import fs from 'fs'
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(DB_PATH)

// 开启 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/**
 * 初始化数据库表结构
 */
export function initDatabase() {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      username        TEXT UNIQUE NOT NULL,
      password        TEXT NOT NULL,
      name            TEXT NOT NULL,
      role            TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('super_admin','admin','member')),
      avatar          TEXT,
      phone           TEXT,
      status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
      created_at      TEXT NOT NULL
    );

    -- 项目表
    CREATE TABLE IF NOT EXISTS projects (
      id                      TEXT PRIMARY KEY,
      project_no              TEXT NOT NULL,
      name                    TEXT NOT NULL,
      description             TEXT,
      stage                   TEXT NOT NULL,
      maintenance_sub_stage   TEXT,
      status                  TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','abolished','reserved')),
      creator_id              TEXT NOT NULL,
      expected_completion_date TEXT,
      related_client          TEXT,
      expected_benefit        REAL DEFAULT 0,
      produced_benefit        REAL DEFAULT 0,
      benefit_note            TEXT,
      is_favorited            INTEGER DEFAULT 0,
      priority                TEXT CHECK(priority IN ('high','medium','low')),
      next_reminder_at        TEXT,
      reminder_cycle          TEXT CHECK(reminder_cycle IN ('monthly','quarterly','custom')),
      created_at              TEXT NOT NULL,
      updated_at              TEXT NOT NULL,
      stage_entered_at        TEXT NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    -- 项目负责人关联表（多对多）
    CREATE TABLE IF NOT EXISTS project_owners (
      project_id  TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 流转记录表
    CREATE TABLE IF NOT EXISTS transfers (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL,
      from_user_id  TEXT,
      to_user_id    TEXT NOT NULL,
      from_stage    TEXT NOT NULL,
      to_stage      TEXT NOT NULL,
      reason        TEXT NOT NULL,
      custom_reason TEXT,
      note          TEXT,
      status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
      reject_reason TEXT,
      created_at    TEXT NOT NULL,
      responded_at  TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );

    -- 困难/问题表
    CREATE TABLE IF NOT EXISTS difficulties (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      author_id   TEXT NOT NULL,
      content     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved')),
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- 困难@提及用户关联表
    CREATE TABLE IF NOT EXISTS difficulty_mentions (
      difficulty_id TEXT NOT NULL,
      user_id       TEXT NOT NULL,
      PRIMARY KEY (difficulty_id, user_id),
      FOREIGN KEY (difficulty_id) REFERENCES difficulties(id) ON DELETE CASCADE
    );

    -- 项目备注表
    CREATE TABLE IF NOT EXISTS notes (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      author_id   TEXT NOT NULL,
      content     TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- 收益批次表
    CREATE TABLE IF NOT EXISTS benefit_batches (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      amount      REAL NOT NULL,
      note        TEXT,
      created_by  TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 废止申请表
    CREATE TABLE IF NOT EXISTS abolish_requests (
      id           TEXT PRIMARY KEY,
      project_id   TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      reason       TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reviewer_id  TEXT,
      review_note  TEXT,
      created_at   TEXT NOT NULL,
      reviewed_at  TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (requester_id) REFERENCES users(id)
    );

    -- 环节配置表
    CREATE TABLE IF NOT EXISTS stage_configs (
      stage                    TEXT PRIMARY KEY,
      standard_duration_hours  INTEGER NOT NULL
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_project ON transfers(project_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_to_user ON transfers(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_difficulties_project ON difficulties(project_id);
    CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
    CREATE INDEX IF NOT EXISTS idx_benefit_project ON benefit_batches(project_id);
  `)
}

export default db
