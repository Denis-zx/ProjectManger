#!/bin/bash
# 项目管理系统 - 一键部署脚本 (Ubuntu/Debian)
# 使用方法: sudo bash deploy.sh

set -e

INSTALL_DIR="/opt/project-manager"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "  项目管理系统 - 部署脚本"
echo "============================================"

# 1. 检查并安装 Node.js
if ! command -v node &> /dev/null; then
    echo "[1/8] 安装 Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "[1/8] Node.js 已安装: $(node -v)"
fi

# 2. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "[2/8] 安装 Nginx..."
    apt-get update
    apt-get install -y nginx
else
    echo "[2/8] Nginx 已安装"
fi

# 3. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "[3/8] 安装 PM2..."
    npm install -g pm2
else
    echo "[3/8] PM2 已安装"
fi

# 4. 创建部署目录
echo "[4/8] 创建部署目录..."
mkdir -p $INSTALL_DIR/app/dist
mkdir -p $INSTALL_DIR/server
mkdir -p $INSTALL_DIR/data
mkdir -p /var/log/pm-server

# 5. 构建前端
echo "[5/8] 构建前端..."
cd $REPO_DIR/app
npm install
npm run build

# 6. 复制文件
echo "[6/8] 复制文件到部署目录..."
cp -r dist/* $INSTALL_DIR/app/dist/
cp -r $REPO_DIR/server/src $INSTALL_DIR/server/
cp $REPO_DIR/server/package.json $INSTALL_DIR/server/
cp $REPO_DIR/server/tsconfig.json $INSTALL_DIR/server/

# 7. 安装后端依赖并构建
echo "[7/8] 安装后端依赖并构建..."
cd $INSTALL_DIR/server
npm install
npm run build

# 初始化数据库种子数据
echo "  初始化数据库..."
node dist/seed.js || true

# 8. 配置并启动服务
echo "[8/8] 配置并启动服务..."

# 配置 Nginx
cp $REPO_DIR/deploy/nginx.conf /etc/nginx/conf.d/project-manager.conf
nginx -t && systemctl restart nginx

# 启动后端 (PM2)
pm2 delete pm-server 2>/dev/null || true
pm2 start $REPO_DIR/deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "============================================"
echo "  部署完成！"
echo "============================================"
echo ""
echo "  访问地址: http://$(hostname -I | awk '{print $1}')"
echo "  默认账号: superadmin / admin123"
echo ""
echo "  常用命令:"
echo "    pm2 status            # 查看后端状态"
echo "    pm2 logs pm-server    # 查看后端日志"
echo "    pm2 restart pm-server # 重启后端"
echo "    systemctl restart nginx # 重启 Nginx"
echo "============================================"
