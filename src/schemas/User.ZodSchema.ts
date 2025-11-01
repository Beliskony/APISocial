// src/core/validation/user.validation.ts
import { z } from "zod";

// Schémas de base réutilisables
const BaseProfileSchema = z.object({
  fullName: z.string()
    .min(1, "Le nom complet est requis")
    .max(100, "Le nom complet ne peut pas dépasser 100 caractères")
    .optional(),
  bio: z.string()
    .max(500, "La bio ne peut pas dépasser 500 caractères")
    .optional(),
  website: z.string()
    .url("URL invalide")
    .or(z.literal(""))
    .optional(),
  location: z.string()
    .max(100, "La localisation ne peut pas dépasser 100 caractères")
    .optional(),
  birthDate: z.string()
    .datetime("Date de naissance invalide")
    .or(z.date())
    .optional(),
  profilePicture: z.string()
    .url("URL d'image invalide")
    .optional(),
  coverPicture: z.string()
    .url("URL d'image invalide")
    .optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .default("prefer_not_to_say"),
});

const ContactSchema = z.object({
  phoneNumber: z.string()
    .regex(/^(\+?\d{10,20})$/, "Numéro de téléphone invalide")
    .min(10, "Le numéro de téléphone doit contenir au moins 10 chiffres")
    .max(20, "Le numéro de téléphone ne peut pas dépasser 20 chiffres")
    .optional(),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
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

// ============================================================================
// SCHÉMAS PRINCIPAUX - STRUCTURE CORRIGÉE (sans double body)
// ============================================================================

// Schéma de création d'utilisateur - CORRIGÉ
export const CreateUserZodSchema = z.object({
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
  profile: BaseProfileSchema.optional().default({}),
  contact: ContactSchema.optional().default({
    emailVerified: false,
    phoneVerified: false
  }),
}).refine(data => {
  // Validation croisée : si phoneNumber est fourni, il doit être dans contact aussi
  if (data.phoneNumber && data.contact) {
    return data.contact.phoneNumber === data.phoneNumber;
  }
  return true;
}, {
  message: "Le numéro de téléphone doit être cohérent entre les champs",
  path: ["phoneNumber"]
});

// Schéma de connexion - CORRIGÉ
export const LoginZodSchema = z.object({
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
});

// Schéma de mise à jour de profil - CORRIGÉ
export const UpdateProfileZodSchema = z.object({
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
  contact: ContactSchema.optional(),
});

// ============================================================================
// SCHÉMAS AVEC PARAMS (pour les routes avec ID)
// ============================================================================

// Schéma pour les routes avec userId dans les params
export const UserIdParamsSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "ID utilisateur requis")
  })
});

// Schéma pour les routes avec targetId dans les params
export const TargetIdParamsSchema = z.object({
  targetId: z.string().min(1, "ID de l'utilisateur cible requis"),
});

// Schéma de follow/unfollow - CORRIGÉ
export const FollowZodSchema = TargetIdParamsSchema;

// Schéma de blocage d'utilisateur - CORRIGÉ
export const BlockUserZodSchema = TargetIdParamsSchema;

// Schéma de récupération d'utilisateur par ID - CORRIGÉ
export const GetUserByIdZodSchema = UserIdParamsSchema;

// ============================================================================
// SCHÉMAS DE RECHERCHE ET PARAMÈTRES
// ============================================================================

// Schéma de recherche d'utilisateurs - CORRIGÉ
export const SearchUsersZodSchema = z.object({
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
});

// Schéma de suggestions d'utilisateurs - CORRIGÉ
export const SuggestedUsersZodSchema = z.object({
  limit: z.string()
    .regex(/^\d+$/, "La limite doit être un nombre")
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 50, "La limite doit être entre 1 et 50")
    .optional()
    .default("10"),
});

// ============================================================================
// SCHÉMAS DE PARAMÈTRES
// ============================================================================

// Schéma de paramètres de confidentialité - CORRIGÉ
export const PrivacySettingsZodSchema = PrivacySettingsSchema;

// Schéma de paramètres de notification - CORRIGÉ
export const NotificationSettingsZodSchema = NotificationSettingsSchema;

// Schéma de désactivation de compte - CORRIGÉ
export const DeactivateAccountZodSchema = z.object({
  reason: z.string()
    .max(500, "La raison ne peut pas dépasser 500 caractères")
    .optional(),
});

// Schéma de mise à jour des préférences - CORRIGÉ
export const UpdatePreferencesZodSchema = z.object({
  privacy: PrivacySettingsSchema.optional(),
  notifications: NotificationSettingsSchema.optional(),
  language: z.string().min(2, "La langue doit contenir au moins 2 caractères").optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
});

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

// Types TypeScript générés à partir des schémas
export type CreateUserInput = z.infer<typeof CreateUserZodSchema>;
export type LoginInput = z.infer<typeof LoginZodSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileZodSchema>;
export type SearchUsersInput = z.infer<typeof SearchUsersZodSchema>;
export type PrivacySettingsInput = z.infer<typeof PrivacySettingsZodSchema>;
export type NotificationSettingsInput = z.infer<typeof NotificationSettingsZodSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesZodSchema>;
export type UserIdParams = z.infer<typeof UserIdParamsSchema>;
export type TargetIdParams = z.infer<typeof TargetIdParamsSchema>;

// ============================================================================
// MIDDLEWARES DE VALIDATION
// ============================================================================

// Middleware pour valider le body
export const validateBody = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      console.log('🔍 Body reçu:', req.body);
      
      const result = schema.parse(req.body);
      
      req.body = result;
      console.log('✅ Body validé:', req.body);
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('❌ Erreur validation:', error.errors);
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          errors: error.errors.map(err => ({
            code: "invalid_type",
            path: err.path,
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Middleware pour valider les params
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      console.log('🔍 Params reçus:', req.params);
      
      const result = schema.parse(req.params);
      
      req.params = result;
      console.log('✅ Params validés:', req.params);
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Paramètres invalides",
          errors: error.errors
        });
      }
      next(error);
    }
  };
};

// Middleware pour valider les query params
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      console.log('🔍 Query reçu:', req.query);
      
      const result = schema.parse(req.query);
      
      req.query = result;
      console.log('✅ Query validé:', req.query);
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Paramètres de requête invalides",
          errors: error.errors
        });
      }
      next(error);
    }
  };
};