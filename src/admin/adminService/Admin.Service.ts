import { injectable } from "inversify";
import UserModel from "../../models/User.model";
import PostModel from "../../models/Post.model";
import CommentModel from "../../models/Comment.model";
import StoryModel from "../../models/Story.model";
import NotificationsModel from "../../models/Notifications.model";
import AdminModel, { IAdmin } from "../adminModel/Admin.Model";
import cloudinary from "../../config/cloudinary";
import { Model } from "mongoose";
import { hash, compare } from "bcryptjs";
import { Types } from "mongoose";

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalStories: number;
  activeUsers: number;
  newUsersThisWeek: number;
  moderationQueue: {
    pendingPosts: number;
    flaggedComments: number;
    reportedContent: number;
  };
}

export interface UserManagementData {
  userId: string;
  action: 'suspend' | 'activate' | 'delete';
  reason?: string;
  duration?: number; // en heures
}

@injectable()
export class AdminService {
  // ✅ CREATE ADMIN
  public async createAdmin(adminData: IAdmin): Promise<IAdmin> {
    const existingAdmin = await AdminModel.findOne({
      $or: [{ email: adminData.email }, { username: adminData.username }]
    });

    if (existingAdmin) {
      throw new Error("Un admin avec cet email ou username existe déjà");
    }

    const hashedPassword = await hash(adminData.password, 10);
    const newAdmin = new AdminModel({ 
      ...adminData, 
      password: hashedPassword
    });

    return await newAdmin.save();  
  }

  // ✅ ADMIN LOGIN
  public async adminLogin(email: string, password: string): Promise<IAdmin> {
    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      throw new Error("Admin non trouvé");
    }

