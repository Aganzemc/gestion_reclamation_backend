// controllers/userController.ts
import { Request, Response } from 'express';
import {prisma} from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const userController = {
  // Créer un utilisateur
  async createUser(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || 'USER'
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
      
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: 'Erreur lors de la création' });
    }
  },

  // Obtenir tous les utilisateurs
  async getUsers(_req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          assignedTickets: true,
          tickets: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir un utilisateur par ID
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          assignedTickets: true,
          tickets: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true
            }
          }
        }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Mettre à jour un utilisateur
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, role, status } = req.body;
      
      const user = await prisma.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          role,
          status
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          updatedAt: true
        }
      });
      
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ error: 'Erreur de mise à jour' });
    }
  },

  // Supprimer (désactiver) un utilisateur
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const user = await prisma.user.update({
        where: { id },
        data: { status: 'INACTIVE' },
        select: {
          id: true,
          email: true,
          status: true
        }
      });
      
      res.json({ message: 'Utilisateur désactivé', user });
    } catch (error) {
      res.status(400).json({ error: 'Erreur de suppression' });
    }
  }
};