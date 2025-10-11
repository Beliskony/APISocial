
import { Request } from "express";

export interface AuthUser {
  _id: string;                    // User ID from the JWT token
  username: string;               // Username from the JWT token
  email: string;                  // Email from the JWT token
  phoneNumber?: string;           // Optional phone number
  profilePicture?: string;        // Optional profile picture
  coverPicture?: string;          // Optional cover picture
  
  // 🆕 Nouvelles propriétés sociales
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    location?: string;
    birthDate?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  };
  
  // Statistiques sociales
  analytics?: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    friendCount: number;
  };
  
  // Paramètres de confidentialité
  preferences?: {
    privacy: {
      profile: 'public' | 'friends' | 'private';
      posts: 'public' | 'friends' | 'private';
      friendsList: 'public' | 'friends' | 'private';
    };
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  
  // Statut utilisateur
  status?: {
    isOnline: boolean;
    lastSeen: Date;
    isActive: boolean;
  };
}

export interface AuthRequest extends Request {
  user?: AuthUser; // Optional user object from the JWT token
}

// 🆕 Types pour les tokens JWT
// Dans Auth.Types.ts - version étendue de JwtPayload
export interface JwtPayload {
  _id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  coverPicture?: string;
  
  // Propriétés étendues optionnelles
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
  analytics?: {
    followerCount: number;
    followingCount: number;
    postCount: number;
  };
  
  iat?: number;
  exp?: number;
}

// 🆕 Types pour les rôles et permissions
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export interface UserPermissions {
  canCreatePosts: boolean;
  canComment: boolean;
  canMessage: boolean;
  canModerate: boolean;
  canDelete: boolean;
}

// 🆕 Interface pour le contexte d'authentification
export interface AuthContext {
  user: AuthUser;
  token: string;
  expiresAt: Date;
  permissions: UserPermissions;
}

// 🆕 Types pour les réponses d'authentification
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
    expiresIn: string;
  };
}

// 🆕 Types pour la validation des tokens
export interface TokenValidationResult {
  isValid: boolean;
  user?: AuthUser;
  error?: string;
  expiresAt?: Date;
}