module.exports = {
  apps: [
    {
      name: 'signalcartel-web',
      script: 'npm',
      args: 'run start',
      cwd: '/home/telgkb9/depot/dev-signalcartel',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      
      // Restart strategies
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      
      // Memory monitoring
      monitor_options: {
        memory: true,
        cpu: true
      }
    }
  ]
};