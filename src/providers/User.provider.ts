// src/core/providers/user.provider.ts
import { inject, injectable } from "inversify";
import { UserService } from "../services/User.service";
import { IUser } from "../models/User.model";
import { TYPES } from "../config/TYPES";
import { BadRequestError, NotFoundError, UnauthorizedError, ConflictError } from "../errors/custom.errors";

export type LoginParams = { identifiant: string; password: string };


export interface FollowersResponse {
  followers: any[];
  totalCount: number;
  hasMore: boolean;
}

export interface FollowingResponse {
  following: any[];
  totalCount: number;
  hasMore: boolean;}
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  };
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  profile?: {
    fullName?: string;
    bio?: string;
    website?: string;
    location?: string;
    birthDate?: Date;
    profilePicture?: string;
    coverPicture?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  };
}

export interface PrivacySettings {
  profile: 'public' | 'friends' | 'private';
  posts: 'public' | 'friends' | 'private';
  friendsList: 'public' | 'friends' | 'private';
}

@injectable()
export class UserProvider {
  constructor(
    @inject(TYPES.UserService) private userService: UserService
  ) {}

  async createUser(userData: CreateUserData): Promise<IUser> {
    try {
      // Validation basique
      if (!userData.username || !userData.email || !userData.password) {
        throw new BadRequestError("Tous les champs obligatoires doivent être remplis");
      }

      if (userData.password.length < 6) {
        throw new BadRequestError("Le mot de passe doit contenir au moins 6 caractères");
      }

      const user = await this.userService.createUser(userData as IUser);
      return user;
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new ConflictError("Erreur lors de la création de l'utilisateur");
    }
  }

  async loginUser(params: LoginParams): Promise<IUser> {
    try {
      if (!params.identifiant || !params.password) {
        throw new BadRequestError("Identifiant et mot de passe sont requis");
      }

      const user = await this.userService.loginUser(params);
      if (!user) {
        throw new UnauthorizedError("Identifiants invalides");
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError("Échec de l'authentification");
    }
  }

  async findUserByUsername(username: string): Promise<IUser[]> {
    try {
      if (!username || username.length < 2) {
        throw new BadRequestError("Le nom d'utilisateur doit contenir au moins 2 caractères");
      }

      return await this.userService.findUserByUsername(username);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors de la recherche d'utilisateurs");
    }
  }

  async toggleFollow(userId: string, targetId: string): Promise<"followed" | "unfollowed"> {
    try {
      if (!userId || !targetId) {
        throw new BadRequestError("ID utilisateur et ID cible sont requis");
      }

      return await this.userService.toggleFollow(userId, targetId);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors de l'opération de follow/unfollow");
    }
  }

  async updateUserProfile(userId: string, userData: UpdateProfileData): Promise<IUser> {
    try {
      if (!userId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      // Validation des données de mise à jour
      if (userData.username && userData.username.length < 3) {
        throw new BadRequestError("Le nom d'utilisateur doit contenir au moins 3 caractères");
      }

      if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        throw new BadRequestError("Format d'email invalide");
      }

      if (userData.password && userData.password.length < 6) {
        throw new BadRequestError("Le mot de passe doit contenir au moins 6 caractères");
      }
      console.log("✅ Données reçues pour update:", userData); // LOG
    console.log("✅ UserID:", userId);

      return await this.userService.updateUserProfile(userId, userData);
    } catch (error) {
      console.log("❌ Erreur détaillée dans updateUserProfile:", error); 
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors de la mise à jour du profil");
    }
  }

  async getMe(userId: string): Promise<IUser> {
    try {
      if (!userId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      const user = await this.userService.getMe(userId);
      if (!user) {
        throw new NotFoundError("Utilisateur non trouvé");
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Erreur lors de la récupération du profil");
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      if (!userId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError("Utilisateur non trouvé");
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Erreur lors de la récupération de l'utilisateur");
    }
  }

  async getSuggestedUsers(userId: string, limit: number = 10): Promise<IUser[]> {
    try {
      if (!userId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      if (limit > 50) {
        throw new BadRequestError("La limite ne peut pas dépasser 50 utilisateurs");
      }

      return await this.userService.getSuggestedUsers(userId, limit);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors de la récupération des suggestions");
    }
  }

  // NOUVELLES FONCTIONNALITÉS SOCIALES

  async searchUsers(query: string, currentUserId: string): Promise<IUser[]> {
    try {
      if (!query || query.length < 2) {
        throw new BadRequestError("La requête de recherche doit contenir au moins 2 caractères");
      }

      if (!currentUserId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      return await this.userService.searchUsers(query, currentUserId);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors de la recherche d'utilisateurs");
    }
  }

  async blockUser(userId: string, targetId: string): Promise<void> {
    try {
      if (!userId || !targetId) {
        throw new BadRequestError("ID utilisateur et ID cible sont requis");
      }

      await this.userService.blockUser(userId, targetId);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors du blocage de l'utilisateur");
    }
  }

  async unblockUser(userId: string, targetId: string): Promise<void> {
    try {
      if (!userId || !targetId) {
        throw new BadRequestError("ID utilisateur et ID cible sont requis");
      }

      await this.userService.unblockUser(userId, targetId);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors du déblocage de l'utilisateur");
    }
  }

  async updatePrivacySettings(userId: string, privacySettings: PrivacySettings): Promise<IUser> {
    try {
      if (!userId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      // Validation des paramètres de confidentialité
      const validPrivacyValues = ['public', 'friends', 'private'];
      if (
        !validPrivacyValues.includes(privacySettings.profile) ||
        !validPrivacyValues.includes(privacySettings.posts) ||
        !validPrivacyValues.includes(privacySettings.friendsList)
      ) {
        throw new BadRequestError("Paramètres de confidentialité invalides");
      }

      return await this.userService.updatePrivacySettings(userId, privacySettings);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors de la mise à jour des paramètres de confidentialité");
    }
  }

  async deactivateAccount(userId: string, reason?: string): Promise<void> {
    try {
      if (!userId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      await this.userService.deactivateAccount(userId, reason);
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      throw new Error("Erreur lors de la désactivation du compte");
    }
  }

  async getBlockedUsers(userId: string): Promise<IUser[]> {
    try {
      if (!userId) {
        throw new BadRequestError("ID utilisateur requis");
      }

      const user = await this.userService.getMe(userId);
      if (!user) {
        throw new NotFoundError("Utilisateur non trouvé");
      }

      // Récupérer les détails des utilisateurs bloqués
      const blockedUsers = await Promise.all(
        (user as any).social.blockedUsers.map((blockedId: string) => 
          this.userService.getUserById(blockedId)
        )
      );

      return blockedUsers.filter(Boolean) as IUser[];
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Erreur lors de la récupération des utilisateurs bloqués");
    }
  }

  // 🔍 Vérifier si l'utilisateur est suivi par un autre utilisateur
  async isFollowedBy(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      if (!currentUserId || !targetUserId) {
        throw new BadRequestError("IDs utilisateur requis");
      }

      const targetUser = await this.userService.getUserById(targetUserId);
      if (!targetUser) {
        throw new NotFoundError("Utilisateur cible non trouvé");
      }

      // Vérifier si currentUserId est dans les followers de targetUser
      return (targetUser as any).social.followers.some((followerId: string) => 
        followerId.toString() === currentUserId
      );
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) throw error;
      throw new Error("Erreur lors de la vérification des abonnés");
    }
  }
   
  }