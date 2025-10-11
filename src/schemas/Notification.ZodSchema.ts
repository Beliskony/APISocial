// src/core/validation/notification.validation.ts
import { z } from "zod";

// Schéma pour la création de notification
export const CreateNotificationSchema = z.object({
  body: z.object({
    recipientId: z.string().min(1, "ID du destinataire requis"),
    type: z.enum(['like', 'comment', 'follow', 'new_post', 'mention'], {
      errorMap: () => ({ message: "Type de notification invalide" })
    }),
    content: z.string().max(500, "Le contenu ne peut pas dépasser 500 caractères").optional(),
    postId: z.string().optional()
  })
});

// Schéma pour les paramètres d'ID de notification
export const NotificationIdParamSchema = z.object({
  params: z.object({
    notificationId: z.string().min(1, "ID de notification requis")
  })
});

// Schéma pour les paramètres de type de notification
export const NotificationTypeParamSchema = z.object({
  params: z.object({
    type: z.enum(['like', 'comment', 'follow', 'new_post', 'mention'], {
      errorMap: () => ({ message: "Type de notification invalide" })
    })
  })
});

// Schéma pour la pagination
export const PaginationQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, "Le numéro de page doit être un nombre")
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1, "Le numéro de page doit être supérieur à 0")
      .optional()
      .default("1"),
    limit: z.string()
      .regex(/^\d+$/, "La limite doit être un nombre")
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1 && val <= 100, "La limite doit être entre 1 et 100")
      .optional()
      .default("20")
  })
});

// Types TypeScript générés
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>['body'];
export type PaginationInput = z.infer<typeof PaginationQuerySchema>['query'];