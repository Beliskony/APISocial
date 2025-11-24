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

export interface GrowthMetrics {
  userGrowth: { daily: number; weekly: number; monthly: number };
  contentGrowth: { daily: number; weekly: number; monthly: number };
  engagementGrowth: { daily: number; weekly: number; monthly: number };
}

export interface ReportData {
  contentId: string;
  contentType: 'post' | 'comment' | 'user' | 'story';
  reason: string;
  reporterId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

export interface AuditLogData {
  adminId: string;
  action: string;
  targetType: 'user' | 'post' | 'comment' | 'system' | 'admin';
  targetId?: string;
  details: any;
  ipAddress: string;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  postsPerUser: number;
  commentsPerPost: number;
  sharesPerPost: number;
  retentionRates: {
    day1: number;
    day7: number;
    day30: number;
  };
}


@injectable()
export class AdminService {
    private readonly AUDIT_LOG_COLLECTION = 'audit_logs';
  private readonly REPORTS_COLLECTION = 'content_reports';

  // ==================== 📊 SERVICE D'ANALYTIQUES AVANCÉES ====================

  public async getAdvancedAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    engagement: EngagementMetrics;
    growth: GrowthMetrics;
    topPerformers: any;
  }> {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    const [
      dailyActiveUsers,
      monthlyActiveUsers,
      totalPosts,
      totalComments,
      totalUsers,
      newUsersThisMonth,
      topPosts,
      topUsers
    ] = await Promise.all([
      // Utilisateurs actifs aujourd'hui
      UserModel.countDocuments({
        'status.lastLogin': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      
      // Utilisateurs actifs ce mois
      UserModel.countDocuments({
        'status.lastLogin': {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      
      // Métriques de contenu
      PostModel.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      CommentModel.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      UserModel.countDocuments(),
      
      // Nouveaux utilisateurs ce mois
      UserModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      
      // Top posts (par engagement)
      PostModel.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { 
          $project: {
            engagement: { $add: [
              { $size: { $ifNull: ['$interactions.likes', []] } },
              { $size: { $ifNull: ['$interactions.comments', []] } },
              { $size: { $ifNull: ['$interactions.shares', []] } }
            ]},
            title: 1,
            author: 1,
            createdAt: 1
          }
        },
        { $sort: { engagement: -1 } },
        { $limit: 10 }
      ]),
      
      // Top utilisateurs (par activité)
      UserModel.aggregate([
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'author',
            as: 'userPosts'
          }
        },
        {
          $project: {
            username: 1,
            email: 1,
            'profile.profilePicture': 1,
            activityScore: {
              $add: [
                { $size: '$userPosts' },
                { $multiply: [{ $size: { $ifNull: ['$social.followers', []] } }, 0.1] }
              ]
            },
            postCount: { $size: '$userPosts' },
            followerCount: { $size: { $ifNull: ['$social.followers', []] } }
          }
        },
        { $sort: { activityScore: -1 } },
        { $limit: 10 }
      ])
    ]);

    const engagement: EngagementMetrics = {
      dailyActiveUsers,
      monthlyActiveUsers,
      averageSessionDuration: 5.2, // À adapter avec vos données
      postsPerUser: totalUsers > 0 ? totalPosts / totalUsers : 0,
      commentsPerPost: totalPosts > 0 ? totalComments / totalPosts : 0,
      sharesPerPost: 2.1, // À adapter avec vos données
      retentionRates: {
        day1: 65,
        day7: 45,
        day30: 25
      }
    };

    const growth: GrowthMetrics = {
      userGrowth: {
        daily: newUsersThisMonth / 30,
        weekly: newUsersThisMonth / 4,
        monthly: newUsersThisMonth
      },
      contentGrowth: {
        daily: totalPosts / 30,
        weekly: totalPosts / 4,
        monthly: totalPosts
      },
      engagementGrowth: {
        daily: totalComments / 30,
        weekly: totalComments / 4,
        monthly: totalComments
      }
    };

    return {
      engagement,
      growth,
      topPerformers: {
        topPosts,
        topUsers
      }
    };
  }

  // ==================== 🚨 SERVICE DE REPORTING & SIGNALEMENTS ====================

  public async reportContent(reportData: ReportData): Promise<void> {
    const db = AdminModel.db;
    const reportsCollection = db.collection(this.REPORTS_COLLECTION);

    const report = {
      ...reportData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      _id: new Types.ObjectId()
    };

    await reportsCollection.insertOne(report);
  }

  public async getPendingReports(page: number = 1, limit: number = 20): Promise<{
    reports: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const db = AdminModel.db;
    const reportsCollection = db.collection(this.REPORTS_COLLECTION);

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      reportsCollection
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      reportsCollection.countDocuments({ status: 'pending' })
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async handleReport(
    reportId: string, 
    action: 'approve' | 'reject' | 'ban', 
    adminId: string,
    moderatorNotes?: string
  ): Promise<void> {
    const db = AdminModel.db;
    const reportsCollection = db.collection(this.REPORTS_COLLECTION);

    const updateData = {
      status: action === 'approve' ? 'resolved' : 'rejected',
      moderatorNotes,
      handledAt: new Date(),
      handledBy: adminId,
      actionTaken: action
    };

    const result = await reportsCollection.updateOne(
      { _id: new Types.ObjectId(reportId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Report non trouvé");
    }

    // Logger l'action
    await this.logAuditAction({
      adminId,
      action: `report_handled_${action}`,
      targetType: 'system',
      targetId: reportId,
      details: { action, moderatorNotes },
      ipAddress: '127.0.0.1'
    });
  }

  public async getReportStats(): Promise<{
    pending: number;
    resolved: number;
    rejected: number;
    total: number;
  }> {
    const db = AdminModel.db;
    const reportsCollection = db.collection(this.REPORTS_COLLECTION);

    const [pending, resolved, rejected, total] = await Promise.all([
      reportsCollection.countDocuments({ status: 'pending' }),
      reportsCollection.countDocuments({ status: 'resolved' }),
      reportsCollection.countDocuments({ status: 'rejected' }),
      reportsCollection.countDocuments()
    ]);

    return {
      pending,
      resolved,
      rejected,
      total
    };
  }

  // ==================== 📝 SERVICE D'AUDIT & LOGS ====================

  public async logAuditAction(auditData: AuditLogData): Promise<void> {
    const db = AdminModel.db;
    const auditCollection = db.collection(this.AUDIT_LOG_COLLECTION);

    const logEntry = {
      ...auditData,
      timestamp: new Date(),
      _id: new Types.ObjectId()
    };

    await auditCollection.insertOne(logEntry);
  }

  public async getAuditLogs(filters: {
    adminId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    targetType?: string;
  }, page: number = 1, limit: number = 50): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const db = AdminModel.db;
    const auditCollection = db.collection(this.AUDIT_LOG_COLLECTION);

    const query: any = {};
    
    if (filters.adminId) query.adminId = filters.adminId;
    if (filters.action) query.action = { $regex: filters.action, $options: 'i' };
    if (filters.targetType) query.targetType = filters.targetType;
    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {};
      if (filters.dateFrom) query.timestamp.$gte = filters.dateFrom;
      if (filters.dateTo) query.timestamp.$lte = filters.dateTo;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      auditCollection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      auditCollection.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getAuditStats(): Promise<{
    totalActions: number;
    actionsToday: number;
    topAdmins: any[];
  }> {
    const db = AdminModel.db;
    const auditCollection = db.collection(this.AUDIT_LOG_COLLECTION);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalActions,
      actionsToday,
      topAdmins
    ] = await Promise.all([
      auditCollection.countDocuments(),
      auditCollection.countDocuments({ timestamp: { $gte: today } }),
      auditCollection.aggregate([
        {
          $group: {
            _id: '$adminId',
            actionCount: { $sum: 1 },
            lastAction: { $max: '$timestamp' }
          }
        },
        { $sort: { actionCount: -1 } },
        { $limit: 5 }
      ]).toArray()
    ]);

    return {
      totalActions,
      actionsToday,
      topAdmins
    };
  }


  
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