    const isPasswordValid = await compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error("Mot de passe incorrect");
    }

    // Mettre à jour le statut de connexion
    await AdminModel.findByIdAndUpdate(admin._id, {
      $set: {
        'status.lastLogin': new Date(),
        'status.loginAttempts': 0
      }
    });

    return admin;
  }

  // ✅ GET ADMIN PROFILE
  public async getAdminProfile(adminId: string): Promise<IAdmin> {
    const admin = await AdminModel.findById(adminId);
    if (!admin) {
      throw new Error("Admin non trouvé");
    }
    return admin;
  }

  // ✅ GET DASHBOARD STATS
  public async getDashboardStats(): Promise<AdminStats> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalStories,
      activeUsers,
      newUsersThisWeek,
      pendingPosts,
      flaggedComments
    ] = await Promise.all([
      UserModel.countDocuments(),
      PostModel.countDocuments(),
      CommentModel.countDocuments(),
      StoryModel.countDocuments(),
      UserModel.countDocuments({ 'status.isActive': true }),
      UserModel.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      PostModel.countDocuments({ 'status.moderationStatus': 'pending' }),
      CommentModel.countDocuments({ 'status.moderationStatus': 'flagged' })
    ]);

    return {
      totalUsers,
      totalPosts,
      totalComments,
      totalStories,
      activeUsers,
      newUsersThisWeek,
      moderationQueue: {
        pendingPosts,
        flaggedComments,
        reportedContent: pendingPosts + flaggedComments
      }
    };
  }

  // ✅ USER MANAGEMENT
  public async manageUser(userData: UserManagementData): Promise<void> {
    const user = await UserModel.findById(userData.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    switch (userData.action) {
      case 'suspend':
        user.status.isActive = false;
        user.status.suspendedUntil = userData.duration 
          ? new Date(Date.now() + userData.duration * 60 * 60 * 1000)
          : undefined;
        user.status.deactivationReason = userData.reason || 'Suspended by admin';
        break;

      case 'activate':
        user.status.isActive = true;
        user.status.suspendedUntil = undefined;
        user.status.deactivationReason = undefined;
        break;

      case 'delete':
        await this.deleteUserComplet(userData.userId);
        return;
    }

    await user.save();
  }

  // ✅ GET ALL USERS WITH PAGINATION
  public async getAllUsers(page: number = 1, limit: number = 20): Promise<{
    users: any[],
    total: number,
    page: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find()
        .select('-password -security')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments()
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ✅ GET ALL POSTS WITH PAGINATION
  public async getAllPosts(page: number = 1, limit: number = 20): Promise<{
    posts: any[],
    total: number,
    page: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      PostModel.find()
        .populate('author', 'username profile.profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments()
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ✅ MODERATE CONTENT
  public async moderateContent(
    contentId: string, 
    contentType: 'post' | 'comment', 
    action: 'approve' | 'reject' | 'flag'
  ): Promise<void> {
    let model: Model<any>;
    
    if (contentType === 'post') {
      model = PostModel;
    } else if (contentType === 'comment') {
      model = CommentModel;
    } else {
      throw new Error("Type de contenu non supporté");
    }

    const updateData = {
      'status.moderationStatus': action === 'approve' ? 'approved' : 
                                action === 'reject' ? 'rejected' : 'flagged'
    };

    const result = await model.findByIdAndUpdate(
      contentId, 
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      throw new Error("Contenu non trouvé");
    }
  }

  // ✅ DELETE USER COMPLETELY (CORRIGÉ)
  async deleteUserComplet(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("Utilisateur introuvable");

    // 1️⃣ Récupérer toutes les publications de l'utilisateur
    const posts = await PostModel.find({ author: new Types.ObjectId(userId) });

    for (const post of posts) {
      await this.deletePublication(post._id.toString());
    }

    // 2️⃣ Supprimer les commentaires faits par l'utilisateur
    await CommentModel.deleteMany({ author: new Types.ObjectId(userId) });

    // 3️⃣ Supprimer les stories de l'utilisateur
    const stories = await StoryModel.find({ userId: new Types.ObjectId(userId) });
    for (const story of stories) {
      if (story.content.data) {
        const publicId = this.extractPublicIdFromUrl(story.content.data);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { 
            resource_type: story.content.type === 'image' ? 'image' : 'video' 
          });
        }
      }
    }
    await StoryModel.deleteMany({ userId: new Types.ObjectId(userId) });

    // 4️⃣ Nettoyer les références sociales
    await UserModel.updateMany(
      { 
        $or: [
          { 'social.following': new Types.ObjectId(userId) },
          { 'social.followers': new Types.ObjectId(userId) },
          { 'social.friends': new Types.ObjectId(userId) }
        ] 
      },
      { 
        $pull: { 
          'social.following': new Types.ObjectId(userId),
          'social.followers': new Types.ObjectId(userId), 
          'social.friends': new Types.ObjectId(userId) 
        } 
      }
    );

    // 5️⃣ Supprimer les notifications liées
    await NotificationsModel.deleteMany({ 
      $or: [
        { sender: new Types.ObjectId(userId) }, 
        { recipient: new Types.ObjectId(userId) }
      ] 
    });

    // 6️⃣ Supprimer l'utilisateur
    await UserModel.findByIdAndDelete(userId);
  }

  // ✅ DELETE PUBLICATION (CORRIGÉ)
  async deletePublication(postId: string): Promise<void> {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error("Publication introuvable");

    const userId = post.author.toString();

    // Supprimer médias Cloudinary
    if (post.content.media?.images) {
      for (const url of post.content.media.images) {
        const publicId = this.extractPublicIdFromUrl(url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        }
      }
    }
    if (post.content.media?.videos) {
      for (const url of post.content.media.videos) {
        const publicId = this.extractPublicIdFromUrl(url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
        }
      }
    }

    // Supprimer les commentaires liés
    await CommentModel.deleteMany({ post: new Types.ObjectId(postId) });

    // Supprimer le post
    await PostModel.findByIdAndDelete(postId);

    // Retirer la référence du post chez l'utilisateur
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { 'content.posts': new Types.ObjectId(postId) }
    });
  }

  // ✅ DELETE COMMENT (CORRIGÉ)
  async deleteUnCommentaire(commentId: string): Promise<void> {
    const result = await CommentModel.findByIdAndDelete(commentId);
    if (!result) throw new Error("Commentaire introuvable");
  }

  // ✅ HELPER: EXTRACT CLOUDINARY PUBLIC ID
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      const parts = url.split("/");
      const fileWithExt = parts.pop() || "";
      const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
      const publicId = folder ? `${folder}/${fileWithExt.split(".")[0]}` : fileWithExt.split(".")[0];
      return publicId;
    } catch {
      return null;
    }
  }

  // ✅ SEARCH USERS
  public async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{
    users: any[],
    total: number,
    page: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { 'profile.firstName': { $regex: query, $options: 'i' } },
          { 'profile.lastName': { $regex: query, $options: 'i' } }
        ]
      })
      .select('-password -security')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      
      UserModel.countDocuments({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { 'profile.firstName': { $regex: query, $options: 'i' } },
          { 'profile.lastName': { $regex: query, $options: 'i' } }
        ]
      })
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}