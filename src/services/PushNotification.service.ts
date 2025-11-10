// src/core/services/PushNotificationService.ts
import { Expo } from 'expo-server-sdk';

export class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    try {
      // Vérifier que le token est valide
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Token Expo invalide: ${token}`);
        return;
      }

      const message = {
        to: token,
        sound: 'default' as const,
        title,
        body,
        data: data || {},
      };

      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      console.log('✅ Notification push envoyée:', ticket);
      
      return ticket;
    } catch (error) {
      console.error('❌ Erreur envoi notification push:', error);
      throw error;
    }
  }

  async sendToMultipleUsers(tokens: string[], title: string, body: string, data?: any) {
    try {
      const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
      
      if (validTokens.length === 0) {
        console.log('Aucun token valide');
        return;
      }

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default' as const,
        title,
        body,
        data: data || {},
      }));

      const tickets = await this.expo.sendPushNotificationsAsync(messages);
      console.log(`✅ ${tickets.length} notifications envoyées`);
      
      return tickets;
    } catch (error) {
      console.error('❌ Erreur envoi multiple:', error);
      throw error;
    }
  }
}