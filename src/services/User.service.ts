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
}

@injectable()
export class UserService implements IUserService {
  
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
      .populate('social.followers', 'username profilePicture')
      .populate('social.following', 'username profilePicture');

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
    .populate('social.followers', 'username profilePicture')
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
    const allowedFields = [
      'username', 'profilePicture', 'email', 'phoneNumber', 'password',
      'profile.bio', 'profile.website', 'profile.location', 'profile.birthDate',
      'profile.gender', 'profile.coverPicture'
    ];

    const updateFields: any = {};

    // Filtrer et traiter les champs autorisés
    for (const field of allowedFields) {
      if (field in updateData) {
        if (field === 'password') {
          updateFields.password = await hash((updateData as any).password, 12);
        } else if (field === 'username') {
          // Vérifier l'unicité du username
          const existingUser = await UserModel.findOne({ 
            username: (updateData as any).username,
            _id: { $ne: userId }
          });
          if (existingUser) {
            throw new Error("Ce nom d'utilisateur est déjà pris");
          }
          updateFields[field] = (updateData as any)[field];
        } else {
          updateFields[field] = (updateData as any)[field];
        }
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    .select('-password -security')
    .populate('content.posts')
    .populate('social.followers', 'username profilePicture')
    .populate('social.following', 'username profilePicture');

    if (!updatedUser) {
      throw new Error("Utilisateur non trouvé");
    }

    return updatedUser.toJSON() as IUser;
  }

  async getMe(userId: string): Promise<IUser | null> {
    const user = await UserModel.findById(userId)
      .select("-password -security")
      .populate('content.posts')
      .populate('content.savedPosts')
      .populate('social.followers', 'username profilePicture')
      .populate('social.following', 'username profilePicture')
      .populate('social.friends', 'username profilePicture');

    return user ? user.toJSON() as IUser : null;
  }

  async getUserById(userId: string): Promise<IUser | null> {
    const user = await UserModel.findById(userId)
      .select("-password -security -contact.phoneNumber -contact.email")
      .populate('content.posts')
      .populate('social.followers', 'username profilePicture')
      .populate('social.following', 'username profilePicture');

    return user ? user.toJSON() as IUser : null;
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
            { 'profile.firstName': { $regex: query, $options: "i" } },
            { 'profile.lastName': { $regex: query, $options: "i" } }
          ]
        },
        { _id: { $ne: new Types.ObjectId(currentUserId) } },
        { 'status.isActive': true }
      ]
    })
    .select("-password -security -contact.phoneNumber -contact.email")
    .populate('social.followers', 'username profilePicture')
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
}