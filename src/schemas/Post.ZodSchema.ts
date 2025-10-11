// src/core/validation/post.validation.ts
import { z } from "zod";

// Schéma de base pour les médias
const MediaSchema = z.object({
  images: z.array(z.string().url("URL d'image invalide"))
    .max(10, "Maximum 10 images autorisées")
    .optional()
    .default([]),
  videos: z.array(z.string().url("URL de vidéo invalide"))
    .max(3, "Maximum 3 vidéos autorisées")
    .optional()
    .default([]),
});

// Schéma pour la localisation
const LocationSchema = z.object({
  name: z.string().min(1, "Nom de localisation requis").max(100, "Nom trop long"),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

// Schéma pour les métadonnées
const MetadataSchema = z.object({
  tags: z.array(z.string().min(1).max(50))
    .max(20, "Maximum 20 tags")
    .optional()
    .default([]),
  mentions: z.array(z.string().min(1, "ID utilisateur requis"))
    .max(50, "Maximum 50 mentions")
    .optional()
    .default([]),
  location: LocationSchema.optional(),
  hashtags: z.array(z.string().regex(/^#[a-zA-Z0-9_]+$/, "Format de hashtag invalide"))
    .max(30, "Maximum 30 hashtags")
    .optional()
    .default([]),
});

// Schéma pour la confidentialité
const VisibilitySchema = z.object({
  privacy: z.enum(['public', 'friends', 'private', 'custom'])
    .default('public'),
  allowedUsers: z.array(z.string().min(1, "ID utilisateur requis"))
    .max(100, "Maximum 100 utilisateurs autorisés")
    .optional()
    .default([]),
});

// Schéma pour les sondages
const PollSchema = z.object({
  question: z.string()
    .min(5, "La question doit contenir au moins 5 caractères")
    .max(500, "La question ne peut pas dépasser 500 caractères"),
  options: z.array(z.string().min(1, "L'option ne peut pas être vide").max(200, "Option trop longue"))
    .min(2, "Au moins 2 options requises")
    .max(10, "Maximum 10 options"),
  endsAt: z.string().datetime("Date de fin invalide")
    .refine((date) => new Date(date) > new Date(), {
      message: "La date de fin doit être dans le futur"
    }),
  isMultiChoice: z.boolean().default(false),
});

// Schéma principal pour la création de post
export const CreatePostSchema = z.object({
  body: z.object({
    content: z.object({
      text: z.string()
        .max(5000, "Le texte ne peut pas dépasser 5000 caractères")
        .optional()
        .default(""),
      media: MediaSchema.optional().default({}),
    }),
    visibility: VisibilitySchema.optional().default({}),
    metadata: MetadataSchema.optional().default({}),
    type: z.enum(['text', 'image', 'video', 'poll', 'event', 'share'])
      .default('text'),
    poll: PollSchema.optional(),
    sharedPost: z.string().min(1, "ID de post requis").optional(),
  })
});

// Schéma pour la mise à jour de post
export const UpdatePostSchema = z.object({
  params: z.object({
    postId: z.string().min(1, "ID de post requis"),
  }),
  body: z.object({
    content: z.object({
      text: z.string()
        .max(5000, "Le texte ne peut pas dépasser 5000 caractères")
        .optional(),
      media: MediaSchema.optional(),
    }).optional(),
    visibility: VisibilitySchema.optional(),
    metadata: MetadataSchema.optional(),
  }).refine(data => {
    // Vérifier qu'au moins un champ est fourni pour la mise à jour
    return Object.keys(data).length > 0;
  }, {
    message: "Au moins un champ doit être fourni pour la mise à jour"
  })
});

// Schéma pour les paramètres d'ID de post
export const PostIdParamSchema = z.object({
  params: z.object({
    postId: z.string().min(1, "ID de post requis"),
  })
});

// Schéma pour les likes
export const LikePostSchema = z.object({
  params: z.object({
    postId: z.string().min(1, "ID de post requis"),
  })
});

// Schéma pour les sauvegardes
export const SavePostSchema = z.object({
  params: z.object({
    postId: z.string().min(1, "ID de post requis"),
  })
});

// Schéma pour le partage de post
export const SharePostSchema = z.object({
  params: z.object({
    postId: z.string().min(1, "ID de post requis"),
  }),
  body: z.object({
    text: z.string()
      .max(1000, "Le texte de partage ne peut pas dépasser 1000 caractères")
      .optional(),
  })
});

// Schéma pour les votes de sondage
export const VotePollSchema = z.object({
  params: z.object({
    postId: z.string().min(1, "ID de post requis"),
  }),
  body: z.object({
    optionIndex: z.number()
      .int("L'index doit être un nombre entier")
      .min(0, "L'index ne peut pas être négatif"),
  })
});

// Schéma pour la recherche
export const SearchPostsSchema = z.object({
  query: z.object({
    q: z.string()
      .min(2, "La requête doit contenir au moins 2 caractères")
      .max(100, "La requête ne peut pas dépasser 100 caractères"),
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
      .default("20"),
  })
});

// Schéma pour la pagination
export const PaginationSchema = z.object({
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
      .default("20"),
  })
});

// Schéma pour les posts populaires
export const PopularPostsSchema = z.object({
  query: z.object({
    limit: z.string()
      .regex(/^\d+$/, "La limite doit être un nombre")
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1 && val <= 50, "La limite doit être entre 1 et 50")
      .optional()
      .default("10"),
  })
});

// Schéma pour l'upload de médias
export const MediaUploadSchema = z.object({
  files: z.object({
    images: z.array(z.any()).max(10, "Maximum 10 images").optional(),
    videos: z.array(z.any()).max(3, "Maximum 3 vidéos").optional(),
  }).optional(),
});

// Types TypeScript générés
export type CreatePostInput = z.infer<typeof CreatePostSchema>['body'];
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>['body'];
export type SearchPostsInput = z.infer<typeof SearchPostsSchema>['query'];
export type PaginationInput = z.infer<typeof PaginationSchema>['query'];
export type SharePostInput = z.infer<typeof SharePostSchema>['body'];
export type VotePollInput = z.infer<typeof VotePollSchema>['body'];

// Export de votre schéma existant pour la rétrocompatibilité
export const PostZodSchema = z.object({
  text: z.string().max(500, "Le texte doit contenir maxi 500 caractères").optional(),
  media: z
    .object({
      images: z.array(z.string().url().optional()).max(5).optional(),
      videos: z.array(z.string().url().optional()).max(2).optional(),
    })
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type PostValidationType = z.infer<typeof PostZodSchema>;