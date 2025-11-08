// src/api/controllers/notifications.controller.ts
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { NotificationsProvider } from "../providers/Notifications.provider";
import { AuthRequest } from "../middlewares/auth";
import { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";
import { NotificationType } from "../services/Notifications.Service";


@injectable()
export class NotificationsController {
  constructor(
    @inject(TYPES.NotificationsProvider)
    private notificationsProvider: NotificationsProvider
  ) {}

  // ✅ Créer une notification - CORRIGÉ avec gestion des erreurs silencieuses
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

    // Valider le type de notification
    const validTypes: NotificationType[] = ['like', 'comment', 'follow', 'mention', 'new_post'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ 
        success: false,
        message: "Type de notification invalide" 
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
      // ✅ Gérer silencieusement les erreurs de notifications désactivées
      if (error.message.includes("Notifications désactivées") || 
          error.message.includes("Impossible de se notifier soi-même")) {
        res.status(200).json({
          success: true,
          message: "Notification non créée (préférences utilisateur ou auto-notification)",
          data: null
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la notification",
        error: error.message
      });
    }
  }

  // ✅ Récupérer toutes les notifications (avec pagination)
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: "Non autorisé" 
      });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    try {
      const result = await this.notificationsProvider.getUserNotifications(userId, page, limit);
      
      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          unreadCount: result.unreadCount,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page < Math.ceil(result.total / limit),
          hasPrev: page > 1
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

  // ✅ Marquer une notification comme lue - CORRIGÉ
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

    if (!notificationId) {
      res.status(400).json({ 
        success: false,
        message: "ID de notification requis" 
      });
      return;
    }

    try {
      // ✅ Utiliser la méthode principale (markAsRead au lieu de markAsReadForUser)
      const updated = await this.notificationsProvider.markAsRead(notificationId, userId);
      
      res.status(200).json({
        success: true,
        message: "Notification marquée comme lue",
        data: updated
      });
    } catch (error: any) {
      if (error.message.includes("Notification non trouvée")) {
        res.status(404).json({ 
          success: false,
          message: "Notification introuvable" 
        });
        return;
      }

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
      const result = await this.notificationsProvider.markAllAsRead(userId);
      
      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notifications ont été marquées comme lues`,
        data: result
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

  // ✅ Supprimer une notification - CORRIGÉ
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

    if (!notificationId) {
      res.status(400).json({ 
        success: false,
        message: "ID de notification requis" 
      });
      return;
    }

    try {
      // ✅ Utiliser la méthode principale (deleteNotification au lieu de deleteNotificationForUser)
      const success = await this.notificationsProvider.deleteNotification(notificationId, userId);

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
      const result = await this.notificationsProvider.deleteAllUserNotifications(userId);
      
      res.status(200).json({
        success: true,
        message: `${result.deletedCount} notifications ont été supprimées`,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression des notifications",
        error: error.message
      });
    }
  }

  // ✅ Récupérer les notifications par type - CORRIGÉ
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

    const validTypes: NotificationType[] = ['like', 'comment', 'follow', 'mention', 'new_post'];
    if (!type || !validTypes.includes(type as NotificationType)) {
      res.status(400).json({ 
        success: false,
        message: "Type de notification invalide" 
      });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    try {
      const result = await this.notificationsProvider.getNotificationsByType(
        userId, 
        type as NotificationType, 
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
          totalPages: Math.ceil(result.total / limit),
          hasNext: page < Math.ceil(result.total / limit),
          hasPrev: page > 1
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

  // ✅ Récupérer une notification spécifique
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

    if (!notificationId) {
      res.status(400).json({ 
        success: false,
        message: "ID de notification requis" 
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