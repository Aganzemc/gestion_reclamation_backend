// controllers/authController.ts
import { Request, Response } from 'express';
import { authService } from '../services/authServices';
import { LoginCredentials, RegisterData } from '../interfaces/auth.interface';

export const authController = {
  // Inscription
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName }: RegisterData = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName
      });

      return res.status(201).json({
        message: 'Inscription réussie',
        data: result
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Connexion
  async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginCredentials = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.login(
        { email, password },
        userAgent,
        ipAddress
      );

      return res.json({
        message: 'Connexion réussie',
        data: result
      });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  },

  // Rafraîchir le token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token requis' });
      }

      const result = await authService.refreshToken(refreshToken);

      return res.json({
        message: 'Token rafraîchi avec succès',
        data: result
      });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  },

  // Déconnexion
  async logout(req: Request, res: Response) {
    try {
      // Le middleware d'authentification devrait ajouter sessionId à req
      const sessionId = (req as any).sessionId;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session non trouvée' });
      }

      await authService.logout(sessionId);

      return res.json({ message: 'Déconnexion réussie' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Déconnexion de tous les appareils
  async logoutAll(req: Request, res: Response) {
    try {
      // Le middleware d'authentification devrait ajouter userId à req
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(400).json({ error: 'Utilisateur non trouvé' });
      }

      await authService.logoutAllDevices(userId);

      return res.json({ message: 'Déconnexion de tous les appareils réussie' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Vérifier l'état de l'authentification
  async verify(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token non fourni' });
      }

      const token = authHeader.substring(7);
      const { isValid, user } = await authService.verifyAuth(token);

      if (!isValid || !user) {
        return res.status(401).json({ error: 'Token invalide' });
      }

      return res.json({
        message: 'Token valide',
        data: { user }
      });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  },

  // Profil de l'utilisateur connecté
  async getProfile(req: Request, res: Response) {
    try {
      // Le middleware d'authentification devrait ajouter user à req
      const user = (req as any).user;

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      return res.json({
        message: 'Profil récupéré avec succès',
        data: { user }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getUserSession(req: Request, res: Response) {
    const { token } = req.params;

    const session = await prisma?.session.findFirst({
      where: {token: token!}
    })
    return res.json(session);
  }
};