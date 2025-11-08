// src/core/services/Notifications.Service.ts
import { injectable } from "inversify";
import { Types } from "mongoose";
import NotificationModel, { INotification } from "../models/Notifications.model";
import UserModel from "../models/User.model";

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'new_post';

export interface CreateNotificationData {
  sender: string; // ✅ SEULEMENT l'ID string
  recipient: string; // ✅ SEULEMENT l'ID string
  type: NotificationType;
  post?: string; // ✅ SEULEMENT l'ID string
  content?: string;
}

@injectable()
export class NotificationsService {
  
  // ✅ MÉTHODE PRINCIPALE REFONDUE - AVEC VALIDATION STRICTE
  async createNotification(data: CreateNotificationData): Promise<INotification> {
    try {
      console.log('🔔 NOTIFICATION - Début création:', {
        sender: data.sender,
        recipient: data.recipient,
        type: data.type,
        post: data.post
      });

      // ✅ VALIDATION STRICTE DES IDs
      this.validateNotificationData(data);

      // Vérifier que l'expéditeur et le destinataire existent
      const [sender, recipient] = await Promise.all([
        UserModel.findById(data.sender),
        UserModel.findById(data.recipient).select('preferences username')
      ]);

      if (!sender) {
        throw new Error(`Expéditeur non trouvé: ${data.sender}`);
      }
      if (!recipient) {
        throw new Error(`Destinataire non trouvé: ${data.recipient}`);
      }

      // Ne pas notifier si l'utilisateur se notifie lui-même
      if (data.sender === data.recipient) {
        console.log('📵 Notification ignorée: utilisateur se notifie lui-même');
        throw new Error("Impossible de se notifier soi-même");
      }

      // ✅ VÉRIFICATION DES PRÉFÉRENCES DE NOTIFICATIONS
      const canSend = this.canSendNotification(recipient, data.type);
      if (!canSend) {
        console.log('📵 Notifications désactivées pour:', {
          user: recipient.username,
          type: data.type
        });
        throw new Error("Notifications désactivées pour ce type");
      }

      // Générer le contenu de la notification
      const notificationContent = data.content || this.generateNotificationContent(data.type, sender.username);

      const notificationData = {
        sender: new Types.ObjectId(data.sender),
        recipient: new Types.ObjectId(data.recipient),
        type: data.type,
        content: notificationContent,
        isRead: false,
        ...(data.post && { post: new Types.ObjectId(data.post) })
      };

      const notification = new NotificationModel(notificationData);
      const savedNotification = await notification.save();

      // Populer les références pour le retour
      await savedNotification.populate([
        { path: 'sender', select: 'username profile.profilePicture' },
        { path: 'post', select: 'text media' }
      ]);

      console.log('✅ NOTIFICATION - Créée avec succès:', {
        id: savedNotification._id,
        type: savedNotification.type,
        from: sender.username,
        to: recipient.username
      });

      return savedNotification;

    } catch (error: any) {
      console.error('❌ ERREUR NOTIFICATION:', {
        message: error.message,
        data: data,
        stack: error.stack
      });
      
      // Ne pas propager les erreurs de préférences désactivées ou auto-notification
      if (error.message.includes("Notifications désactivées") || 
          error.message.includes("Impossible de se notifier soi-même")) {
        throw error; // Ces erreurs sont normales, on les laisse passer silencieusement
      }
      
      throw new Error(`Échec de la création de notification: ${error.message}`);
    }
  }

