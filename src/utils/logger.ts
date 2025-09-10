import winston from 'winston';
import path from 'path';
import fs from 'fs';

let isDevelopment = process.env['NODE_ENV'] !== 'production';

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuration des formats de log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configuration des transports
const transports: winston.transport[] = [
  // Fichier pour tous les logs
  new winston.transports.File({
    filename: 'logs/app.log',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }),
  
  // Fichier séparé pour les erreurs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
];

// Ajouter la console en développement
// if (isDevelopment) {
//   transports.push(
//     new winston.transports.Console({
//       format: consoleFormat,
//       level: 'debug'
//     })
//   );
// }

// Création du logger principal
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'gestion-reclamation-api' },
  transports,
  
  // Gestion des exceptions non capturées
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // Gestion des rejets de promesses non capturés
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Logger spécialisé pour les requêtes HTTP
export const httpLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'http-requests' },
  transports: [
    new winston.transports.File({
      filename: 'logs/http.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Logger spécialisé pour l'audit
export const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'audit' },
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// Logger spécialisé pour la sécurité
export const securityLogger = winston.createLogger({
  level: 'warn',
  format: logFormat,
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({
      filename: 'logs/security.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: consoleFormat,
      level: 'warn'
    })
  ]
});

// Fonctions utilitaires pour le logging
export const logRequest = (req: any, res: any, duration: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  };
  
  if (res.statusCode >= 400) {
    httpLogger.warn('Requête HTTP', logData);
  } else {
    httpLogger.info('Requête HTTP', logData);
  }
};

export const logSecurityEvent = (event: string, details: any) => {
  securityLogger.warn(`Événement de sécurité: ${event}`, details);
};

export const logAuditEvent = (action: string, details: any) => {
  auditLogger.info(`Action d'audit: ${action}`, details);
};

// Export par défaut
export default logger;
