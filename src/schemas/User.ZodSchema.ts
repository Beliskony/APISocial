// src/core/validation/user.validation.ts
import { z } from "zod";

// Schémas de base réutilisables
const BaseProfileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(50, "Le prénom ne peut pas dépasser 50 caractères").optional(),
  lastName: z.string().min(1, "Le nom est requis").max(50, "Le nom ne peut pas dépasser 50 caractères").optional(),
  bio: z.string().max(500, "La bio ne peut pas dépasser 500 caractères").optional(),
  website: z.string().url("URL invalide").or(z.literal("")).optional(),
  location: z.string().max(100, "La localisation ne peut pas dépasser 100 caractères").optional(),
  birthDate: z.string().datetime("Date de naissance invalide").or(z.date()).optional(),
  profilePicture: z.string().url("URL d'image invalide").optional(),
  coverPicture: z.string().url("URL d'image invalide").optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

const PrivacySettingsSchema = z.object({
  profile: z.enum(["public", "friends", "private"]).default("public"),
  posts: z.enum(["public", "friends", "private"]).default("public"),
  friendsList: z.enum(["public", "friends", "private"]).default("friends"),
});

const NotificationSettingsSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  sms: z.boolean().default(false),
  newFollower: z.boolean().default(true),
  newMessage: z.boolean().default(true),
  postLikes: z.boolean().default(true),
  postComments: z.boolean().default(true),
});

// Schéma de création d'utilisateur
export const CreateUserZodSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères")
      .regex(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"),
    email: z.string()
      .email("Format d'email invalide")
      .trim()
      .toLowerCase()
      .max(100, "L'email ne peut pas dépasser 100 caractères"),
    password: z.string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères")
      .max(100, "Le mot de passe ne peut pas dépasser 100 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    phoneNumber: z.string()
      .regex(/^(\+?\d{10,20})$/, "Numéro de téléphone invalide")
      .min(10, "Le numéro de téléphone doit contenir au moins 10 chiffres")
      .max(20, "Le numéro de téléphone ne peut pas dépasser 20 chiffres")
      .optional()
      .or(z.literal("")),
    profile: BaseProfileSchema.optional(),
  })
});

// Schéma de connexion
export const LoginZodSchema = z.object({
  body: z.object({
    identifiant: z.string()
      .min(1, "L'identifiant est requis")
      .refine((val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^(\+?\d{10,20})$/.test(val);
        const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(val);
        return isEmail || isPhone || isUsername;
      }, {
        message: "L'identifiant doit être un email, numéro de téléphone ou nom d'utilisateur valide",
      }),
    password: z.string()
      .min(1, "Le mot de passe est requis")
      .max(100, "Le mot de passe ne peut pas dépasser 100 caractères"),
  })
});

// Schéma de mise à jour de profil
export const UpdateProfileZodSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "ID utilisateur requis"),
  }),
  body: z.object({
    username: z.string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères")
      .regex(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores")
      .optional(),
    email: z.string()
      .email("Format d'email invalide")
      .trim()
      .toLowerCase()
      .max(100, "L'email ne peut pas dépasser 100 caractères")
      .optional(),
    password: z.string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères")
      .max(100, "Le mot de passe ne peut pas dépasser 100 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
      .optional(),
    phoneNumber: z.string()
      .regex(/^(\+?\d{10,20})$/, "Numéro de téléphone invalide")
      .min(10, "Le numéro de téléphone doit contenir au moins 10 chiffres")
      .max(20, "Le numéro de téléphone ne peut pas dépasser 20 chiffres")
      .optional()
      .or(z.literal("")),
    profile: BaseProfileSchema.optional(),
  })
});

// Schéma de follow/unfollow
export const FollowZodSchema = z.object({
  params: z.object({
    targetId: z.string().min(1, "ID de l'utilisateur cible requis"),
  }),
});

// Schéma de recherche d'utilisateurs
export const SearchUsersZodSchema = z.object({
  query: z.object({
    q: z.string()
      .min(2, "La requête de recherche doit contenir au moins 2 caractères")
      .max(50, "La requête de recherche ne peut pas dépasser 50 caractères"),
    limit: z.string()
      .regex(/^\d+$/, "La limite doit être un nombre")
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1 && val <= 50, "La limite doit être entre 1 et 50")
      .optional()
      .default("10"),
    page: z.string()
      .regex(/^\d+$/, "La page doit être un nombre")
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1, "La page doit être supérieure à 0")
      .optional()
      .default("1"),
  })
});

// Schéma de blocage d'utilisateur
export const BlockUserZodSchema = z.object({
  params: z.object({
    targetId: z.string().min(1, "ID de l'utilisateur cible requis"),
  }),
});

// Schéma de paramètres de confidentialité
export const PrivacySettingsZodSchema = z.object({
  body: PrivacySettingsSchema,
});

// Schéma de paramètres de notification
export const NotificationSettingsZodSchema = z.object({
  body: NotificationSettingsSchema,
});

// Schéma de désactivation de compte
export const DeactivateAccountZodSchema = z.object({
  body: z.object({
    reason: z.string()
      .max(500, "La raison ne peut pas dépasser 500 caractères")
      .optional(),
  })
});

// Schéma de suggestions d'utilisateurs
export const SuggestedUsersZodSchema = z.object({
  query: z.object({
    limit: z.string()
      .regex(/^\d+$/, "La limite doit être un nombre")
      .transform(val => parseInt(val, 10))
      .refine(val => val >= 1 && val <= 50, "La limite doit être entre 1 et 50")
      .optional()
      .default("10"),
  })
});

// Schéma de récupération d'utilisateur par ID
export const GetUserByIdZodSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "ID utilisateur requis"),
  }),
});

// Schéma de mise à jour des préférences
export const UpdatePreferencesZodSchema = z.object({
  body: z.object({
    privacy: PrivacySettingsSchema.optional(),
    notifications: NotificationSettingsSchema.optional(),
    language: z.string().min(2, "La langue doit contenir au moins 2 caractères").optional(),
    theme: z.enum(["light", "dark", "auto"]).optional(),
  })
});

// Types TypeScript générés à partir des schémas
export type CreateUserInput = z.infer<typeof CreateUserZodSchema>['body'];
export type LoginInput = z.infer<typeof LoginZodSchema>['body'];
export type UpdateProfileInput = z.infer<typeof UpdateProfileZodSchema>['body'];
export type SearchUsersInput = z.infer<typeof SearchUsersZodSchema>['query'];
export type PrivacySettingsInput = z.infer<typeof PrivacySettingsZodSchema>['body'];
export type NotificationSettingsInput = z.infer<typeof NotificationSettingsZodSchema>['body'];
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesZodSchema>['body'];

// Middleware de validation générique
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Remplacer les données de la requête par les données validées
      req.body = result.body || req.body;
      req.query = result.query || req.query;
      req.params = result.params || req.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Données de requête invalides",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};