  // ✅ VALIDATION STRICTE DES DONNÉES
  private validateNotificationData(data: CreateNotificationData): void {
    const errors: string[] = [];

    // Valider sender
    if (!data.sender || typeof data.sender !== 'string') {
      errors.push('Sender doit être une string ID valide');
    } else if (!Types.ObjectId.isValid(data.sender)) {
      errors.push('Sender ID invalide');
    }

    // Valider recipient
    if (!data.recipient || typeof data.recipient !== 'string') {
      errors.push('Recipient doit être une string ID valide');
    } else if (!Types.ObjectId.isValid(data.recipient)) {
      errors.push('Recipient ID invalide');
    }

    // Valider post si présent
    if (data.post && !Types.ObjectId.isValid(data.post)) {
      errors.push('Post ID invalide');
    }

    // Valider le type
    const validTypes: NotificationType[] = ['like', 'comment', 'follow', 'mention', 'new_post'];
    if (!validTypes.includes(data.type)) {
      errors.push(`Type de notification invalide: ${data.type}`);
    }

    if (errors.length > 0) {
      throw new Error(`Données de notification invalides: ${errors.join(', ')}`);
    }
  }

  // ✅ VÉRIFICATION DES PRÉFÉRENCES
  private canSendNotification(recipient: any, type: NotificationType): boolean {
    try {
      const preferences = recipient.preferences?.notifications;
      
      if (!preferences) {
        return true; // Par défaut, autoriser si pas de préférences définies
      }

      // Vérifier d'abord les notifications push globales
      if (preferences.push === false) {
        return false;
      }

      // Mapping des types de notification vers les préférences
      const preferenceMapping: Record<NotificationType, keyof typeof preferences> = {
        'like': 'postLikes',
        'comment': 'postComments',
        'follow': 'newFollower',
        'mention': 'mentions',
        'new_post': 'newPosts'
      };

      const preferenceKey = preferenceMapping[type];
      
      // Si la préférence n'est pas définie, autoriser par défaut
      return preferences[preferenceKey] !== false;
    } catch (error) {
      console.error('❌ Erreur vérification préférences:', error);
      return true; // En cas d'erreur, autoriser par défaut
    }
  }

  // ✅ GÉNÉRATION DE CONTENU
  private generateNotificationContent(type: NotificationType, username: string): string {
    const contents: Record<NotificationType, string> = {
      'like': `${username} a aimé votre publication`,
      'comment': `${username} a commenté votre publication`,
      'follow': `${username} vous suit maintenant`,
      'mention': `${username} vous a mentionné dans une publication`,
      'new_post': `${username} a publié un nouveau post`
    };

    return contents[type] || `Nouvelle notification de ${username}`;
  }

  // ✅ RÉCUPÉRATION DES NOTIFICATIONS AVEC PAGINATION
  async getUserNotifications(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ notifications: INotification[], total: number, unreadCount: number }> {
    try {
      this.validateUserId(userId);

      const [notifications, total, unreadCount] = await Promise.all([
        NotificationModel.find({ recipient: new Types.ObjectId(userId) })
          .populate('sender', 'username profile.profilePicture')
          .populate('post', 'text media')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        
        NotificationModel.countDocuments({ recipient: new Types.ObjectId(userId) }),
        
        NotificationModel.countDocuments({ 
          recipient: new Types.ObjectId(userId), 
          isRead: false 
        })
      ]);

      console.log(`📨 Récupération notifications: ${notifications.length} sur ${total} (${unreadCount} non lues)`);

      return { notifications, total, unreadCount };
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      throw new Error('Impossible de récupérer les notifications');
    }
  }

