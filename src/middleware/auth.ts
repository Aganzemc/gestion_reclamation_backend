import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authServices';
import { JwtPayload } from '../types';
import logger from '../utils/logger';
import { logSecurityEvent } from '../utils/logger';

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware d'authentification JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    const token = authHeader.substring(7);
    const { isValid, user, sessionId } = await authService.verifyAuth(token);

    if (!isValid || !user) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Ajouter les informations d'authentification à la requête
    (req as any).user = user;
    (req as any).userId = user.id;
    (req as any).sessionId = sessionId;

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

export const optionalAuth = async (req: Request, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { isValid, user, sessionId } = await authService.verifyAuth(token);

      if (isValid && user) {
        (req as any).user = user;
        (req as any).userId = user.id;
        (req as any).sessionId = sessionId;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Middleware de vérification des rôles
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentification requise',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }
      
      const userRoles = req.user.roles || [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        logSecurityEvent('Tentative d\'accès avec rôle insuffisant', {
          userId: req.user.user_id,
          email: req.user.email,
          userRoles,
          requiredRoles,
          url: req.url,
          method: req.method
        });
        
        res.status(403).json({
          success: false,
          error: 'Permissions insuffisantes',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: requiredRoles,
            current: userRoles
          }
        });
        return;
      }
      
      next();
      
    } catch (error) {
      logger.error('Erreur dans le middleware de vérification des rôles:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware de vérification des permissions spécifiques
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentification requise',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }
      
      const userRoles = req.user.roles || [];
      
      // Vérifier les permissions basées sur les rôles
      const hasPermission = checkPermission(userRoles, resource, action, req);
      
      if (!hasPermission) {
        logSecurityEvent('Tentative d\'accès sans permission', {
          userId: req.user.user_id,
          email: req.user.email,
          userRoles,
          resource,
          action,
          url: req.url,
          method: req.method
        });
        
        res.status(403).json({
          success: false,
          error: 'Permission refusée',
          code: 'PERMISSION_DENIED',
          details: {
            resource,
            action,
            userRoles
          }
        });
        return;
      }
      
      next();
      
    } catch (error) {
      logger.error('Erreur dans le middleware de vérification des permissions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Vérifie les permissions basées sur les rôles et le contexte
 */
function checkPermission(
  userRoles: string[], 
  resource: string, 
  action: string, 
  req: Request
): boolean {
  // ADMIN a toutes les permissions
  if (userRoles.includes('ADMIN')) {
    return true;
  }
  
  // Permissions spécifiques par rôle
  const rolePermissions: Record<string, Record<string, string[]>> = {
    QA: {
      tickets: ['read', 'update', 'comment'],
      users: ['read'],
      analytics: ['read']
    },
    STO: {
      tickets: ['read', 'update', 'comment', 'assign'],
      users: ['read'],
      analytics: ['read']
    },
    VIEWER: {
      tickets: ['read'],
      analytics: ['read']
    }
  };
  
  // Vérifier les permissions du rôle
  for (const role of userRoles) {
    const permissions = rolePermissions[role];
    if (permissions && permissions[resource] && permissions[resource].includes(action)) {
      return true;
    }
  }
  
  // Vérifications contextuelles spéciales
  if (resource === 'tickets' && action === 'update') {
    // Un utilisateur peut modifier ses propres tickets
    const ticketId = req.params['id'] || req.body.ticket_id;
    if (ticketId && req.user) {
      // Vérifier si l'utilisateur est le créateur du ticket
      // Cette logique sera implémentée dans le service
      return true;
    }
  }
  
  return false;
}

/**
 * Middleware de vérification de propriétaire (pour les ressources personnelles)
 */
export const requireOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentification requise',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }
      
      const resourceId = req.params['id'];
      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'ID de ressource requis',
          code: 'RESOURCE_ID_REQUIRED'
        });
        return;
      }
      
      // Vérifier la propriété de la ressource
      const isOwner = await checkResourceOwnership(
        resourceType, 
        parseInt(resourceId), 
        req.user.user_id
      );
      
      if (!isOwner && !req.user.roles.includes('ADMIN')) {
        logSecurityEvent('Tentative d\'accès à une ressource non possédée', {
          userId: req.user.user_id,
          resourceType,
          resourceId,
          url: req.url,
          method: req.method
        });
        
        res.status(403).json({
          success: false,
          error: 'Accès non autorisé à cette ressource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
        return;
      }
      
      next();
      
    } catch (error) {
      logger.error('Erreur dans le middleware de vérification de propriétaire:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Vérifie si un utilisateur est propriétaire d'une ressource
 */
async function checkResourceOwnership(
  _resourceType: string, 
  _resourceId: number, 
  _userId: number
): Promise<boolean> {
  try {
    // Cette fonction sera implémentée selon le type de ressource
    // Pour l'instant, retourner false par défaut
    return false;
  } catch (error) {
    logger.error('Erreur lors de la vérification de propriétaire:', error);
    return false;
  }
}

/**
 * Middleware de limitation de taux (rate limiting)
 */
export const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: {
    success: false,
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
};

/**
 * Middleware de validation des données d'entrée
 */
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error } = schema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Données d\'entrée invalides',
          code: 'VALIDATION_ERROR',
          details: error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }
      
      next();
      
    } catch (error) {
      logger.error('Erreur dans le middleware de validation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};
