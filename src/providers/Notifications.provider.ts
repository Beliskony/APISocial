import { inject, injectable } from "inversify";
import { NotificationsService } from "../services/Notifications.Service";
import { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";

@injectable()
export class NotificationsProvider {
    constructor(@inject(TYPES.NotificationsService) private notificationsService: NotificationsService) {}

    async createNotification(senderId: string, recipientId: string, type: 'like' | 'comment' | 'follow' | 'mention', content?: string, postId?: string): Promise<INotification> {
        return this.notificationsService.createNotification(senderId, recipientId, type, content || '', postId);
    }

    async getNotifications(userId: string): Promise<INotification[]> {
        return this.notificationsService.getNotifications(userId);
    }

    async markAsRead(notificationId: string): Promise<INotification | null> {
        return this.notificationsService.markAsRead(notificationId);
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationsService.getUnreadCount(userId);
    }

    async deleteNotification(notificationId: string): Promise<boolean> {
        return this.notificationsService.deleteNotification(notificationId);
    }

    async deleteAllUserNotifications(userId: string): Promise<void> {
        return this.notificationsService.deleteAllUserNotifications(userId);
    }
}
