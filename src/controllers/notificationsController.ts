// src/api/controllers/notifications.controller.ts
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { NotificationsProvider } from "../providers/Notifications.provider";
import { AuthRequest } from "../middlewares/auth";
import { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";

@injectable()
export class NotificationsController {
  constructor(
    @inject(TYPES.NotificationsProvider)
    private notificationsProvider: NotificationsProvider
  ) {}

  // ✅ Créer une notification - CORRIGÉ avec type exporté
  async createNotification(req: AuthRequest, res: Response): Promise<void> {
    const senderId = req.user?._id;
    const { recipientId, type, content, postId } = req.body;

    if (!senderId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    if (!recipientId || !type) {
      res.status(400).json({ 
        success: false,
        message: "recipientId et type sont requis" 
      });
      return;
    }

    try {
      const notification: INotification = await this.notificationsProvider.createNotification(
        senderId,
        recipientId,
        type,
        content,
        postId
      );

      res.status(201).json({
        success: true,
        message: "Notification créée avec succès",
        data: notification
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la notification",
        error: error.message
      });
    }
  }

  // ✅ Récupérer toutes les notifications (avec pagination) - CORRIGÉ
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    try {
      // Utiliser la nouvelle méthode paginée
      const result = await this.notificationsProvider.getNotificationsPaginated(userId, page, limit);
      
      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          unreadCount: result.unreadCount,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du chargement des notifications",
        error: error.message
      });
    }
  }

  // ✅ Marquer une notification comme lue - CORRIGÉ avec sécurité
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    try {
      // Utiliser la méthode sécurisée qui vérifie le propriétaire
      const updated = await this.notificationsProvider.markAsReadForUser(notificationId, userId);
      
      if (!updated) {
        res.status(404).json({ 
          success: false,
          message: "Notification introuvable ou accès non autorisé" 
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Notification marquée comme lue",
        data: updated
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du marquage de la notification",
        error: error.message
      });
    }
  }

  // ✅ Marquer toutes les notifications comme lues
  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    try {
      await this.notificationsProvider.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: "Toutes les notifications ont été marquées comme lues"
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du marquage des notifications",
        error: error.message
      });
    }
  }

  // ✅ Compter les notifications non lues
  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    try {
      const count = await this.notificationsProvider.getUnreadCount(userId);
      res.status(200).json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du comptage des notifications",
        error: error.message
      });
    }
  }

  // ✅ Supprimer une notification - CORRIGÉ avec sécurité
  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    try {
      // Utiliser la méthode sécurisée qui vérifie le propriétaire
      const success = await this.notificationsProvider.deleteNotificationForUser(notificationId, userId);

      if (!success) {
        res.status(404).json({ 
          success: false,
          message: "Notification introuvable ou accès non autorisé" 
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Notification supprimée avec succès"
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la notification",
        error: error.message
      });
    }
  }

  // ✅ Supprimer toutes les notifications d'un utilisateur
  async deleteAllUserNotifications(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    try {
      await this.notificationsProvider.deleteAllUserNotifications(userId);
      res.status(200).json({
        success: true,
        message: "Toutes les notifications ont été supprimées"
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression des notifications",
        error: error.message
      });
    }
  }

  // 🆕 Récupérer les notifications par type
  async getNotificationsByType(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;
    const { type } = req.params;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    if (!type || !['like', 'comment', 'follow', 'new_post', 'mention'].includes(type)) {
      res.status(400).json({ 
        success: false,
        message: "Type de notification invalide" 
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    try {
      const result = await this.notificationsProvider.getNotificationsByType(
        userId, 
        type as any, 
        page, 
        limit
      );

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du chargement des notifications",
        error: error.message
      });
    }
  }

  // 🆕 Récupérer une notification spécifique
  async getNotificationById(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    try {
      const notification = await this.notificationsProvider.getNotificationById(notificationId);

      if (!notification) {
        res.status(404).json({ 
          success: false,
          message: "Notification introuvable" 
        });
        return;
      }

      // Vérifier que l'utilisateur est le destinataire
      if (notification.recipient.toString() !== userId) {
        res.status(403).json({ 
          success: false,
          message: "Accès non autorisé à cette notification" 
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la notification",
        error: error.message
      });
    }
  }
}