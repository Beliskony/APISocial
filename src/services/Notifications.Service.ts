// src/core/services/notifications.service.ts
import { injectable } from "inversify";
import NotificationModel, { INotification } from "../models/Notifications.model";
import UserModel from "../models/User.model";

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'new_post';

export interface CreateNotificationData {
  sender: string;
  recipient: string;
  type: NotificationType;
  post?: string;
  content?: string;
}

@injectable()
export class NotificationsService {
  
  async createNotification(
    senderId: string,
    recipientId: string,
    type: NotificationType,
    content?: string,
    postId?: string
  ): Promise<INotification> {
    // Vérifier que l'expéditeur et le destinataire existent
    const [sender, recipient] = await Promise.all([
      UserModel.findById(senderId),
      UserModel.findById(recipientId)
    ]);

    if (!sender || !recipient) {
      throw new Error("Expéditeur ou destinataire non trouvé");
    }

    // Ne pas notifier si l'utilisateur se notifie lui-même
    if (senderId === recipientId) {
      throw new Error("Impossible de se notifier soi-même");
    }

    const notificationData: any = {
      sender: senderId,
      recipient: recipientId,
      type,
      content: content || this.generateNotificationContent(type, sender.username),
      isRead: false
    };

    // Ajouter la référence au post si fournie
    if (postId) {
      notificationData.post = postId;
    }

    const notification = new NotificationModel(notificationData);
    return await notification.save();
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{ notifications: INotification[], total: number, unreadCount: number }> {
    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find({ recipient: userId })
        .populate('sender', 'username profilePicture')
        .populate('post', 'text media')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      
      NotificationModel.countDocuments({ recipient: userId }),
      
      NotificationModel.countDocuments({ 
        recipient: userId, 
        isRead: false 
      })
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await NotificationModel.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw new Error("Notification non trouvée");
    }

    notification.isRead = true;
    return await notification.save();
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await NotificationModel.updateMany(
      { 
        recipient: userId, 
        isRead: false 
      },
      { 
        isRead: true 
      }
    );

    return { modifiedCount: result.modifiedCount || 0 };
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await NotificationModel.deleteOne({
      _id: notificationId,
      recipient: userId
    });

    return result.deletedCount > 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await NotificationModel.countDocuments({
      recipient: userId,
      isRead: false
    });
  }

  // 🆕 Récupérer les notifications par type
  async getNotificationsByType(userId: string, type: NotificationType, page: number = 1, limit: number = 20): Promise<{ notifications: INotification[], total: number }> {
    const [notifications, total] = await Promise.all([
      NotificationModel.find({ 
        recipient: userId,
        type 
      })
        .populate('sender', 'username profile.profilePicture')
        .populate('post', 'text media')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      
      NotificationModel.countDocuments({ 
        recipient: userId,
        type 
      })
    ]);

    return { notifications, total };
  }

  // 🆕 Supprimer les anciennes notifications (nettoyage)
  async cleanupOldNotifications(daysOld: number = 30): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await NotificationModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true // Ne supprimer que les notifications lues
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  // 🔧 Méthode privée pour générer le contenu de notification
  private generateNotificationContent(type: NotificationType, username: string): string {
    switch (type) {
      case 'like':
        return `${username} a aimé votre publication`;
      case 'comment':
        return `${username} a commenté votre publication`;
      case 'follow':
        return `${username} vous suit maintenant`;
      case 'mention':
        return `${username} vous a mentionné dans une publication`;
      case 'new_post':
        return `${username} a publié un nouveau post`;
      default:
        return `Nouvelle notification de ${username}`;
    }
  }
}