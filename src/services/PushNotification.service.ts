// src/core/services/PushNotificationService.ts
import { Expo } from 'expo-server-sdk';

export class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    try {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Token Expo invalide: ${token}`);
        return;
      }

      // 🔥 CORRECTION : Utiliser getNavigationData au lieu de getNavigationConfig
      const navigationData = this.getNavigationData(data);

      const message = {
        to: token,
        sound: 'default' as const,
        title,
        body,
        data: {
          // 🔥 STRUCTURE UNIFIÉE POUR LE FRONTEND
          ...navigationData, // Inclut route, params, screen, etc.
          type: data?.type,
          senderId: data?.senderId,
          postId: data?.postId,
          senderUsername: data?.senderUsername,
          timestamp: new Date().toISOString(),
          _displayInForeground: true,
        },
        android: {
          channelId: 'default',
          priority: 'high' as const,
        },
        ios: {
          sound: true,
          badge: 1,
        },
      };

      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      console.log('✅ Notification push envoyée');
      
      return ticket;
    } catch (error) {
      console.error('❌ Erreur envoi notification push:', error);
      throw error;
    }
  }

  async sendToMultipleUsers(tokens: string[], title: string, body: string, data?: any) {
    try {
      console.log('🔔 [PUSH_DEBUG] Début envoi multiple');
      
      const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));

      console.log('🔔 [PUSH_DEBUG] Tokens valides:', validTokens.length);
      
      if (validTokens.length === 0) {
        console.log('Aucun token valide');
        return;
      }

      // 🔥 CORRECTION : Inclure les données de navigation
      const navigationData = this.getNavigationData(data);

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default' as const,
        title,
        body,
        data: {
          ...navigationData,
          type: data?.type,
          senderId: data?.senderId,
          postId: data?.postId,
          senderUsername: data?.senderUsername,
          timestamp: new Date().toISOString(),
          _displayInForeground: true,
        },
      }));

      const tickets = await this.expo.sendPushNotificationsAsync(messages);
      console.log(`✅ [PUSH_DEBUG] ${tickets.length} notifications envoyées`);
      
      return tickets;
    } catch (error) {
      console.error('❌ Erreur envoi multiple:', error);
      throw error;
    }
  }

  // 🔥 CORRECTION : RENOMMER EN getNavigationData ET CORRIGER LES ROUTES
  private getNavigationData(data: any): any {
    const baseConfig = {
      type: data?.type,
      timestamp: new Date().toISOString()
    };

    switch (data?.type) {
      case 'like':
      case 'comment':
      case 'mention':
      case 'new_post':
        if (data.postId) {
          return {
            ...baseConfig,
            // 🔥 CORRECTION : Routes correctes pour Expo Router
            route: '/(modals)/singlePost/[postId]',
            params: { postId: data.postId }, // 🔥 CORRECTION : utiliser data.postId, pas data._id
            screen: 'singlePost',
            targetId: data.postId
          };
        }
        break;

      case 'follow':
        if (data.senderId) {
          return {
            ...baseConfig,
            // 🔥 CORRECTION : Route correcte pour le profil
            route: '/(modals)/userProfile/[userId]',
            params: { userId: data.senderId },
            screen: 'userProfile',
            targetId: data.senderId
          };
        }
        break;

      default:
        return {
          ...baseConfig,
          route: '/(tabs)/notifications',
          screen: 'notifications'
        };
    }

    return {
      ...baseConfig,
      route: '/(tabs)/notifications',
      screen: 'notifications'
    };
  }

  // 🔥 CONFIGURATION DES NOTIFICATIONS PAR TYPE
  private getNotificationConfig(type: string, senderUsername: string) {
    const configs = {
      'like': {
        title: '❤️ Nouveau like',
        body: `${senderUsername} a aimé votre publication`
      },
      'comment': {
        title: '💬 Nouveau commentaire',
        body: `${senderUsername} a commenté votre publication`
      },
      'follow': {
        title: '👤 Nouvel abonné',
        body: `${senderUsername} vous suit maintenant`
      },
      'mention': {
        title: '📍 Mention',
        body: `${senderUsername} vous a mentionné`
      },
      'new_post': {
        title: '📝 Nouvelle publication',
        body: `${senderUsername} a publié un nouveau post`
      }
    };

    return configs[type as keyof typeof configs] || {
      title: '🔔 Nouvelle notification',
      body: `${senderUsername} vous a envoyé une notification`
    };
  }

  // 🔥 MÉTHODE SPÉCIALISÉE POUR LES NOTIFICATIONS SOCIALES
  async sendSocialNotification(
    tokens: string[],
    type: 'like' | 'comment' | 'follow' | 'mention' | 'new_post',
    senderUsername: string,
    targetData: {
      postId?: string;
      senderId?: string;
    }
  ) {
    try {
      const notificationConfig = this.getNotificationConfig(type, senderUsername);
      
      const navigationData = {
        type,
        senderId: targetData.senderId,
        postId: targetData.postId,
        senderUsername: senderUsername
      };

      console.log('🔔 [SOCIAL_NOTIFICATION] Envoi:', {
        type,
        tokens: tokens.length,
        title: notificationConfig.title,
        body: notificationConfig.body,
        navigation: this.getNavigationData(navigationData)
      });

      return await this.sendToMultipleUsers(
        tokens,
        notificationConfig.title,
        notificationConfig.body,
        navigationData
      );
    } catch (error) {
      console.error('❌ Erreur notification sociale:', error);
      throw error;
    }
  }
}