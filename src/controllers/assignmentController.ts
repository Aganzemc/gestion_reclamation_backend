// controllers/assignmentController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const assignmentController = {
  // Assigner un ticket à un utilisateur
  async createAssignment(req: Request, res: Response) {
    try {
      const { ticketId, userId } = req.body;

      // Vérifier que le ticket existe
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket non trouvé' });
      }

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier si l'assignation existe déjà
      const existingAssignment = await prisma.ticketAssignment.findUnique({
        where: {
          ticketId_userId: {
            ticketId,
            userId
          }
        }
      });

      if (existingAssignment) {
        return res.status(409).json({ error: 'Cette assignation existe déjà' });
      }

      const assignment = await prisma.ticketAssignment.create({
        data: {
          ticket: { connect: { id: ticketId } },
          user: { connect: { id: userId } }
        },
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      await prisma.notification.create({
        data: {
          type: "WARNING",
          message: `Le ticket ${assignment.ticket.title} vous a été assigné`,
          userId: assignment.user.id
        }
      })

      return res.status(201).json(assignment);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur lors de la création de l\'assignation' });
    }
  },

  // Obtenir toutes les assignations avec filtres optionnels
  async getAssignments(req: Request, res: Response) {
    try {
      const { ticketId, userId, page = 1, limit = 20 } = req.query;

      const where: any = {};

      if (ticketId) where.ticketId = ticketId as string;
      if (userId) where.userId = userId as string;

      const skip = (Number(page) - 1) * Number(limit);

      const [assignments, total] = await Promise.all([
        prisma.ticketAssignment.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            ticket: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }),
        prisma.ticketAssignment.count({ where })
      ]);

      return res.json({
        assignments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir une assignation par ID
  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      
      const assignment = await prisma.ticketAssignment.findUnique({
        where: { id },
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              type: true,
              createdAt: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              status: true
            }
          }
        }
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Assignation non trouvée' });
      }

      return res.json(assignment);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Supprimer une assignation (désassigner)
  async deleteAssignment(req: Request, res: Response) {
    try {       
      const { id } = req.params;

      await prisma.ticketAssignment.delete({
        where: { id }
      });

      res.json({ message: 'Assignation supprimée avec succès' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Erreur de suppression de l\'assignation' });
    }
  },

  // Obtenir les assignations d'un ticket spécifique
  async getTicketAssignments(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Vérifier que le ticket existe
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket non trouvé' });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [assignments, total] = await Promise.all([
        prisma.ticketAssignment.findMany({
          where: { ticketId: ticketId! },
          skip,
          take: Number(limit),
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }),
        prisma.ticketAssignment.count({ where: { ticketId: ticketId! } })
      ]);

      return res.json({
        assignments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les assignations d'un utilisateur spécifique
  async getUserAssignments(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId! }
      });

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [assignments, total] = await Promise.all([
        prisma.ticketAssignment.findMany({
          where: { userId: userId! },
          skip,
          take: Number(limit),
          include: {
            ticket: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                assignedTo: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                },
              },
            }
          },
          orderBy: { assignedAt: 'desc' }
        }),
        prisma.ticketAssignment.count({ where: { userId: userId! } })
      ]);

      return res.json({
        assignments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Désassigner un utilisateur d'un ticket spécifique
  async removeUserFromTicket(req: Request, res: Response) {
    try {
      const { ticketId, userId } = req.params;

      // Vérifier que l'assignation existe
      const assignment = await prisma.ticketAssignment.findUnique({
        where: {
          ticketId_userId: {
            ticketId: ticketId!,
            userId: userId!
          }
        }
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Assignation non trouvée' });
      }

      await prisma.ticketAssignment.delete({
        where: { id: assignment.id }
      });

      return res.json({ message: 'Utilisateur désassigné du ticket avec succès' });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erreur lors de la désassignation' });
    }
  },

  // Obtenir des statistiques sur les assignations
  async getAssignmentStats(req: Request, res: Response) {
    try {
      const { userId, startDate, endDate } = req.query;

      const where: any = {};

      if (userId) where.userId = userId as string;

      if (startDate || endDate) {
        where.assignedAt = {};
        if (startDate) where.assignedAt.gte = new Date(startDate as string);
        if (endDate) where.assignedAt.lte = new Date(endDate as string);
      }

      const stats = await prisma.ticketAssignment.groupBy({
        by: ['userId'],
        where,
        _count: {
          id: true
        }
      });

      // Récupérer les informations utilisateur pour chaque userId
      const userIds = stats.map((stat: any) => stat.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true }
      });

      // Formater les résultats
      const formattedStats = stats.map((stat: any) => {
        const user = users.find(u => u.id === stat.userId);
        return {
          userId: stat.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu',
          assignmentCount: stat._count.id
        };
      });

      res.json({ stats: formattedStats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};