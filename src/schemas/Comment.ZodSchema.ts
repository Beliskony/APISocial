import { z } from 'zod';

// Schéma pour les médias
const MediaSchema = z.object({
  images: z.array(z.string().url("URL d'image invalide")).optional().default([]),
  videos: z.array(z.string().url("URL de vidéo invalide")).optional().default([])
}).optional().default({ images: [], videos: [] });

// Schéma pour le contenu
const ContentSchema = z.object({
  text: z.string().min(1, "Le texte du commentaire est requis").max(1000, "Le commentaire ne peut pas dépasser 1000 caractères"),
  media: MediaSchema
});

// Schéma pour les métadonnées
const MetadataSchema = z.object({
  mentions: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de mention invalide")).optional().default([]),
  hashtags: z.array(z.string().min(1, "Le hashtag ne peut pas être vide")).optional().default([])
}).optional().default({ mentions: [], hashtags: [] });

// ✅ Schéma pour la création de commentaire
export const CreateCommentZodSchema = z.object({
  body: z.object({
    content: ContentSchema,
    parentComment: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de commentaire parent invalide").optional(),
    metadata: MetadataSchema
  }),
  params: z.object({
    postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de post invalide")
  })
});

// ✅ Schéma pour la mise à jour de commentaire
export const UpdateCommentZodSchema = z.object({
  body: z.object({
    content: ContentSchema,
    metadata: MetadataSchema
  }),
  params: z.object({
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de commentaire invalide")
  })
});

// ✅ Schéma pour la suppression de commentaire
export const DeleteCommentZodSchema = z.object({
  params: z.object({
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de commentaire invalide")
  })
});

// ✅ Schéma pour récupérer les commentaires d'un post
export const GetCommentsZodSchema = z.object({
  params: z.object({
    postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de post invalide")
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/, "Le numéro de page doit être un nombre").transform(Number).refine(val => val > 0, {
      message: "Le numéro de page doit être supérieur à 0"
    }).optional().default("1"),
    limit: z.string().regex(/^\d+$/, "La limite doit être un nombre").transform(Number).refine(val => val > 0 && val <= 100, {
      message: "La limite doit être entre 1 et 100"
    }).optional().default("20")
  })
});

// ✅ Schéma pour récupérer les réponses d'un commentaire
export const GetCommentRepliesZodSchema = z.object({
  params: z.object({
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de commentaire invalide")
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/, "Le numéro de page doit être un nombre").transform(Number).optional().default("1"),
    limit: z.string().regex(/^\d+$/, "La limite doit être un nombre").transform(Number).optional().default("20")
  })
});

// ✅ Schéma pour like/unlike
export const ToggleLikeZodSchema = z.object({
  params: z.object({
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de commentaire invalide")
  })
});

// ✅ Schéma pour les commentaires populaires
export const GetPopularCommentsZodSchema = z.object({
  params: z.object({
    postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de post invalide")
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/, "La limite doit être un nombre").transform(Number).refine(val => val > 0 && val <= 50, {
      message: "La limite doit être entre 1 et 50"
    }).optional().default("10")
  })
});

// ✅ Schéma pour les statistiques
export const GetCommentStatsZodSchema = z.object({
  params: z.object({
    postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de post invalide")
  })
});

// Types TypeScript correspondants
export type CreateCommentValidationType = z.infer<typeof CreateCommentZodSchema>;
export type UpdateCommentValidationType = z.infer<typeof UpdateCommentZodSchema>;
export type DeleteCommentValidationType = z.infer<typeof DeleteCommentZodSchema>;
export type GetCommentsValidationType = z.infer<typeof GetCommentsZodSchema>;
export type GetCommentRepliesValidationType = z.infer<typeof GetCommentRepliesZodSchema>;
export type ToggleLikeValidationType = z.infer<typeof ToggleLikeZodSchema>;
export type GetPopularCommentsValidationType = z.infer<typeof GetPopularCommentsZodSchema>;
export type GetCommentStatsValidationType = z.infer<typeof GetCommentStatsZodSchema>;