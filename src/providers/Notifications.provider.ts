import { inject, injectable } from "inversify";
import { NotificationsService } from "../services/Notifications.Service";
import { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";


@injectable()
export class NotificationsProvider {
    constructor(@inject(TYPES.NotificationsService) private notificationsService: NotificationsService) {}

    async createNotification(userId: string, type: string, content: string): Promise<INotification> {
        return this.notificationsService.createNotification(userId, type, content);
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
}