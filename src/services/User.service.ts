// src/core/services/user.service.ts
import { injectable } from "inversify";
import { hash, compare } from "bcryptjs";
import { Types } from "mongoose";
import UserModel, { IUser } from "../models/User.model";
import NotificationsModel from "../models/Notifications.model";
import { NotificationsService } from "./Notifications.Service";

export interface IUserService {
  createUser(user: IUser): Promise<IUser>;
  loginUser(params: { identifiant: string; password: string }): Promise<IUser>;
  findUserByUsername(username: string): Promise<IUser[]>;
  toggleFollow(userId: string, targetId: string): Promise<"followed" | "unfollowed">;
  updateUserProfile(userId: string, updateData: Partial<IUser>): Promise<IUser>;
  getMe(userId: string): Promise<IUser | null>;
  getUserById(userId: string): Promise<IUser | null>;
  getSuggestedUsers(userId: string, limit?: number): Promise<IUser[]>;
  searchUsers(query: string, currentUserId: string): Promise<IUser[]>;
  blockUser(userId: string, targetId: string): Promise<void>;
  unblockUser(userId: string, targetId: string): Promise<void>;
  updatePrivacySettings(userId: string, privacySettings: any): Promise<IUser>;
  deactivateAccount(userId: string, reason?: string): Promise<void>;

  // NOUVELLES FONCTIONNALITÉS MOT DE PASSE OUBLIÉ
  initiatePasswordReset(phoneNumber: string, usernameOrFullName: string): Promise<void>;
  verifyResetCode(phoneNumber: string, code: string): Promise<boolean>;
  resetPassword(phoneNumber: string, code: string, newPassword: string): Promise<void>;
}

@injectable()
export class UserService implements IUserService {
  private resetCodes = new Map<string, { code: string; expiresAt: Date; attempts: number }>();

  constructor() {
  // Nettoyer les codes expirés toutes les 5 minutes
  setInterval(() => this.cleanupExpiredCodes(), 5 * 60 * 1000);
}
  
  async createUser(user: IUser): Promise<IUser> {
  try {
    console.log("🔍 BACKEND DEBUG - Étape 1: Recherche de doublons");
    
    // Vérifier les doublons
    const existingUser = await UserModel.findOne({ 
      $or: [
        { email: user.email }, 
        { phoneNumber: user.contact.phoneNumber },
        { username: user.username }
      ] 
    });
    
    if (existingUser) {
      // ... gestion des doublons existante
    }

    console.log("🔍 BACKEND DEBUG - Étape 2: Hachage mot de passe");
    const hashedPassword = await hash(user.password, 12);
    
    console.log("🔍 BACKEND DEBUG - Étape 3: Création user MongoDB");
    const newUser = new UserModel({
      ...user,
      password: hashedPassword,
      'contact.emailVerified': false,
      'contact.phoneVerified': false,
      'analytics.loginCount': 0,
      'status.lastSeen': new Date()
    });

    console.log("🔍 BACKEND DEBUG - Étape 4: Sauvegarde user");
    await newUser.save();
    console.log("✅ BACKEND DEBUG - User sauvegardé avec ID:", newUser._id);
    
    console.log("🔍 BACKEND DEBUG - Étape 5: Création notification");

    console.log("🔍 BACKEND DEBUG - Étape 6: Conversion toJSON");
    const userJson = newUser.toJSON();
    console.log("✅ BACKEND DEBUG - Conversion réussie");

    console.log("🔍 BACKEND DEBUG - Étape 7: Retour résultat");
    return userJson as IUser;

  } catch (error: any) {
    console.log("💥 BACKEND DEBUG - Erreur dans createUser:", {
      message: error.message,
      stack: error.stack
    });
    throw new Error("Erreur lors de la création de l'utilisateur");
  }
}

  async loginUser(params: { identifiant: string; password: string }): Promise<IUser> {
    const { identifiant, password } = params;

    // Vérifier le format de l'identifiant
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifiant);
    const isPhone = /^(\+?\d{10,20})$/.test(identifiant);
    const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(identifiant);

    let searchCriteria = {};
    
