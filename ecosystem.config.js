module.exports = {
  apps: [
    {
      name: 'gestion-reclamation-backend',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Configuration de redémarrage automatique
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      max_memory_restart: '1G',
      
      // Configuration des logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuration de redémarrage
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Configuration de surveillance
      monitor: true,
      autorestart: true,
      
      // Variables d'environnement spécifiques
      env_file: '.env',
      
      // Configuration des workers
      instances: 2,
      exec_mode: 'cluster',
      
      // Configuration de la mémoire
      node_args: '--max-old-space-size=1024',
      
      // Configuration des timeouts
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Configuration des signaux
      shutdown_with_message: true,
      
      // Configuration des métriques
      pmx: true,
      
      // Configuration des notifications
      notify: false,
    },
  ],
  
  // Configuration du déploiement
  deploy: {
    production: {
      user: 'node',
      host: 'your-production-host',
      ref: 'origin/main',
      repo: 'git@github.com:username/gestion-reclamation-backend.git',
      path: '/var/www/gestion-reclamation-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
