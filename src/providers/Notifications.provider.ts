import { inject, injectable } from "inversify";
import { NotificationsService, NotificationType } from "../services/Notifications.Service";
import { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";

@injectable()
export class NotificationsProvider {
    constructor(
        @inject(TYPES.NotificationsService)
        private notificationsService: NotificationsService
    ) {}

    /**
     * ✅ Créer une notification
     */
    async createNotification(
        senderId: string,
        recipientId: string,
        type: NotificationType,
        content?: string,
        postId?: string
    ): Promise<INotification> {
        return this.notificationsService.createNotification(
            senderId, 
            recipientId, 
            type, 
            content, 
            postId
        );
    }

    /**
     * ✅ Récupérer les notifications d'un utilisateur avec pagination
     */
    async getUserNotifications(
        userId: string, 
        page: number = 1, 
        limit: number = 20
    ): Promise<{ notifications: INotification[], total: number, unreadCount: number }> {
        return this.notificationsService.getUserNotifications(userId, page, limit);
    }

    /**
     * ✅ Marquer une notification comme lue
     */
    async markAsRead(notificationId: string, userId: string): Promise<INotification> {
        return this.notificationsService.markAsRead(notificationId, userId);
    }

    /**
     * ✅ Marquer toutes les notifications comme lues
     */
    async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
        return this.notificationsService.markAllAsRead(userId);
    }

    /**
     * ✅ Supprimer une notification
     */
    async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
        return this.notificationsService.deleteNotification(notificationId, userId);
    }

    /**
     * ✅ Récupérer le nombre de notifications non lues
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationsService.getUnreadCount(userId);
    }

    /**
     * ✅ Récupérer les notifications par type
     */
    async getNotificationsByType(
        userId: string, 
        type: NotificationType, 
        page: number = 1, 
        limit: number = 20
    ): Promise<{ notifications: INotification[], total: number }> {
        return this.notificationsService.getNotificationsByType(userId, type, page, limit);
    }

    /**
     * ✅ Nettoyer les anciennes notifications
     */
    async cleanupOldNotifications(daysOld: number = 30): Promise<{ deletedCount: number }> {
        return this.notificationsService.cleanupOldNotifications(daysOld);
    }

    // 🔄 MÉTHODES DE COMPATIBILITÉ (si tu as d'autres parties du code qui les utilisent)

    /**
     * 🟡 Méthode de compatibilité - utilise getUserNotifications avec page 1
     */
    async getNotifications(userId: string): Promise<INotification[]> {
        const result = await this.notificationsService.getUserNotifications(userId, 1, 50);
        return result.notifications;
    }

    /**
     * 🟡 Méthode de compatibilité - alias pour getUserNotifications
     */
    async getNotificationsPaginated(
        userId: string, 
        page: number = 1, 
        limit: number = 20
    ): Promise<{ notifications: INotification[], total: number, unreadCount: number }> {
        return this.notificationsService.getUserNotifications(userId, page, limit);
    }

    /**
     * 🟡 Méthode de compatibilité - à implémenter si nécessaire
     */
    async getNotificationById(notificationId: string): Promise<INotification | null> {
        // Tu peux implémenter cette méthode dans le service si besoin
        throw new Error("Méthode non implémentée - utilise les autres méthodes");
    }

    /**
     * 🟡 Méthode de compatibilité - alias pour markAsRead
     */
    async markAsReadForUser(notificationId: string, userId: string): Promise<INotification> {
        return this.notificationsService.markAsRead(notificationId, userId);
    }

    /**
     * 🟡 Méthode de compatibilité - à implémenter si nécessaire
     */
    async deleteNotificationForUser(notificationId: string, userId: string): Promise<boolean> {
        return this.notificationsService.deleteNotification(notificationId, userId);
    }

    /**
     * 🟡 Méthode de compatibilité - à implémenter si nécessaire
     */
    async deleteAllUserNotifications(userId: string): Promise<void> {
        // Tu peux implémenter cette méthode dans le service si besoin
        throw new Error("Méthode non implémentée");
    }
}