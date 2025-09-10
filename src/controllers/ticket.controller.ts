// controllers/ticketController.ts
import { Request, Response } from 'express';
import {prisma} from '../lib/prisma';

export const ticketController = {
  // Créer un ticket
  async createTicket(req: Request, res: Response) {
    try {
      const { title, description, priority, type, createdById } = req.body;
      
      const ticket = await prisma.ticket.create({
        data: {
          title,
          description,
          priority: priority || 'MEDIUM',
          type: type || 'INCIDENT',
          createdBy: { connect: { id: createdById } }
        },
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
          }
        }
      });

      await prisma.notification.create({
        data: {
          type: "SUCCESS", 
          message: `${ticket.createdBy.firstName} ${ticket.createdBy.lastName} a créé le ticket ${title}`, 
          userId: createdById
        }
      })
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Erreur lors de la création du ticket' });
    }
  },

  // Obtenir tous les tickets avec filtres optionnels
  async getTickets(req: Request, res: Response) {
    try {
      const { status, priority, type, userId, page = 1, limit = 10 } = req.query;
      
      const where: any = {};
      
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (type) where.type = type;
      if (userId) where.createdById = userId;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          skip,
          take: Number(limit),
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
          orderBy: { createdAt: 'desc' }
        }),
        prisma.ticket.count({ where })
      ]);
      
      res.json({
        tickets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir un ticket par ID
  async getTicketById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const ticket = await prisma.ticket.findUnique({
        where: { id },
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
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket non trouvé' });
      }
      
      res.json(ticket);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
      return;
    }
  },

  // Mettre à jour un ticket
  async updateTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, status, priority, type } = req.body;
      
      const ticket = await prisma.ticket.update({
        where: { id },
        data: {
          title,
          description,
          status,
          priority,
          type
        },
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
          }
        }
      });

      await prisma.notification.create({
        data: {
          type: "INFO", 
          message: `${ticket.createdBy.firstName} ${ticket.createdBy.lastName} a modifié le ticket ${title}`, 
          userId: ticket.createdBy.id
        }
      })
      
      res.json(ticket);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Erreur de mise à jour' });
    }
  },

  // Supprimer un ticket
  async deleteTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const ticket = await prisma.ticket.delete({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
        }
      });

      await prisma.notification.create({
        data: {
          type: "WARNING", 
          message: `${ticket.createdBy.firstName} ${ticket.createdBy.lastName} a supprimé le ticket ${ticket.title}`, 
          userId: ticket.createdBy.id
        }
      })
      
      res.json({ message: 'Ticket supprimé avec succès' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Erreur de suppression' });
    }
  },

  // Changer le statut d'un ticket
  async updateTicketStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const ticket = await prisma.ticket.update({
        where: { id },
        data: { status },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      await prisma.notification.create({
        data: {
          type: "SUCCESS", 
          message: `${ticket.createdBy.firstName} ${ticket.createdBy.lastName} a modifié le status du ticket ${ticket.title}`, 
          userId: ticket.createdBy.id
        }
      })
      
      res.json(ticket);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Erreur de mise à jour du statut' });
    }
  },

  // Obtenir les tickets d'un utilisateur
  async getUserTickets(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;
      
      const where: any = { createdById: userId };
      if (status) where.status = status;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
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
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.ticket.count({ where })
      ]);
      
      res.json({
        tickets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};