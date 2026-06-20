# PM2 进程管理配置
# 使用方法: pm2 start ecosystem.config.cjs --env production

module.exports = {
  apps: [
    {
      name: 'pm-server',
      script: 'dist/index.js',
      cwd: '/opt/project-manager/server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        JWT_SECRET: 'CHANGE_THIS_TO_RANDOM_SECRET_KEY',
        CORS_ORIGIN: '*',
      },
      error_file: '/var/log/pm-server/error.log',
      out_file: '/var/log/pm-server/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '300M',
      autorestart: true,
      max_restarts: 10,
    },
  ],
}
