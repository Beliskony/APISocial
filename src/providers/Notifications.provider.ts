// src/core/providers/NotificationsProvider.ts
import { inject, injectable } from "inversify";
import { NotificationsService, NotificationType } from "../services/Notifications.Service";
import NotificationsModel, { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";
import UserModel from "../models/User.model";

@injectable()
export class NotificationsProvider {
    constructor(
        @inject(TYPES.NotificationsService)
        private notificationsService: NotificationsService
    ) {}

    /**
     * ✅ Créer une notification - NOUVELLE SIGNATURE
     */
    async createNotification(
        senderId: string,
        recipientId: string,
        type: NotificationType,
        content?: string,
        postId?: string
    ): Promise<INotification> {
        return this.notificationsService.createNotification({
            sender: senderId,
            recipient: recipientId,
            type,
            content,
            post: postId
        });
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

    // 🔄 MÉTHODES DE COMPATIBILITÉ

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
     * 🟡 Méthode de compatibilité - récupérer une notification par ID
     */
    async getNotificationById(notificationId: string): Promise<INotification | null> {
        try {
            return await NotificationsModel.findById(notificationId)
                .populate('sender', 'username profile.profilePicture')
                .populate('post', 'text media');
        } catch (error) {
            console.error('❌ Erreur récupération notification par ID:', error);
            return null;
        }
    }

    /**
     * 🟡 Méthode de compatibilité - alias pour markAsRead
     */
    async markAsReadForUser(notificationId: string, userId: string): Promise<INotification> {
        return this.notificationsService.markAsRead(notificationId, userId);
    }

    /**
     * 🟡 Méthode de compatibilité - alias pour deleteNotification
     */
    async deleteNotificationForUser(notificationId: string, userId: string): Promise<boolean> {
        return this.notificationsService.deleteNotification(notificationId, userId);
    }

    /**
     * 🟡 Méthode de compatibilité - supprimer toutes les notifications d'un utilisateur
     */
    async deleteAllUserNotifications(userId: string): Promise<{ deletedCount: number }> {
        try {
            const result = await NotificationsModel.deleteMany({ recipient: userId });
            console.log(`🗑️ ${result.deletedCount} notifications supprimées pour l'utilisateur ${userId}`);
            return { deletedCount: result.deletedCount || 0 };
        } catch (error) {
            console.error('❌ Erreur suppression toutes les notifications:', error);
            throw new Error('Impossible de supprimer toutes les notifications');
        }
    }

    // ✅ MÉTHODES DE PRÉFÉRENCES AMÉLIORÉES

    /**
     * ✅ Récupérer les préférences de notifications d'un utilisateur
     */
    async getPreferences(userId: string): Promise<any> {
        try {
            return await this.notificationsService.getUserNotificationPreferences(userId);
        } catch (error) {
            console.error('❌ Erreur récupération préférences:', error);
            // Retourner les préférences par défaut en cas d'erreur
            return this.getDefaultPreferences();
        }
    }

    /**
     * ✅ Mettre à jour les préférences de notifications
     */
    async updateNotificationPreferences(userId: string, updates: Partial<any>): Promise<any> {
        try {
            return await this.notificationsService.updateUserNotificationPreferences(userId, updates);
        } catch (error) {
            console.error('❌ Erreur mise à jour préférences:', error);
            throw error;
        }
    }

    /**
     * ✅ Vérifier si un utilisateur peut recevoir un type de notification
     */
    async canReceiveNotification(userId: string, type: NotificationType): Promise<boolean> {
        try {
            const user = await UserModel.findById(userId).select('preferences.notifications');
            if (!user) return false;

            const preferences = user.preferences?.notifications;
            if (!preferences) return true;

            // Vérifier les notifications globales
            if (preferences.push === false) return false;

            // Mapping des types
            const preferenceMapping: Record<NotificationType, keyof typeof preferences> = {
                'like': 'postLikes',
                'comment': 'postComments',
                'follow': 'newFollower',
                'mention': 'mentions',
                'new_post': 'newPosts'
            };

            const preferenceKey = preferenceMapping[type];
            return preferences[preferenceKey] !== false;
        } catch (error) {
            console.error('❌ Erreur vérification préférences:', error);
            return true; // Par défaut autoriser en cas d'erreur
        }
    }

    // 🆕 NOUVELLES MÉTHODES UTILES

    /**
     * 🆕 Récupérer les dernières notifications non lues
     */
    async getLatestUnreadNotifications(userId: string, limit: number = 10): Promise<INotification[]> {
        try {
            const notifications = await NotificationsModel.find({
                recipient: userId,
                isRead: false
            })
            .populate('sender', 'username profile.profilePicture')
            .populate('post', 'text media')
            .sort({ createdAt: -1 })
            .limit(limit);

            return notifications;
        } catch (error) {
            console.error('❌ Erreur récupération dernières notifications non lues:', error);
            return [];
        }
    }

    /**
     * 🆕 Statistiques des notifications
     */
    async getNotificationStats(userId: string): Promise<{
        total: number;
        unread: number;
        read: number;
        byType: Record<NotificationType, number>;
    }> {
        try {
            const [total, unread, read, byType] = await Promise.all([
                NotificationsModel.countDocuments({ recipient: userId }),
                NotificationsModel.countDocuments({ recipient: userId, isRead: false }),
                NotificationsModel.countDocuments({ recipient: userId, isRead: true }),
                this.getNotificationsCountByType(userId)
            ]);

            return {
                total,
                unread,
                read,
                byType
            };
        } catch (error) {
            console.error('❌ Erreur statistiques notifications:', error);
            throw new Error('Impossible de récupérer les statistiques des notifications');
        }
    }

    /**
     * 🆕 Comptage des notifications par type
     */
    private async getNotificationsCountByType(userId: string): Promise<Record<NotificationType, number>> {
        const types: NotificationType[] = ['like', 'comment', 'follow', 'mention', 'new_post'];
        const counts: Record<NotificationType, number> = {
            'like': 0,
            'comment': 0,
            'follow': 0,
            'mention': 0,
            'new_post': 0
        };

        try {
            const results = await Promise.all(
                types.map(type => 
                    NotificationsModel.countDocuments({ 
                        recipient: userId, 
                        type 
                    })
                )
            );

            types.forEach((type, index) => {
                counts[type] = results[index];
            });

            return counts;
        } catch (error) {
            console.error('❌ Erreur comptage par type:', error);
            return counts;
        }
    }

    /**
     * 🆕 Préférences par défaut
     */
    private getDefaultPreferences() {
        return {
            email: false,
            push: true,
            sms: false,
            newFollower: true,
            newMessage: true,
            postLikes: true,
            postComments: true,
            mentions: true,
            newPosts: true
        };
    }
}