    if (isEmail) {
      searchCriteria = { email: identifiant.toLowerCase() };
    } else if (isPhone) {
      searchCriteria = { phoneNumber: identifiant };
    } else if (isUsername) {
      searchCriteria = { username: identifiant };
    } else {
      throw new Error("Format d'identifiant invalide");
    }

    // Rechercher l'utilisateur
    const user = await UserModel.findOne(searchCriteria)
      .populate('content.posts')
      .populate('social.followers', 'username profile.profilePicture')
      .populate('social.following', 'username profile.profilePicture');

    if (!user) {
      throw new Error("Identifiants incorrects");
    }

    // Vérifier si le compte est actif
    if (!user.status.isActive) {
      throw new Error("Ce compte a été désactivé");
    }

    // Vérifier le mot de passe
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      // Gérer les tentatives de connexion échouées
      user.security.loginAttempts += 1;
      
      if (user.security.loginAttempts >= 5) {
        user.security.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      throw new Error("Mot de passe incorrect");
    }

    // Réinitialiser les tentatives de connexion et mettre à jour les analytics
    user.security.loginAttempts = 0;
    user.security.lockUntil = undefined;
    user.status.lastSeen = new Date();
    user.status.isOnline = true;
    user.analytics.lastLogin = new Date();
    user.analytics.loginCount += 1;

    await user.save();

    // Retourner l'utilisateur sans les champs sensibles
    return user.toJSON() as IUser;
  }

  async findUserByUsername(username: string): Promise<IUser[]> {
    const users = await UserModel.find({ 
      username: { $regex: username, $options: "i" } 
    })
    .select("-password -security -contact.phoneNumber -contact.email")
    .populate('content.posts')
    .populate('social.followers', 'username profile.profilePicture')
    .limit(20);

    return users.map(user => user.toJSON() as IUser);
  }

  async toggleFollow(userId: string, targetId: string): Promise<"followed" | "unfollowed"> {
    if (userId === targetId) {
      throw new Error("Impossible de se suivre soi-même");
    }

    const [currentUser, targetUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(targetId)
    ]);

    if (!currentUser || !targetUser) {
      throw new Error("Utilisateur introuvable");
    }

    // Vérifier si l'utilisateur est bloqué
    if (targetUser.social.blockedUsers.includes(new Types.ObjectId(userId))) {
      throw new Error("Action non autorisée");
    }

    const isFollowing = currentUser.social.following.some(id => 
      id.toString() === targetId
    );

    if (isFollowing) {
      // Unfollow
      currentUser.social.following = currentUser.social.following.filter(
        id => id.toString() !== targetId
      );
      targetUser.social.followers = targetUser.social.followers.filter(
        id => id.toString() !== userId
      );
      
      await Promise.all([currentUser.save(), targetUser.save()]);
      return "unfollowed";
    } else {
      // Follow
      currentUser.social.following.push(new Types.ObjectId(targetId));
      targetUser.social.followers.push(new Types.ObjectId(userId));

      await Promise.all([currentUser.save(), targetUser.save()]);

      // Créer une notification
      await NotificationsModel.create({
        recipient: targetId,
        sender: userId,
        type: 'follow',
        content: `${currentUser.username} vous suit maintenant`,
        isRead: false,
      });

      return "followed";
    }
  }

  async updateUserProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
  try {
    console.log("🔍 DEBUG updateUserProfile - Données reçues:", updateData);

    const updateFields: any = {};

    // Gérer les champs racine
    if (updateData.username) {
      const existingUser = await UserModel.findOne({ 
        username: updateData.username,
        _id: { $ne: userId }
      });
      if (existingUser) {
        throw new Error("Ce nom d'utilisateur est déjà pris");
      }
      updateFields.username = updateData.username;
    }

    if (updateData.email) {
      updateFields.email = updateData.email;
    }

    if (updateData.contact?.phoneNumber) {
      updateFields.phoneNumber = updateData.contact?.phoneNumber;
    }

    if (updateData.password) {
      updateFields.password = await hash(updateData.password, 12);
    }

      if (updateData.contact) {
      if (!updateFields.contact) {
        updateFields.contact = {};
      }
      if (updateData.contact.phoneVerified !== undefined) {
        updateFields.contact.phoneVerified = updateData.contact.phoneVerified;
      }
      if (updateData.contact.emailVerified !== undefined) {
        updateFields.contact.emailVerified = updateData.contact.emailVerified;
      }
      if (updateData.contact.phoneNumber !== undefined) {
        updateFields.contact.phoneNumber = updateData.contact.phoneNumber;
      }
    }

    // 🔥 CORRECTION: Gérer les champs du profile correctement
    if (updateData.profile) {
      // Initialiser l'objet profile s'il n'existe pas
      if (!updateFields.profile) {
        updateFields.profile = {};
      }

      // Mettre à jour chaque champ du profile individuellement
      if (updateData.profile.fullName !== undefined) {
        updateFields.profile.fullName = updateData.profile.fullName;
      }
      if (updateData.profile.bio !== undefined) {
        updateFields.profile.bio = updateData.profile.bio;
      }
      if (updateData.profile.website !== undefined) {
        updateFields.profile.website = updateData.profile.website;
      }
      if (updateData.profile.location !== undefined) {
        updateFields.profile.location = updateData.profile.location;
      }
      if (updateData.profile.birthDate !== undefined) {
        updateFields.profile.birthDate = updateData.profile.birthDate;
      }
      if (updateData.profile.gender !== undefined) {
        updateFields.profile.gender = updateData.profile.gender;
      }
      if (updateData.profile.profilePicture !== undefined) {
        updateFields.profile.profilePicture = updateData.profile.profilePicture;
      }
      if (updateData.profile.coverPicture !== undefined) {
        updateFields.profile.coverPicture = updateData.profile.coverPicture;
      }
    }

    console.log("🔍 DEBUG - Champs à mettre à jour:", updateFields);

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    .select('-password -security')
    .populate('content.posts')
    .populate('social.followers', 'username profile.profilePicture')
    .populate('social.following', 'username profile.profilePicture');

    if (!updatedUser) {
      throw new Error("Utilisateur non trouvé");
    }

    console.log("✅ DEBUG - Profile après mise à jour:", updatedUser.profile);

    return updatedUser.toJSON() as IUser;
  } catch (error: any) {
    console.log("❌ Erreur updateUserProfile:", error);
    throw error;
  }
}

