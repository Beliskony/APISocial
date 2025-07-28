import { Request, Response } from "express";
import { inject } from "inversify";
import { NotificationsProvider } from "../providers/Notifications.provider";
import { AuthRequest } from "../middlewares/Auth.Types";
import { INotification } from "../models/Notifications.model";
import { TYPES } from "../config/TYPES";


export class NotificationsController {
    constructor(@inject(TYPES.NotificationsProvider) private notificationsProvider: NotificationsProvider) {}

    async createNotification(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { type, content } = req.body;

        try {
            const notification = await this.notificationsProvider.createNotification(userId, type, content);
            res.status(201).json(notification);
        } catch (error) {
            res.status(500).json({ message: 'Error creating notification', error });
        }
    }

    async getNotifications(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        try {
            const notifications: INotification[] = await this.notificationsProvider.getNotifications(userId);
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching notifications', error });
        }
    }

    async markAsRead(req: Request, res: Response): Promise<void> {
        const { notificationId } = req.params;

        try {
            const updatedNotification = await this.notificationsProvider.markAsRead(notificationId);
            if (!updatedNotification) {
                res.status(404).json({ message: 'Notification not found' });
                return;
            }
            res.status(200).json(updatedNotification);
        } catch (error) {
            res.status(500).json({ message: 'Error marking notification as read', error });
        }
    }

    async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        try {
            const count = await this.notificationsProvider.getUnreadCount(userId);
            res.status(200).json({ unreadCount: count });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching unread count', error });
        }
    }
}