// controllers/notificationController.ts
import { Request, Response } from 'express';
import {prisma} from '../lib/prisma';

export const notificationController = {
  // Créer une notification
  async createNotification(req: Request, res: Response) {
    try {
      const { type, message, userId } = req.body;
      
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const notification = await prisma.notification.create({
        data: {
          type,
          message,
          user: { connect: { id: userId } }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      return res.status(201).json(notification);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur lors de la création de la notification' });
    }
  },

  // Obtenir toutes les notifications avec filtres optionnels
  async getNotifications(req: Request, res: Response) {
    try {
      const { userId, type, isRead, page = 1, limit = 20 } = req.query;
      
      const where: any = {};
      
      if (userId) where.userId = userId as string;
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead === 'true';
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [notifications, _total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where })
      ]);
      
      return res.json(notifications);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir une notification par ID
  async getNotificationById(req: Request, res: Response) {
    try {
      const { id! } = req.params;
      
      const notification = await prisma.notification.findUnique({
        where: {id},
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification non trouvée' });
      }
      
      return res.json(notification);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Mettre à jour une notification
  async updateNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type, message, isRead } = req.body;
      
      const notification = await prisma.notification.update({
        where: { id },
        data: {
          type,
          message,
          isRead
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      return res.json(notification);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur de mise à jour de la notification' });
    }
  },

  // Supprimer une notification
  async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await prisma.notification.delete({
        where: { id }
      });
      
      return res.json({ message: 'Notification supprimée avec succès' });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur de suppression de la notification' });
    }
  },

  // Obtenir les notifications d'un utilisateur spécifique
  async getUserNotifications(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { isRead, type, page = 1, limit = 20 } = req.query;
      
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId! }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const where: any = { userId };
      
      if (isRead !== undefined) where.isRead = isRead === 'true';
      if (type) where.type = type;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [notifications, _total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where })
      ]);
      
      return res.json(notifications);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Marquer une notification comme lue
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      return res.json(notification);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur lors du marquage comme lu' });
    }
  },

  // Marquer une notification comme non lue
  async markAsUnread(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: false },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      return res.json(notification);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur lors du marquage comme non lu' });
    }
  },

  // Marquer toutes les notifications comme lues pour un utilisateur
  async markAllAsRead(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const result = await prisma.notification.updateMany({
        where: { 
          userId,
          isRead: false 
        },
        data: { isRead: true }
      });
      
      return res.json({ 
        message: `${result.count} notification(s) marquée(s) comme lue(s)`,
        count: result.count 
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur lors du marquage des notifications' });
    }
  },

  // Obtenir le nombre de notifications non lues pour un utilisateur
  async getUnreadCount(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId! }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const count = await prisma.notification.count({
        where: { 
          userId: userId!,
          isRead: false 
        }
      });
      
      return res.json({ count });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir des statistiques sur les notifications
  // controllers/notificationController.ts (version corrigée)
async getNotificationStats(req: Request, res: Response) {
  try {
    const { userId, startDate, endDate } = req.query;
    
    const where: any = {};
    
    if (userId) where.userId = userId as string;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    // const stats = await prisma.notification.groupBy({
    //   by: ['type', 'isRead'],
    //   where,
    //   _count: {
    //     id: true
    //   }
    // });
    
    // Initialiser formattedStats avec une structure correcte
    const formattedStats = {
      total: 0,
      byType: {} as {
        [key: string]: {
          read: number;
          unread: number;
          total: number;
        };
      },
      read: 0,
      unread: 0
    };
    
    // Compter le total général
    formattedStats.total = await prisma.notification.count({ where });
    
    // Traiter chaque statistique
    // stats.forEach((stat: { type: string | number; isRead: any; _count: { id: number; }; }) => {
    //   // Initialiser l'entrée pour ce type si elle n'existe pas
    //   if (!formattedStats.byType[stat.type]) {
    //     formattedStats.byType[stat.type] = { read: 0, unread: 0, total: 0 };
    //   }
      
    //   if (stat.isRead) {
    //     formattedStats.byType[stat.type].read += stat._count.id;
    //     formattedStats.read += stat._count.id;
    //   } else {
    //     formattedStats.byType[stat.type].unread += stat._count.id;
    //     formattedStats.unread += stat._count.id;
    //   }
      
    //   // Mettre à jour le total pour ce type
    //   formattedStats.byType[stat.type].total += stat._count.id;
    // });
    
    res.json(formattedStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
}