async getMe(userId: string): Promise<IUser | null> {
  const user = await UserModel.findById(userId)
    .select("-password -security")
    .populate('content.posts')
    .populate('content.savedPosts')
    .populate('social.followers', 'username profile.profilePicture')
    .populate('social.following', 'username profile.profilePicture')
    .populate('social.friends', 'username profile.profilePicture')
    .lean(); // ← Utiliser lean() pour obtenir un objet plain JavaScript

  return user as IUser;
}

async getUserById(userId: string): Promise<IUser | null> {
  const user = await UserModel.findById(userId)
    .select("-password -security -contact.phoneNumber -contact.email")
    .populate('content.posts')
    .populate('social.followers', 'username profile.profilePicture')
    .populate('social.following', 'username profile.profilePicture')
    .lean(); // ← Utiliser lean()

  return user as IUser;
}
  async getSuggestedUsers(userId: string, limit: number = 10): Promise<IUser[]> {
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Suggestions basées sur les followers des personnes suivies
    const suggestedUsers = await UserModel.aggregate([
      {
        $match: {
          _id: { 
            $ne: new Types.ObjectId(userId),
            $nin: currentUser.social.following 
          },
          'status.isActive': true
        }
      },
      {
        $addFields: {
          commonFollowers: {
            $size: {
              $setIntersection: ["$social.followers", currentUser.social.following]
            }
          },
          followerCount: { $size: "$social.followers" }
        }
      },
      {
        $sort: {
          commonFollowers: -1,
          followerCount: -1,
          'analytics.loginCount': -1
        }
      },
      { $limit: limit },
      {
        $project: {
          password: 0,
          security: 0,
          'contact.phoneNumber': 0,
          'contact.email': 0
        }
      }
    ]);

    return suggestedUsers as IUser[];
  }

  // NOUVELLES FONCTIONNALITÉS SOCIALES

  async searchUsers(query: string, currentUserId: string): Promise<IUser[]> {
    const users = await UserModel.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { 'profile.fullName': { $regex: query, $options: "i" } }
          ]
        },
        { _id: { $ne: new Types.ObjectId(currentUserId) } },
        { 'status.isActive': true }
      ]
    })
    .select("-password -security -contact.phoneNumber -contact.email")
    .populate('social.followers', 'username profile.profilePicture')
    .limit(25);

    return users.map(user => user.toJSON() as IUser);
  }

  async blockUser(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new Error("Impossible de se bloquer soi-même");
    }

    const [currentUser, targetUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(targetId)
    ]);

    if (!currentUser || !targetUser) {
      throw new Error("Utilisateur introuvable");
    }

    // Ajouter aux listes de blocage
    if (!currentUser.social.blockedUsers.includes(new Types.ObjectId(targetId))) {
      currentUser.social.blockedUsers.push(new Types.ObjectId(targetId));
      
      // Retirer des followers/following si nécessaire
      currentUser.social.followers = currentUser.social.followers.filter(
        id => id.toString() !== targetId
      );
      currentUser.social.following = currentUser.social.following.filter(
        id => id.toString() !== targetId
      );

      await currentUser.save();
    }
  }

  async unblockUser(userId: string, targetId: string): Promise<void> {
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      throw new Error("Utilisateur introuvable");
    }

    currentUser.social.blockedUsers = currentUser.social.blockedUsers.filter(
      id => id.toString() !== targetId
    );

    await currentUser.save();
  }

  async updatePrivacySettings(userId: string, privacySettings: any): Promise<IUser> {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          'preferences.privacy': privacySettings 
        } 
      },
      { new: true, runValidators: true }
    )
    .select('-password -security');

    if (!updatedUser) {
      throw new Error("Utilisateur non trouvé");
    }

    return updatedUser.toJSON() as IUser;
  }

  async deactivateAccount(userId: string, reason?: string): Promise<void> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          'status.isActive': false,
          'status.deactivationReason': reason,
          'status.lastSeen': new Date()
        } 
      },
      { new: true }
    );

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
  }


   async initiatePasswordReset(phoneNumber: string, usernameOrFullName: string): Promise<void> {
    try {
      console.log("🔍 INITIATE PASSWORD RESET - Recherche utilisateur:", { phoneNumber, usernameOrFullName });

      // Normaliser le numéro de téléphone
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // Rechercher l'utilisateur
      const user = await UserModel.findOne({
        'contact.phoneNumber': normalizedPhone,
        'status.isActive': true
      });

      if (!user) {
        throw new Error("Aucun compte actif trouvé avec ce numéro de téléphone");
      }

      // Vérifier le nom d'utilisateur ou le nom complet
      const isUsernameMatch = user.username.toLowerCase() === usernameOrFullName.toLowerCase();
      const isFullNameMatch = user.profile.fullName?.toLowerCase().includes(usernameOrFullName.toLowerCase());

      if (!isUsernameMatch && !isFullNameMatch) {
        throw new Error("Les informations d'identification ne correspondent pas");
      }

      if (!user.contact.phoneVerified) {
        throw new Error("Le numéro de téléphone n'est pas vérifié");
      }

      // Générer et stocker le code
      const resetCode = this.generateRandomCode(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      this.resetCodes.set(normalizedPhone, {
        code: resetCode,
        expiresAt,
        attempts: 0
      });

      // Envoyer le SMS via Twilio
      const message = `Votre code de réinitialisation MyApp est: ${resetCode}. Ce code expire dans 10 minutes.`;
      await this.sendSMS(normalizedPhone, message);

      console.log("✅ CODE ENVOYÉ - Code généré:", resetCode, "pour:", normalizedPhone);

    } catch (error: any) {
      console.error("❌ ERREUR INITIATE PASSWORD RESET:", error);
      throw error;
    }
  }

  /**
   * NOUVELLE MÉTHODE: Vérifier le code de réinitialisation
   */
  async verifyResetCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      console.log("🔍 VERIFY RESET CODE - Vérification:", { phoneNumber: normalizedPhone, code });

      const resetData = this.resetCodes.get(normalizedPhone);

      if (!resetData) {
        throw new Error("Aucune demande de réinitialisation active. Veuillez recommencer.");
      }

      // Vérifier l'expiration
      if (new Date() > resetData.expiresAt) {
        this.resetCodes.delete(normalizedPhone);
        throw new Error("Le code a expiré. Veuillez demander un nouveau code.");
      }

      // Vérifier les tentatives
      if (resetData.attempts >= 3) {
        this.resetCodes.delete(normalizedPhone);
        throw new Error("Trop de tentatives échouées. Veuillez demander un nouveau code.");
      }

      // Vérifier le code
      const isValid = resetData.code === code;

      if (!isValid) {
        resetData.attempts += 1;
        this.resetCodes.set(normalizedPhone, resetData);
        
        const remainingAttempts = 3 - resetData.attempts;
        throw new Error(`Code incorrect. Il vous reste ${remainingAttempts} tentative(s).`);
      }

      console.log("✅ CODE VALIDE - Code vérifié avec succès");
      return true;

    } catch (error: any) {
      console.error("❌ ERREUR VERIFY RESET CODE:", error);
      throw error;
    }
  }

  /**
   * NOUVELLE MÉTHODE: Réinitialiser le mot de passe après vérification du code
   */
  async resetPassword(phoneNumber: string, code: string, newPassword: string): Promise<void> {
    try {
      console.log("🔍 RESET PASSWORD - Début processus");

      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // Vérifier d'abord le code
      await this.verifyResetCode(normalizedPhone, code);

      // Rechercher l'utilisateur
      const user = await UserModel.findOne({
        'contact.phoneNumber': normalizedPhone,
        'status.isActive': true
      });

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Valider le nouveau mot de passe
      if (newPassword.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      // Hacher et mettre à jour le mot de passe
      const hashedPassword = await hash(newPassword, 12);
      user.password = hashedPassword;
      user.security.lastPasswordChange = new Date();
      user.security.loginAttempts = 0; // Réinitialiser les tentatives de connexion

      await user.save();

      // Supprimer le code utilisé et envoyer un SMS de confirmation
      this.resetCodes.delete(normalizedPhone);
      
      const confirmationMessage = "Votre mot de passe MyApp a été réinitialisé avec succès. Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.";
      await this.sendSMS(normalizedPhone, confirmationMessage);

      console.log("✅ PASSWORD RESET - Mot de passe mis à jour avec succès");

    } catch (error: any) {
      console.error("❌ ERREUR RESET PASSWORD:", error);
      throw error;
    }
  }

  /**
   * Méthode utilitaire: Générer un code numérique aléatoire
   */
  private generateRandomCode(length: number = 4): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString().padStart(length, '0');
  }

  /**
   * Méthode utilitaire: Normaliser le numéro de téléphone
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Supprimer tous les caractères non numériques sauf le +
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  /**
   * Méthode utilitaire: Envoyer un SMS via Twilio
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      console.log(`📱 ENVOI SMS à: ${phoneNumber}`);
      
      // Formater le numéro pour Twilio
      const formattedNumber = this.formatPhoneNumberForTwilio(phoneNumber);

      // 🔥 INTÉGRATION TWILIO - À DÉCOMMENTER ET CONFIGURER
      
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioPhoneNumber) {
        throw new Error("Configuration Twilio manquante");
      }

      const client = require('twilio')(accountSid, authToken);

      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedNumber
      });

      console.log('✅ SMS envoyé via Twilio. SID:', result.sid);

      // 🔥 POUR TEST - À SUPPRIMER EN PRODUCTION
      console.log(`📱 [TEST] SMS serait envoyé à ${formattedNumber}: ${message}`);
      
    } catch (error: any) {
      console.error('❌ Erreur envoi SMS:', error);
      throw new Error(`Échec envoi SMS: ${error.message}`);
    }
  }

  /**
   * Méthode utilitaire: Formater le numéro pour Twilio
   */
  private formatPhoneNumberForTwilio(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si le numéro commence par 0, le convertir en format international (France)
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1);
    }
    // Si le numéro n'a pas de +, l'ajouter
    else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Méthode utilitaire: Nettoyer les codes expirés
   */
  private cleanupExpiredCodes(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [phoneNumber, data] of this.resetCodes.entries()) {
      if (now > data.expiresAt) {
        this.resetCodes.delete(phoneNumber);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Nettoyage des codes: ${cleanedCount} codes expirés supprimés`);
    }
  }


}