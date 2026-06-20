# 项目管理系统 - 部署文档

## 架构概览

```
用户端 (PWA 免安装)
  iOS Safari "添加到主屏幕" / Android Chrome / PC 浏览器
         │ HTTP/HTTPS
         ▼
腾讯云服务器 (Linux Ubuntu)
  ├── Nginx (端口 80)
  │     ├── 静态资源托管 (前端 dist)
  │     ├── SPA 路由重写
  │     └── 反向代理 /api/ → 后端
  ├── Node.js 后端 API (端口 3001, PM2 守护)
  │     ├── JWT 认证
  │     ├── 限流 + 安全头
  │     └── 9 个 API 模块
  └── SQLite 数据库 (data/app.db)
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React + Vite + TypeScript + Tailwind | PWA 应用，手机免安装 |
| 后端 | Node.js + Express + TypeScript | RESTful API |
| 数据库 | SQLite (better-sqlite3) | 轻量级，无需额外安装 |
| 认证 | JWT (jsonwebtoken + bcryptjs) | 密码加密存储 |
| 进程管理 | PM2 | 后端常驻运行 |
| Web 服务器 | Nginx | 静态资源 + 反向代理 |

---

## 部署方式一：一键部署（推荐）

```bash
# 1. SSH 登录服务器
ssh root@你的服务器IP

# 2. 克隆项目
cd /opt
git clone https://github.com/你的用户名/ProjectManager.git
cd ProjectManager

# 3. 执行部署脚本
sudo bash deploy/deploy.sh
```

脚本自动完成：安装 Node.js → Nginx → PM2 → 构建前端 → 构建后端 → 初始化数据库 → 启动服务。

---

## 部署方式二：手动部署

### 1. 安装环境

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Nginx
sudo apt-get update && sudo apt-get install -y nginx

# PM2
sudo npm install -g pm2
```

### 2. 构建前端

```bash
cd /opt/ProjectManager/app
npm install
npm run build    # 生成 dist/
```

### 3. 构建后端

```bash
cd /opt/ProjectManager/server
npm install
npm run build    # 生成 dist/
```

### 4. 初始化数据库

```bash
npm run seed     # 创建 data/app.db 并导入示例数据
```

### 5. 配置 Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/conf.d/project-manager.conf
# 编辑 server_name 为你的域名或 IP
sudo nano /etc/nginx/conf.d/project-manager.conf
sudo nginx -t && sudo systemctl restart nginx
```

### 6. 启动后端

```bash
# 修改 JWT_SECRET 为随机字符串
nano deploy/ecosystem.config.cjs

pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root
```

### 7. 开放端口

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**腾讯云安全组**（必须）：控制台 → 云服务器 → 安全组 → 入站规则 → TCP 80，来源 0.0.0.0/0

---

## HTTPS 配置（推荐）

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
# 自动申请 Let's Encrypt 免费证书并配置自动续期
```

> iOS Safari 的 PWA「添加到主屏幕」功能要求 HTTPS。

---

## 手机端使用（PWA 免安装）

### iOS (Safari)
1. 用 Safari 打开系统地址
2. 点击底部「分享」按钮
3. 选择「添加到主屏幕」
4. 点击主屏幕图标即可全屏使用，无需 App Store

### Android (Chrome)
1. 用 Chrome 打开系统地址
2. 浏览器会自动提示「添加到主屏幕」，或手动点击菜单 →「添加到主屏幕」
3. 点击桌面图标即可使用

### PWA 特性
- 离线缓存：首次加载后，断网仍可查看已缓存数据
- 全屏模式：无浏览器地址栏，体验接近原生 App
- 自动更新：有新版本自动后台更新

---

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | superadmin | admin123 |
| 管理员 | admin | admin123 |
| 普通成员 | zhangsan | 123456 |

> 部署后请立即修改默认密码！

---

## 常用运维命令

```bash
# 后端
pm2 status              # 查看状态
pm2 logs pm-server      # 查看日志
pm2 restart pm-server   # 重启
pm2 stop pm-server      # 停止

# Nginx
sudo systemctl restart nginx
sudo nginx -t           # 测试配置

# 数据库备份
cp /opt/project-manager/server/data/app.db /backup/app-$(date +%Y%m%d).db

# 更新部署
cd /opt/ProjectManager
git pull
cd app && npm run build
cd ../server && npm run build
pm2 restart pm-server
```

---

## 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 无法访问 | 安全组未开放端口 | 腾讯云安全组添加 80 端口入站规则 |
| 子路由 404 | Nginx 未配置 SPA 重写 | 检查 nginx.conf 的 try_files |
| API 报错 | 后端未启动 | `pm2 status` 检查，`pm2 logs` 排查 |
| 登录失败 | 数据库未初始化 | 执行 `npm run seed` |
| 手机无法添加主屏幕 | 未 HTTPS（iOS 要求） | 配置 Let's Encrypt 证书 |
| 数据丢失 | 重新部署覆盖了 db | 备份 data/app.db 后再部署 |

---

## 服务器配置建议

| 用户规模 | 服务器配置 | 月费用参考 |
|----------|-----------|-----------|
| 10 人以下 | 2核2G | ~50 元 |
| 10-50 人 | 2核4G | ~100 元 |
| 50 人以上 | 4核8G + 数据库迁移 MySQL | ~300 元 |

> SQLite 支撑百人级并发没问题，如需更高并发可迁移到 MySQL/PostgreSQL。
