// services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { LoginCredentials, RegisterData, JwtPayload, AuthResponse, User } from '../interfaces/auth.interface';

const prisma = new PrismaClient();
const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const authService = {
  // Hasher un mot de passe
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  },

  // Vérifier un mot de passe
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  // Générer les tokens JWT
  generateTokens(payload: JwtPayload): { token: string; refreshToken: string } {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { token, refreshToken };
  },

  // Vérifier un token JWT
  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  },

  // Vérifier un refresh token
  verifyRefreshToken(refreshToken: string): JwtPayload {
    return jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
  },

  // Créer une session en base de données
  async createSession(userId: string, token: string, refreshToken: string, userAgent?: string, ipAddress?: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours pour le refresh token

    await prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
        expiresAt
      }
    });
  },

  // Révoquer une session
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });
  },

  // Révoquer toutes les sessions d'un utilisateur
  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { 
        userId,
        revokedAt: null 
      },
      data: { revokedAt: new Date() }
    });
  },

  // Vérifier si une session est valide
  async isValidSession(sessionId: string, _token: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { revokedAt: true, expiresAt: true }
    });

    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      return false;
    }

    return true;
  },

  // Inscription d'un nouvel utilisateur
  async register(userData: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = userData;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await this.hashPassword(password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // Générer les tokens
    const payload: JwtPayload = {
      userId: user.id,
      sessionId: '', // Será rempli après la création de la session
      email: user.email,
      role: user.role
    };

    const { token, refreshToken } = this.generateTokens(payload);

    // Créer la session en base
    await this.createSession(user.id, token, refreshToken);

    return {
      user,
      token,
      refreshToken
    };
  },

  // Connexion d'un utilisateur
  async login(credentials: LoginCredentials, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le statut de l'utilisateur
    if (user.status !== 'ACTIVE') {
      throw new Error('Votre compte est désactivé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Générer les tokens
    const payload: JwtPayload = {
      userId: user.id,
      sessionId: '', // Será rempli après la création de la session
      email: user.email,
      role: user.role
    };

    const { token, refreshToken } = this.generateTokens(payload);

    // Créer la session en base
    await this.createSession(user.id, token, refreshToken, userAgent, ipAddress);

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  },

  // Rafraîchir le token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Vérifier le refresh token
      const payload = this.verifyRefreshToken(refreshToken);

      // Vérifier que la session existe et est valide
      const session = await prisma.session.findFirst({
        where: { 
          refreshToken,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        throw new Error('Session invalide ou expirée');
      }

      // Vérifier que l'utilisateur existe toujours
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, status: true }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('Utilisateur invalide');
      }

      // Générer de nouveaux tokens
      const newPayload: JwtPayload = {
        userId: user.id,
        sessionId: session.id,
        email: user.email,
        role: user.role
      };

      const { token: newToken, refreshToken: newRefreshToken } = this.generateTokens(newPayload);

      // Mettre à jour la session avec le nouveau refresh token
      await prisma.session.update({
        where: { id: session.id },
        data: { 
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
        }
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Token de rafraîchissement invalide');
    }
  },

  // Déconnexion
  async logout(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId);
  },

  // Déconnexion de tous les appareils
  async logoutAllDevices(userId: string): Promise<void> {
    await this.revokeAllUserSessions(userId);
  },

  // Vérifier la validité d'un token
  async verifyAuth(token: string): Promise<{ isValid: boolean; user?: User; sessionId?: string }> {
    try {
      const payload = this.verifyToken(token);
      
      const isValid = await this.isValidSession(payload.sessionId, token);
      if (!isValid) {
        return { isValid: false };
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        return { isValid: false };
      }

      return { isValid: true, user, sessionId: payload.sessionId };
    } catch (error) {
      return { isValid: false };
    }
  }
};