import { injectable } from "inversify";
import mongoose from "mongoose";
import NotificationsModel, {INotification} from "../models/Notifications.model";
import UserModel from "../models/User.model";

@injectable()
export class NotificationsService {

    async createNotification(userId: string, type: string, content: string): Promise<INotification> {
        const newNotification = new NotificationsModel({
            user: userId,
            type,
            content,
        });
        const savedNotification = await newNotification.save();
        await savedNotification.populate('user', '_id username profilePicture');
        
        // Logique pour mettre à jour le nombre de notifications de l'utilisateur
        await UserModel.findByIdAndUpdate(userId, { $push: { notifications: savedNotification._id } }, { new: true });
        return savedNotification;
    }

    async getNotifications(userId: string): Promise<INotification[]> {
        return await NotificationsModel.find({ user: userId })
            .populate('user', '_id username profilePicture')
            .sort({ createdAt: -1 });
    }

    async markAsRead(notificationId: string): Promise<INotification | null> {
        return await NotificationsModel.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    }

    async getUnreadCount(userId: string): Promise<number> {
        const count = await NotificationsModel.countDocuments({ user: userId, read: false });
        return count;
    }
}