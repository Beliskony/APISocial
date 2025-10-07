import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { NotificationsProvider } from "../providers/Notifications.provider";
import { AuthRequest } from "../middlewares/Auth.Types";
import { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";

@injectable()
export class NotificationsController {
  constructor(
    @inject(TYPES.NotificationsProvider)
    private notificationsProvider: NotificationsProvider
  ) {}

  // ✅ Créer une notification
  async createNotification(req: AuthRequest, res: Response): Promise<void> {
    const senderId = req.user?._id;
    const { recipientId, type, content, postId } = req.body;

    if (!senderId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!recipientId || !type) {
      res.status(400).json({ message: "recipientId et type sont requis" });
      return;
    }

    try {
      const notification: INotification =
        await this.notificationsProvider.createNotification(
          senderId,
          recipientId,
          type,
          content,
          postId
        );

      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la création de la notification",
        error,
      });
    }
  }

  // ✅ Récupérer toutes les notifications (avec pagination)
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    try {
      const notifications =
        await this.notificationsProvider.getNotifications(userId, page, limit);
      res.status(200).json(notifications);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur lors du chargement des notifications", error });
    }
  }

  // ✅ Marquer une notification comme lue
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const notification = await this.notificationsProvider.getNotificationById(notificationId);

      if (!notification) {
        res.status(404).json({ message: "Notification introuvable" });
        return;
      }

      if (notification.recipient.toString() !== userId) {
        res.status(403).json({ message: "Accès interdit" });
        return;
      }

      const updated = await this.notificationsProvider.markAsRead(notificationId);
      res.status(200).json(updated);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur lors du marquage de la notification", error });
    }
  }

  // ✅ Marquer toutes les notifications comme lues
  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      await this.notificationsProvider.markAllAsRead(userId);
      res
        .status(200)
        .json({ message: "Toutes les notifications ont été marquées comme lues." });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur lors du marquage des notifications", error });
    }
  }

  // ✅ Compter les notifications non lues
  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const count = await this.notificationsProvider.getUnreadCount(userId);
      res.status(200).json({ unreadCount: count });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur lors du comptage des notifications", error });
    }
  }

  // ✅ Supprimer une notification
  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const notification = await this.notificationsProvider.getNotificationById(notificationId);

      if (!notification) {
        res.status(404).json({ message: "Notification introuvable" });
        return;
      }

      if (notification.recipient.toString() !== userId) {
        res.status(403).json({ message: "Accès interdit" });
        return;
      }

      const success = await this.notificationsProvider.deleteNotification(notificationId);

      if (!success) {
        res.status(404).json({ message: "Notification non trouvée" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur lors de la suppression de la notification", error });
    }
  }

  // ✅ Supprimer toutes les notifications d’un utilisateur
  async deleteAllUserNotifications(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      await this.notificationsProvider.deleteAllUserNotifications(userId);
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur lors de la suppression des notifications", error });
    }
  }
}
