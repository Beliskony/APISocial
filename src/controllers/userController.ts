// src/api/controllers/user.controller.ts
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { UserProvider } from "../providers/User.provider";
import { TYPES } from "../config/TYPES";
import { generateToken } from "../middlewares/auth";
import { AuthRequest } from "../middlewares/Auth.Types";
import { IUser } from "../models/User.model";

@injectable()
export class UserController {
    constructor(
        @inject(TYPES.UserProvider) private userProvider: UserProvider
    ) {}

    private generateToken(user: IUser): string {
  return generateToken({
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    phoneNumber: user.contact.phoneNumber,
    profilePicture: user.profile?.profilePicture,
    coverPicture: user.profile?.coverPicture,
    profile: user.profile,
    analytics: user.analytics,
    preferences: user.preferences,
    status: user.status
  });
}

    private sanitizeUser(user: IUser): any {
        const userObject = user.toObject ? user.toObject() : user;
        const { password, security, ...sanitizedUser } = userObject;
        return sanitizedUser;
    }

    // 🆕 Créer un nouvel utilisateur
    async createUser(req: Request, res: Response): Promise<void> {
        
        try {
            console.log("📥 Controller createUser called with body:", req.body);
            console.log('=== HEADERS ===', req.headers);
  console.log('=== BODY ===', req.body);
  console.log('=== METHOD ===', req.method);
            
            const user = req.body;
            const newUser = await this.userProvider.createUser(user);

            // Génération du token JWT
            const token = this.generateToken(newUser);
            const sanitizedUser = this.sanitizeUser(newUser);

            res.status(201).json({
                success: true,
                message: "Utilisateur créé avec succès",
                data: {
                    user: sanitizedUser,
                    token
                }
            });
                
        } catch (error: any) {
            console.error("❌ Error in createUser:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 🔐 Connexion d'un utilisateur
    async loginUser(req: Request, res: Response): Promise<void> {
        try {
            const { identifiant, password } = req.body;

            if (!identifiant || !password) {
                res.status(400).json({ 
                    success: false,
                    message: "Identifiant et mot de passe sont requis" 
                });
                return;
            }

            const user = await this.userProvider.loginUser({ identifiant, password });
            
            // Génération du token JWT
            const token = this.generateToken(user);
            const sanitizedUser = this.sanitizeUser(user);

            res.status(200).json({
                success: true,
                message: "Connexion réussie",
                data: {
                    user: sanitizedUser,
                    token
                }
            });
                
        } catch (error: any) {
            console.error("❌ Error in loginUser:", error);
            res.status(401).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 🔍 Rechercher des utilisateurs par username
    async findUserByUsername(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.params;

            if (!username || username.length < 2) {
                res.status(400).json({ 
                    success: false,
                    message: "Le nom d'utilisateur doit contenir au moins 2 caractères" 
                });
                return;
            }

            const users = await this.userProvider.findUserByUsername(username);
            const safeUsers = users.map(user => this.sanitizeUser(user));

            res.status(200).json({
                success: true,
                data: safeUsers,
                count: safeUsers.length
            });
        } catch (error: any) {
            console.error("❌ Error in findUserByUsername:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 👥 Suivre ou ne plus suivre un utilisateur
    async toggleFollow(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;        
            const { targetId } = req.params;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            if (!targetId) {
                res.status(400).json({ 
                    success: false,
                    message: "ID de l'utilisateur cible requis" 
                });
                return;
            }

            const action = await this.userProvider.toggleFollow(userId, targetId);
            
            res.status(200).json({
                success: true,
                message: `Utilisateur ${action === 'followed' ? 'suivi' : 'ne plus suivi'} avec succès`,
                action
            });
        } catch (error: any) {
            console.error("❌ Error in toggleFollow:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // ✏️ Mettre à jour le profil de l'utilisateur
    async updateUserProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const userData = req.body;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            if (!userData || Object.keys(userData).length === 0) {
                res.status(400).json({ 
                    success: false,
                    message: "Aucune donnée à mettre à jour" 
                });
                return;
            }

            const updatedUser = await this.userProvider.updateUserProfile(userId, userData);
            const sanitizedUser = this.sanitizeUser(updatedUser);

            res.status(200).json({
                success: true,
                message: "Profil mis à jour avec succès",
                data: sanitizedUser
            });
        } catch (error: any) {
            console.error("❌ Error in updateUserProfile:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 👤 Récupérer mon profil (utilisateur connecté)
    async getMe(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            const user = await this.userProvider.getMe(userId);
            
            if (!user) {
                res.status(404).json({ 
                    success: false,
                    message: "Utilisateur non trouvé" 
                });
                return;
            }

            const sanitizedUser = this.sanitizeUser(user);

            res.status(200).json({
                success: true,
                data: sanitizedUser
            });
        } catch (error: any) {
            console.error("❌ Error in getMe:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 👤 Récupérer un utilisateur par ID
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({ 
                    success: false,
                    message: "ID utilisateur requis" 
                });
                return;
            }

            const user = await this.userProvider.getUserById(userId);
            
            if (!user) {
                res.status(404).json({ 
                    success: false,
                    message: "Utilisateur non trouvé" 
                });
                return;
            }

            const sanitizedUser = this.sanitizeUser(user);

            res.status(200).json({
                success: true,
                data: sanitizedUser
            });
        } catch (error: any) {
            console.error("❌ Error in getUserById:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 💡 Récupérer les suggestions d'utilisateurs
    async getSuggestions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            const suggestions = await this.userProvider.getSuggestedUsers(userId, limit);
            const safeSuggestions = suggestions.map(user => this.sanitizeUser(user));

            res.status(200).json({
                success: true,
                data: safeSuggestions,
                count: safeSuggestions.length
            });
        } catch (error: any) {
            console.error("❌ Error in getSuggestions:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 🆕 NOUVELLES FONCTIONNALITÉS SOCIALES

    // 🔎 Recherche avancée d'utilisateurs
    async searchUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { q, limit, page } = req.query;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            const users = await this.userProvider.searchUsers(q as string, userId);
            const safeUsers = users.map(user => this.sanitizeUser(user));

            res.status(200).json({
                success: true,
                data: safeUsers,
                count: safeUsers.length
            });
        } catch (error: any) {
            console.error("❌ Error in searchUsers:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 🚫 Bloquer un utilisateur
    async blockUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { targetId } = req.params;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            if (!targetId) {
                res.status(400).json({ 
                    success: false,
                    message: "ID de l'utilisateur cible requis" 
                });
                return;
            }

            await this.userProvider.blockUser(userId, targetId);

            res.status(200).json({
                success: true,
                message: "Utilisateur bloqué avec succès"
            });
        } catch (error: any) {
            console.error("❌ Error in blockUser:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // ✅ Débloquer un utilisateur
    async unblockUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { targetId } = req.params;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            if (!targetId) {
                res.status(400).json({ 
                    success: false,
                    message: "ID de l'utilisateur cible requis" 
                });
                return;
            }

            await this.userProvider.unblockUser(userId, targetId);

            res.status(200).json({
                success: true,
                message: "Utilisateur débloqué avec succès"
            });
        } catch (error: any) {
            console.error("❌ Error in unblockUser:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // ⚙️ Mettre à jour les paramètres de confidentialité
    async updatePrivacySettings(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const privacySettings = req.body;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            const updatedUser = await this.userProvider.updatePrivacySettings(userId, privacySettings);
            const sanitizedUser = this.sanitizeUser(updatedUser);

            res.status(200).json({
                success: true,
                message: "Paramètres de confidentialité mis à jour",
                data: sanitizedUser
            });
        } catch (error: any) {
            console.error("❌ Error in updatePrivacySettings:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 🛑 Désactiver le compte
    async deactivateAccount(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { reason } = req.body;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            await this.userProvider.deactivateAccount(userId, reason);

            res.status(200).json({
                success: true,
                message: "Compte désactivé avec succès"
            });
        } catch (error: any) {
            console.error("❌ Error in deactivateAccount:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // 📋 Récupérer la liste des utilisateurs bloqués
    async getBlockedUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: "Utilisateur non authentifié" 
                });
                return;
            }

            const blockedUsers = await this.userProvider.getBlockedUsers(userId);
            const safeBlockedUsers = blockedUsers.map(user => this.sanitizeUser(user));

            res.status(200).json({
                success: true,
                data: safeBlockedUsers,
                count: safeBlockedUsers.length
            });
        } catch (error: any) {
            console.error("❌ Error in getBlockedUsers:", error);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }


    // NOUVELLES MÉTHODES PASSWORD RESET
initiatePasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, usernameOrFullName } = req.body;

    await this.userProvider.initiatePasswordReset({
      phoneNumber,
      usernameOrFullName
    });

    res.status(200).json({
      success: true,
      message: "Code de réinitialisation envoyé par SMS"
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

verifyResetCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, code } = req.body;

    const isValid = await this.userProvider.verifyResetCode({
      phoneNumber,
      code
    });

    res.status(200).json({
      success: true,
      valid: isValid,
      message: "Code vérifié avec succès"
    });

  } catch (error: any) {
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, code, newPassword } = req.body;

    await this.userProvider.resetPassword({
      phoneNumber,
      code,
      newPassword
    });

    res.status(200).json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });

  } catch (error: any) {
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

}