import { z } from 'zod';

export const NotificationSchema = z.object({
  type: z.enum(['like', 'comment', 'follow', 'mention', 'message']), // adapte selon ton app
  content: z.string().min(1, 'Le contenu est requis'),
});

// Pour la validation de l'ID dans les routes comme markAsRead
export const NotificationIdParamSchema = z.object({
  notificationId: z.string().regex(/^[a-f\d]{24}$/i, 'ID invalide'), // pour un ObjectId MongoDB
});