  // ✅ MARQUER COMME LU
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    try {
      this.validateUserId(userId);
      this.validateNotificationId(notificationId);

      const notification = await NotificationModel.findOne({
        _id: new Types.ObjectId(notificationId),
        recipient: new Types.ObjectId(userId)
      });

      if (!notification) {
        throw new Error("Notification non trouvée");
      }

      notification.isRead = true;
      const savedNotification = await notification.save();

      console.log('✅ Notification marquée comme lue:', notificationId);
      return savedNotification;
    } catch (error) {
      console.error('❌ Erreur marquage comme lu:', error);
      throw error;
    }
  }

  // ✅ MARQUER TOUTES COMME LUES
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    try {
      this.validateUserId(userId);

      const result = await NotificationModel.updateMany(
        { 
          recipient: new Types.ObjectId(userId), 
          isRead: false 
        },
        { 
          isRead: true 
        }
      );

      console.log(`✅ ${result.modifiedCount} notifications marquées comme lues`);
      return { modifiedCount: result.modifiedCount || 0 };
    } catch (error) {
      console.error('❌ Erreur marquage toutes comme lues:', error);
      throw new Error('Impossible de marquer toutes les notifications comme lues');
    }
  }

  // ✅ SUPPRIMER UNE NOTIFICATION
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      this.validateUserId(userId);
      this.validateNotificationId(notificationId);

      const result = await NotificationModel.deleteOne({
        _id: new Types.ObjectId(notificationId),
        recipient: new Types.ObjectId(userId)
      });

      const deleted = result.deletedCount > 0;
      console.log(`🗑️ Notification ${notificationId} ${deleted ? 'supprimée' : 'non trouvée'}`);

      return deleted;
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
      throw new Error('Impossible de supprimer la notification');
    }
  }

  // ✅ COMPTER LES NON-LUES
  async getUnreadCount(userId: string): Promise<number> {
    try {
      this.validateUserId(userId);

      const count = await NotificationModel.countDocuments({
        recipient: new Types.ObjectId(userId),
        isRead: false
      });

      console.log(`📊 ${count} notifications non lues pour l'utilisateur ${userId}`);
      return count;
    } catch (error) {
      console.error('❌ Erreur comptage non-lues:', error);
      throw new Error('Impossible de compter les notifications non lues');
    }
  }

  // ✅ NOTIFICATIONS PAR TYPE
  async getNotificationsByType(
    userId: string, 
    type: NotificationType, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ notifications: INotification[], total: number }> {
    try {
      this.validateUserId(userId);

      const [notifications, total] = await Promise.all([
        NotificationModel.find({ 
          recipient: new Types.ObjectId(userId),
          type 
        })
          .populate('sender', 'username profile.profilePicture')
          .populate('post', 'text media')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        
        NotificationModel.countDocuments({ 
          recipient: new Types.ObjectId(userId),
          type 
        })
      ]);

      return { notifications, total };
    } catch (error) {
      console.error('❌ Erreur récupération notifications par type:', error);
      throw new Error('Impossible de récupérer les notifications par type');
    }
  }

  // ✅ MÉTHODES DE PRÉFÉRENCES
  async getUserNotificationPreferences(userId: string): Promise<any> {
    try {
      this.validateUserId(userId);

      const user = await UserModel.findById(userId).select('preferences.notifications');
      
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      return user.preferences?.notifications || this.getDefaultPreferences();
    } catch (error) {
      console.error('❌ Erreur récupération préférences:', error);
      throw error;
    }
  }

  async updateUserNotificationPreferences(userId: string, updates: Partial<any>): Promise<any> {
    try {
      this.validateUserId(userId);

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            'preferences.notifications': updates 
          } 
        },
        { 
          new: true, 
          runValidators: true,
          fields: 'preferences.notifications'
        }
      );

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      console.log('✅ Préférences notifications mises à jour pour:', userId);
      return user.preferences.notifications;
    } catch (error) {
      console.error('❌ Erreur mise à jour préférences:', error);
      throw new Error('Impossible de mettre à jour les préférences de notifications');
    }
  }

  // ✅ NETTOYAGE DES ANCIENNES NOTIFICATIONS
  async cleanupOldNotifications(daysOld: number = 30): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await NotificationModel.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      console.log(`🧹 ${result.deletedCount} anciennes notifications nettoyées`);
      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
      throw new Error('Impossible de nettoyer les anciennes notifications');
    }
  }

  // ✅ VALIDATION DES IDs
  private validateUserId(userId: string): void {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new Error('ID utilisateur invalide');
    }
  }

  private validateNotificationId(notificationId: string): void {
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      throw new Error('ID notification invalide');
    }
  }

  // ✅ PRÉFÉRENCES PAR DÉFAUT
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