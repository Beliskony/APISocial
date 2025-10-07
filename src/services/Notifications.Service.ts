import { injectable } from "inversify";
import mongoose from "mongoose";
import NotificationsModel, { INotification } from "../models/Notifications.model";
import UserModel from "../models/User.model";

@injectable()
export class NotificationsService {

    // Créer une notification
    async createNotification(senderId: string, recipientId: string, type: 'like' | 'comment' | 'follow' | 'new_post', content?: string, postId?: string): Promise<INotification> {
        const newNotification = new NotificationsModel({
            sender: new mongoose.Types.ObjectId(senderId),
            recipient: new mongoose.Types.ObjectId(recipientId),
            type,
            content,
            post: postId ? new mongoose.Types.ObjectId(postId) : undefined,
            isRead: false
        });

        const savedNotification = await newNotification.save();
        await savedNotification.populate('sender', '_id username profilePicture');

        // Optionnel : ajouter la référence à l'utilisateur destinataire
        await UserModel.findByIdAndUpdate(recipientId, { $push: { notifications: savedNotification._id } });

        return savedNotification;
    }

    // Récupérer toutes les notifications d'un utilisateur
    async getNotifications(userId: string): Promise<INotification[]> {
        return await NotificationsModel.find({ recipient: userId })
            .populate('sender', '_id username profilePicture')
            .populate('post', '_id text media') // si tu veux inclure les infos du post
            .sort({ createdAt: -1 });
    }

    // Marquer une notification comme lue
    async markAsRead(notificationId: string): Promise<INotification | null> {
        return await NotificationsModel.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    }

    // Compter les notifications non lues
    async getUnreadCount(userId: string): Promise<number> {
        return await NotificationsModel.countDocuments({ recipient: userId, isRead: false });
    }

    // Supprimer une notification
    async deleteNotification(notificationId: string): Promise<boolean> {
        const deleted = await NotificationsModel.findByIdAndDelete(notificationId);
        return !!deleted;
    }

    // Supprimer toutes les notifications d'un utilisateur
    async deleteAllUserNotifications(userId: string): Promise<void> {
        await NotificationsModel.deleteMany({ recipient: userId });
    }


async getNotificationById(notificationId: string): Promise<INotification | null> {
    return await NotificationsModel.findById(notificationId);
}

async markAllAsRead(userId: string): Promise<void> {
    await NotificationsModel.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } }
    );
}

}
